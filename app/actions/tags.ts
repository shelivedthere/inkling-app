"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function addTagToNote(noteId: string, name: string) {
  const { supabase, user } = await requireUser();
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;

  const { data: existing, error: findError } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("name", trimmed)
    .maybeSingle();

  if (findError) throw findError;

  let tag = existing;

  if (!tag) {
    const { data: created, error: createError } = await supabase
      .from("tags")
      .insert({ user_id: user.id, name: trimmed })
      .select("id, user_id, name, created_at")
      .single();

    if (createError) throw createError;
    tag = created;
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
