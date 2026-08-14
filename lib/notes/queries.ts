import { createClient } from "@/lib/supabase/server";
import type {
  ContentBlock,
  NoteWithTags,
  Tag,
  TagWithUsage,
  Todo,
} from "@/lib/types/database";
import { compareTodosByCompletedAt, compareTodosByDueDate } from "@/lib/utils/dates";
import { DEFAULT_TAG_COLOR, resolveTagColor } from "@/lib/utils/tag-colors";
import { normalizeTableBlock } from "@/lib/utils/table";
import { normalizeTagName } from "@/lib/utils/tags";

function asTag(value: unknown): Tag | null {
  if (!value || typeof value !== "object") return null;
  const tag = value as Partial<Tag>;
  if (!tag.id || !tag.name) return null;
  return {
    id: tag.id,
    user_id: tag.user_id ?? "",
    name: tag.name,
    color: resolveTagColor(tag.color ?? DEFAULT_TAG_COLOR),
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
    ? (row.content as ContentBlock[]).map((block) => {
        if (!block || typeof block !== "object" || block.type !== "table") {
          return block;
        }
        const normalized = normalizeTableBlock(block);
        return {
          ...block,
          headers: normalized.headers,
          rows: normalized.rows,
          showSumRow: normalized.showSumRow,
        };
      })
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
      color,
      created_at
    )
  )
