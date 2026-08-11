"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function normalizeDueDate(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function revalidateTodoPaths(noteId: string | null) {
  if (noteId) revalidatePath(`/notes/${noteId}`);
  revalidatePath("/todos");
  revalidatePath("/notes");
}

export async function addTodo(
  noteId: string | null,
  text: string,
  dueDate?: string | null,
  checklistBlockId?: string | null
) {
  const { supabase, user } = await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: user.id,
      note_id: noteId,
      checklist_block_id: noteId ? checklistBlockId ?? null : null,
      text: trimmed,
      done: false,
      due_date: normalizeDueDate(dueDate),
    })
    .select("*")
    .single();

  if (error) throw error;

  revalidateTodoPaths(noteId);
  return data;
}

/** Jump to the to-dos page with the composer focused. */
export async function goToNewTodo() {
  redirect("/todos?new=1");
}

export async function toggleTodo(
  id: string,
  noteId: string | null,
  done: boolean
) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("todos")
    .update({
      done,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) throw error;

  revalidateTodoPaths(noteId);
}

export async function deleteTodo(id: string, noteId: string | null) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;

  revalidateTodoPaths(noteId);
}

export async function updateTodoText(
  id: string,
  noteId: string | null,
  text: string
) {
  const { supabase } = await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("todos")
    .update({ text: trimmed })
    .eq("id", id);

  if (error) throw error;

  revalidateTodoPaths(noteId);
}

export async function updateTodoDueDate(
  id: string,
  noteId: string | null,
  dueDate: string | null
) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("todos")
    .update({ due_date: normalizeDueDate(dueDate) })
    .eq("id", id);

  if (error) throw error;

  revalidateTodoPaths(noteId);
}
