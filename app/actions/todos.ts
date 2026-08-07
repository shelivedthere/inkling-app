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

export async function addTodo(noteId: string, text: string) {
  const { supabase, user } = await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return;

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: user.id,
      note_id: noteId,
      text: trimmed,
      done: false,
    })
    .select("*")
    .single();

  if (error) throw error;

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/todos");
  return data;
}

export async function toggleTodo(
  id: string,
  noteId: string,
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

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/todos");
}

export async function deleteTodo(id: string, noteId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("todos").delete().eq("id", id);
  if (error) throw error;

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/todos");
}

export async function updateTodoText(
  id: string,
  noteId: string,
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

  revalidatePath(`/notes/${noteId}`);
  revalidatePath("/todos");
}
