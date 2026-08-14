export type ContentBlockType =
  | "text"
  | "sketch"
  | "checklist"
  | "table"
  | "image";

export interface TextBlock {
  id: string;
  type: "text";
  body: string;
}

export interface SketchBlock {
  id: string;
  type: "sketch";
  /**
   * Excalidraw scene object (preferred), or a legacy freehand SVG string.
   * Empty string means a new/blank sketch block.
   */
  data: import("./sketch").SketchBlockData | "";
}

export interface ChecklistBlock {
  id: string;
  type: "checklist";
}

/** Simple rectangular grid of plain-text cells with a header row. */
export interface TableBlock {
  id: string;
  type: "table";
  /** Column titles; length matches each data row. */
  headers: string[];
  /** Row-major data cells (excludes the header row). */
  rows: string[][];
  /** When true, show a footer row summing numeric cells per column. */
  showSumRow?: boolean;
}

/** Image stored in Supabase Storage; note JSON only keeps a reference. */
export interface ImageBlock {
  id: string;
  type: "image";
  /** Object path inside the note-images bucket (empty before upload). */
  path: string;
  /** Public URL for display (empty before upload). */
  url: string;
  /** Original filename, if known. */
  name?: string;
}

export type ContentBlock =
  | TextBlock
  | SketchBlock
  | ChecklistBlock
  | TableBlock
  | ImageBlock;

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  /** Null for standalone to-dos that are not attached to a note */
  note_id: string | null;
  /**
   * Checklist content-block id within the parent note.
   * Null for standalone to-dos, or legacy note to-dos created before
   * multi-checklist support (shown on the first checklist only).
   */
  checklist_block_id: string | null;
  text: string;
  done: boolean;
  /** ISO date string YYYY-MM-DD, or null when unset */
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  /** Curated palette key — see lib/utils/tag-colors.ts */
  color: string;
  created_at: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: string;
}

export interface TodoTag {
  todo_id: string;
  tag_id: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
}

export interface TagWithUsage extends Tag {
  noteCount: number;
  /** Standalone to-dos only (note-linked to-dos inherit note tags) */
  standaloneTodoCount: number;
}
