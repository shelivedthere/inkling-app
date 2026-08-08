"use client";

import {
  addTagToTodo,
  attachTagToTodo,
  removeTagFromTodo,
} from "@/app/actions/tags";
import { TagsEditor } from "@/components/tags/tags-editor";
import type { Tag } from "@/lib/types/database";

interface TodoTagsEditorProps {
  todoId: string;
  initialTags: Tag[];
  allTags: Tag[];
  compact?: boolean;
}

export function TodoTagsEditor({
  todoId,
  initialTags,
  allTags,
  compact = true,
}: TodoTagsEditorProps) {
  return (
    <TagsEditor
      initialTags={initialTags}
      allTags={allTags}
      compact={compact}
      onAdd={(name) => addTagToTodo(todoId, name)}
      onAttach={(tagId) => attachTagToTodo(todoId, tagId)}
      onRemove={(tagId) => removeTagFromTodo(todoId, tagId)}
    />
  );
}
