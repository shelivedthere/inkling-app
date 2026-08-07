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

  revalidatePath("/notes");
  redirect(`/notes/${data.id}`);
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

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/todos");
}

export async function deleteNote(id: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
  revalidatePath("/todos");
}

/** Editor flow: delete, then return to the note list. */
export async function deleteNoteAndGoToList(id: string) {
  await deleteNote(id);
  redirect("/notes");
}
