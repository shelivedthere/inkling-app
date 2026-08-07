export type ContentBlockType = "text" | "sketch" | "checklist";

export interface TextBlock {
  id: string;
  type: "text";
  body: string;
}

export interface SketchBlock {
  id: string;
  type: "sketch";
  /** SVG markup or PNG data URL */
  data: string;
}

export interface ChecklistBlock {
  id: string;
  type: "checklist";
}

export type ContentBlock = TextBlock | SketchBlock | ChecklistBlock;

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
  note_id: string;
  text: string;
  done: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface NoteTag {
  note_id: string;
  tag_id: string;
}

export interface NoteWithTags extends Note {
  tags: Tag[];
}
