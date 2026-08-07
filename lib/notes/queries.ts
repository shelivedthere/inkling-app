import { createClient } from "@/lib/supabase/server";
import type { ContentBlock, NoteWithTags, Tag, Todo } from "@/lib/types/database";

function asTag(value: unknown): Tag | null {
  if (!value || typeof value !== "object") return null;
  const tag = value as Partial<Tag>;
  if (!tag.id || !tag.name) return null;
  return {
    id: tag.id,
    user_id: tag.user_id ?? "",
    name: tag.name,
    created_at: tag.created_at ?? "",
  };
}

function mapNote(row: Record<string, unknown>): NoteWithTags {
  const noteTags = Array.isArray(row.note_tags) ? row.note_tags : [];
  const tags = noteTags
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const tagsField = (entry as { tags?: unknown }).tags;
      if (Array.isArray(tagsField)) return asTag(tagsField[0]);
      return asTag(tagsField);
    })
    .filter((tag): tag is Tag => Boolean(tag));

  const content = Array.isArray(row.content)
    ? (row.content as ContentBlock[])
    : [];

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    title: String(row.title ?? ""),
    content,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    tags,
  };
}

const noteSelect = `
  id,
  user_id,
  title,
  content,
  created_at,
  updated_at,
  note_tags (
    tags (
      id,
      user_id,
      name,
      created_at
    )
  )
`;

export async function getNotes(tagId?: string): Promise<NoteWithTags[]> {
  const supabase = await createClient();

  let query = supabase
    .from("notes")
    .select(noteSelect)
    .order("updated_at", { ascending: false });

  if (tagId) {
    const { data: tagged, error: tagError } = await supabase
      .from("note_tags")
      .select("note_id")
      .eq("tag_id", tagId);

    if (tagError) throw tagError;

    const noteIds = (tagged ?? []).map((row) => row.note_id as string);
    if (noteIds.length === 0) return [];
    query = query.in("id", noteIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => mapNote(row as Record<string, unknown>));
}

export async function getNote(id: string): Promise<NoteWithTags | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(noteSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapNote(data as Record<string, unknown>);
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, user_id, name, created_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function getTodosForNote(noteId: string): Promise<Todo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Todo[];
}

export interface OpenTodo extends Todo {
  noteTitle: string;
}

export async function getOpenTodos(): Promise<OpenTodo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select(
      `
      id,
      user_id,
      note_id,
      text,
      done,
      created_at,
      completed_at,
      notes (
        id,
        title
      )
    `
    )
    .eq("done", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const notesField = record.notes;
    const note = Array.isArray(notesField)
      ? (notesField[0] as { title?: string } | undefined)
      : (notesField as { title?: string } | null);

    return {
      id: String(record.id),
      user_id: String(record.user_id),
      note_id: String(record.note_id),
      text: String(record.text ?? ""),
      done: Boolean(record.done),
      created_at: String(record.created_at),
      completed_at: (record.completed_at as string | null) ?? null,
      noteTitle: note?.title || "Untitled note",
    };
  });
}
