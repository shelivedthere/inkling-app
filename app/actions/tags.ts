"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeTagName } from "@/lib/utils/tags";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

async function findTagByName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  normalizedName: string
) {
  // Case-insensitive exact match in case older mixed-case rows exist.
  const { data, error } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("user_id", userId)
    .ilike("name", normalizedName);

  if (error) throw error;

  const matches =
    data?.filter(
      (tag) => normalizeTagName(tag.name) === normalizedName
    ) ?? [];

  return matches[0] ?? null;
}

export async function addTagToNote(noteId: string, name: string) {
  const { supabase, user } = await requireUser();
  const trimmed = normalizeTagName(name);
  if (!trimmed) return null;

  let tag = await findTagByName(supabase, user.id, trimmed);

  if (tag && tag.name !== trimmed) {
    const { data: normalized, error: normalizeError } = await supabase
      .from("tags")
      .update({ name: trimmed })
      .eq("id", tag.id)
      .select("id, user_id, name, created_at")
      .single();

    if (normalizeError) throw normalizeError;
    tag = normalized;
  }

  if (!tag) {
    const { data: created, error: createError } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: trimmed })
      .select("id, user_id, name, created_at")
      .single();

    if (createError) {
      // Race: another request created it — reuse that row.
      const raced = await findTagByName(supabase, user.id, trimmed);
      if (!raced) throw createError;
      tag = raced;
    } else {
      tag = created;
    }
  }

  const { error: linkError } = await supabase.from("note_tags").upsert({
    note_id: noteId,
    tag_id: tag.id,
  });

  if (linkError) throw linkError;

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return tag;
}

export async function attachTagToNote(noteId: string, tagId: string) {
  const { supabase, user } = await requireUser();

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("id", tagId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (tagError) throw tagError;
  if (!tag) throw new Error("Tag not found");

  const { error: linkError } = await supabase.from("note_tags").upsert({
    note_id: noteId,
    tag_id: tag.id,
  });

  if (linkError) throw linkError;

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
  return tag;
}

export async function removeTagFromNote(noteId: string, tagId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) throw error;

  // Clean up orphan tags that are no longer attached to any note
  const { count } = await supabase
    .from("note_tags")
    .select("*", { count: "exact", head: true })
    .eq("tag_id", tagId);

  if (count === 0) {
    await supabase.from("tags").delete().eq("id", tagId);
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${noteId}`);
}
