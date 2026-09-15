"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ContentBlock } from "@/lib/types/database";
import { createId } from "@/lib/utils/id";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createNote() {
  const { supabase, user } = await requireUser();

  const content: ContentBlock[] = [
    { id: createId(), type: "text", body: "" },
  ];

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: "Untitled",
      content,
    })
    .select("id")
    .single();

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/notes");
  redirect(`/notes/${data.id}`);
}

/**
 * Attach a new details note to a standalone to-do via note_id.
 * Copies any todo_tags onto the note, then opens the note editor.
 * Does not set checklist_block_id — this is a freeform details note, not a checklist item.
 */
export async function createNoteForTodo(todoId: string) {
  const { supabase, user } = await requireUser();

  const { data: todo, error: todoError } = await supabase
    .from("todos")
    .select("id, text, note_id, user_id")
    .eq("id", todoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (todoError) throw todoError;
  if (!todo) throw new Error("To-do not found");
  if (todo.note_id != null) {
    redirect(`/notes/${todo.note_id}`);
  }

  const title = todo.text.trim().slice(0, 120) || "Untitled";
  const content: ContentBlock[] = [
    { id: createId(), type: "text", body: "" },
  ];

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content,
    })
    .select("id")
    .single();

  if (noteError) throw noteError;

  const { data: tagLinks, error: tagReadError } = await supabase
    .from("todo_tags")
    .select("tag_id")
    .eq("todo_id", todoId);

  if (tagReadError) throw tagReadError;

  if (tagLinks && tagLinks.length > 0) {
    const { error: tagWriteError } = await supabase.from("note_tags").upsert(
      tagLinks.map((link) => ({
        note_id: note.id,
        tag_id: link.tag_id,
      }))
    );
    if (tagWriteError) throw tagWriteError;

    const { error: tagClearError } = await supabase
      .from("todo_tags")
      .delete()
      .eq("todo_id", todoId);
    if (tagClearError) throw tagClearError;
  }

  const { error: linkError } = await supabase
    .from("todos")
    .update({ note_id: note.id })
    .eq("id", todoId)
    .eq("user_id", user.id)
    .is("note_id", null);

  if (linkError) throw linkError;

  revalidatePath("/");
  revalidatePath("/todos");
  revalidatePath("/notes");
  revalidatePath(`/notes/${note.id}`);
  redirect(`/notes/${note.id}`);
}

export async function updateNote(
  id: string,
  payload: { title?: string; content?: ContentBlock[] }
) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("notes")
    .update({
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.content !== undefined ? { content: payload.content } : {}),
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/todos");
}

export async function deleteNote(id: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/todos");
}

/** Editor flow: delete, then return to the note list. */
export async function deleteNoteAndGoToList(id: string) {
  await deleteNote(id);
  redirect("/notes");
}
