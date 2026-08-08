"use client";

import {
  addTagToNote,
  attachTagToNote,
  removeTagFromNote,
} from "@/app/actions/tags";
import { TagsEditor } from "@/components/tags/tags-editor";
import type { Tag } from "@/lib/types/database";

interface NoteTagsEditorProps {
  noteId: string;
  initialTags: Tag[];
  allTags: Tag[];
}

export function NoteTagsEditor({
  noteId,
  initialTags,
  allTags,
}: NoteTagsEditorProps) {
  return (
    <TagsEditor
      initialTags={initialTags}
      allTags={allTags}
      onAdd={(name) => addTagToNote(noteId, name)}
      onAttach={(tagId) => attachTagToNote(noteId, tagId)}
      onRemove={(tagId) => removeTagFromNote(noteId, tagId)}
    />
  );
}
