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

function revalidateTagPaths(noteId?: string, todoId?: string) {
  revalidatePath("/notes");
  revalidatePath("/todos");
  revalidatePath("/tags");
  if (noteId) revalidatePath(`/notes/${noteId}`);
  if (todoId) revalidatePath("/todos");
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

async function ensureTag(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string
) {
  const trimmed = normalizeTagName(name);
  if (!trimmed) return null;

  let tag = await findTagByName(supabase, userId, trimmed);

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
      .insert({ user_id: userId, name: trimmed })
      .select("id, user_id, name, created_at")
      .single();

    if (createError) {
      const raced = await findTagByName(supabase, userId, trimmed);
      if (!raced) throw createError;
      tag = raced;
    } else {
      tag = created;
    }
  }

  return tag;
}

export async function createTag(name: string) {
  const { supabase, user } = await requireUser();
  const tag = await ensureTag(supabase, user.id, name);
  if (!tag) return null;
  revalidateTagPaths();
  return tag;
}

export async function addTagToNote(noteId: string, name: string) {
  const { supabase, user } = await requireUser();
  const tag = await ensureTag(supabase, user.id, name);
  if (!tag) return null;

  const { error: linkError } = await supabase.from("note_tags").upsert({
    note_id: noteId,
    tag_id: tag.id,
  });

  if (linkError) throw linkError;

  revalidateTagPaths(noteId);
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

  revalidateTagPaths(noteId);
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

  // Leave unused tags in the pool so they can be managed / reused.
  revalidateTagPaths(noteId);
}

async function requireStandaloneTodo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  todoId: string
) {
  const { data: todo, error } = await supabase
    .from("todos")
    .select("id, note_id, user_id")
    .eq("id", todoId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!todo) throw new Error("To-do not found");
  if (todo.note_id != null) {
    throw new Error("Only standalone to-dos can have their own tags");
  }
  return todo;
}

export async function addTagToTodo(todoId: string, name: string) {
  const { supabase, user } = await requireUser();
  await requireStandaloneTodo(supabase, user.id, todoId);

  const tag = await ensureTag(supabase, user.id, name);
  if (!tag) return null;

  const { error: linkError } = await supabase.from("todo_tags").upsert({
    todo_id: todoId,
    tag_id: tag.id,
  });

  if (linkError) throw linkError;

  revalidateTagPaths(undefined, todoId);
  return tag;
}

export async function attachTagToTodo(todoId: string, tagId: string) {
  const { supabase, user } = await requireUser();
  await requireStandaloneTodo(supabase, user.id, todoId);

  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .eq("id", tagId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (tagError) throw tagError;
  if (!tag) throw new Error("Tag not found");

  const { error: linkError } = await supabase.from("todo_tags").upsert({
    todo_id: todoId,
    tag_id: tag.id,
  });

  if (linkError) throw linkError;

  revalidateTagPaths(undefined, todoId);
  return tag;
}

export async function removeTagFromTodo(todoId: string, tagId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("todo_tags")
    .delete()
    .eq("todo_id", todoId)
    .eq("tag_id", tagId);

  if (error) throw error;

  revalidateTagPaths(undefined, todoId);
}

/** Deletes the tag and all note/todo attachments. Notes and to-dos are kept. */
export async function deleteTag(tagId: string) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .eq("user_id", user.id);

  if (error) throw error;

  revalidateTagPaths();
}