`;

export async function getNotes(tagIds?: string[]): Promise<NoteWithTags[]> {
  const supabase = await createClient();
  const filters = (tagIds ?? []).filter(Boolean);

  let query = supabase
    .from("notes")
    .select(noteSelect)
    .order("updated_at", { ascending: false });

  if (filters.length > 0) {
    const { data: tagged, error: tagError } = await supabase
      .from("note_tags")
      .select("note_id")
      .in("tag_id", filters);

    if (tagError) throw tagError;

    const noteIds = [
      ...new Set((tagged ?? []).map((row) => row.note_id as string)),
    ];
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
    .select("id, user_id, name, color, created_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Tag[]).map((tag) => ({
    ...tag,
    color: resolveTagColor(tag.color),
  }));
}

export async function getTagsWithUsage(): Promise<TagWithUsage[]> {
  const supabase = await createClient();

  const [tagsResult, noteTagsResult, todoTagsResult] = await Promise.all([
    supabase
      .from("tags")
      .select("id, user_id, name, color, created_at")
      .order("name", { ascending: true }),
    supabase.from("note_tags").select("tag_id"),
    supabase.from("todo_tags").select("tag_id, todos ( note_id )"),
  ]);

  if (tagsResult.error) throw tagsResult.error;
  if (noteTagsResult.error) throw noteTagsResult.error;
  if (todoTagsResult.error) throw todoTagsResult.error;

  const noteCounts = new Map<string, number>();
  for (const row of noteTagsResult.data ?? []) {
    const tagId = String(row.tag_id);
    noteCounts.set(tagId, (noteCounts.get(tagId) ?? 0) + 1);
  }

  const standaloneTodoCounts = new Map<string, number>();
  for (const row of todoTagsResult.data ?? []) {
    const record = row as {
      tag_id: string;
      todos?: { note_id: string | null } | { note_id: string | null }[] | null;
    };
    const todo = Array.isArray(record.todos)
      ? record.todos[0]
      : record.todos;
    // Only count tags on standalone to-dos (no parent note).
    if (todo && todo.note_id != null) continue;
    if (!todo) continue;
    const tagId = String(record.tag_id);
    standaloneTodoCounts.set(
      tagId,
      (standaloneTodoCounts.get(tagId) ?? 0) + 1
    );
  }

  return ((tagsResult.data ?? []) as Tag[])
    .map((tag) => ({
      ...tag,
      color: resolveTagColor(tag.color),
      noteCount: noteCounts.get(tag.id) ?? 0,
      standaloneTodoCount: standaloneTodoCounts.get(tag.id) ?? 0,
    }))
    .sort((a, b) =>
      normalizeTagName(a.name).localeCompare(normalizeTagName(b.name))
    );
}

export async function getTodosForNote(noteId: string): Promise<Todo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as Todo[]).map((todo) => ({
    ...todo,
    checklist_block_id: todo.checklist_block_id ?? null,
    due_date: todo.due_date ?? null,
  }));
}

export interface OpenTodo extends Todo {
  /** Null when the to-do is standalone (no parent note) */
  noteTitle: string | null;
  tags: Tag[];
}

function tagsFromJoinRows(entries: unknown) {
  if (!Array.isArray(entries)) return [] as Tag[];
  return entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const tagsField = (entry as { tags?: unknown }).tags;
      if (Array.isArray(tagsField)) return asTag(tagsField[0]);
      return asTag(tagsField);
    })
    .filter((tag): tag is Tag => Boolean(tag));
}

function tagsFromNoteRow(note: Record<string, unknown> | null | undefined) {
  if (!note) return [] as Tag[];
  return tagsFromJoinRows(note.note_tags);
}

export async function getOpenTodos(tagIds?: string[]): Promise<OpenTodo[]> {
  return getTodos({ tagIds, done: false });
}

export async function getTodos(options?: {
  tagIds?: string[];
  /** Defaults to open (false). Pass true for completed to-dos. */
  done?: boolean;
}): Promise<OpenTodo[]> {
  const supabase = await createClient();
  const filters = (options?.tagIds ?? []).filter(Boolean);
  const done = options?.done ?? false;

  let filterNoteIds: string[] | null = null;
  let filterTodoIds: string[] | null = null;

  if (filters.length > 0) {
    const [noteTagged, todoTagged] = await Promise.all([
      supabase.from("note_tags").select("note_id").in("tag_id", filters),
      supabase.from("todo_tags").select("todo_id").in("tag_id", filters),
    ]);

    if (noteTagged.error) throw noteTagged.error;
    if (todoTagged.error) throw todoTagged.error;

    filterNoteIds = [
      ...new Set((noteTagged.data ?? []).map((row) => row.note_id as string)),
    ];
    filterTodoIds = [
      ...new Set((todoTagged.data ?? []).map((row) => row.todo_id as string)),
    ];

    if (filterNoteIds.length === 0 && filterTodoIds.length === 0) return [];
  }

  let query = supabase
    .from("todos")
    .select(
      `
      id,
      user_id,
      note_id,
      checklist_block_id,
      text,
      done,
      due_date,
      created_at,
      completed_at,
      notes (
        id,
        title,
        note_tags (
          tags (
            id,
            user_id,
            name,
            color,
            created_at
          )
        )
      ),
      todo_tags (
        tags (
          id,
          user_id,
          name,
          color,
          created_at
        )
      )
    `
    )
    .eq("done", done);

  if (filterNoteIds && filterTodoIds) {
    const clauses: string[] = [];
    if (filterNoteIds.length > 0) {
      clauses.push(`note_id.in.(${filterNoteIds.join(",")})`);
    }
    if (filterTodoIds.length > 0) {
      clauses.push(`id.in.(${filterTodoIds.join(",")})`);
    }
    query = query.or(clauses.join(","));
  }

  const { data, error } = await query;
  if (error) throw error;

  const todos = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const notesField = record.notes;
    const note = (
      Array.isArray(notesField) ? notesField[0] : notesField
    ) as Record<string, unknown> | null | undefined;
    const noteId =
      record.note_id == null || record.note_id === ""
        ? null
        : String(record.note_id);
    const isStandalone = noteId == null;

    return {
      id: String(record.id),
      user_id: String(record.user_id),
      note_id: noteId,
      checklist_block_id:
        record.checklist_block_id == null || record.checklist_block_id === ""
          ? null
          : String(record.checklist_block_id),
      text: String(record.text ?? ""),
      done: Boolean(record.done),
      due_date: (record.due_date as string | null) ?? null,
      created_at: String(record.created_at),
      completed_at: (record.completed_at as string | null) ?? null,
      noteTitle: note
        ? String(note.title || "Untitled note")
        : null,
      // Note-linked to-dos keep inheriting the parent note's tags.
      // Standalone to-dos use their own todo_tags attachments.
      tags: isStandalone
        ? tagsFromJoinRows(record.todo_tags)
        : tagsFromNoteRow(note),
    };
  });

  return done
    ? todos.sort(compareTodosByCompletedAt)
    : todos.sort(compareTodosByDueDate);
}
