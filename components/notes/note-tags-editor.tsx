"use client";

import { FormEvent, useState, useTransition } from "react";
import { addTagToNote, removeTagFromNote } from "@/app/actions/tags";
import type { Tag } from "@/lib/types/database";

interface NoteTagsEditorProps {
  noteId: string;
  initialTags: Tag[];
}

export function NoteTagsEditor({ noteId, initialTags }: NoteTagsEditorProps) {
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim().toLowerCase();
    if (!name) return;
    if (tags.some((t) => t.name === name)) {
      setDraft("");
      return;
    }

    const optimisticId = `temp-${name}`;
    setTags((prev) => [
      ...prev,
      {
        id: optimisticId,
        user_id: "",
        name,
        created_at: new Date().toISOString(),
      },
    ]);
    setDraft("");

    startTransition(async () => {
      try {
        const tag = await addTagToNote(noteId, name);
        if (!tag) {
          setTags((prev) => prev.filter((t) => t.id !== optimisticId));
          return;
        }
        setTags((prev) =>
          prev.map((t) => (t.id === optimisticId ? tag : t))
        );
      } catch {
        setTags((prev) => prev.filter((t) => t.id !== optimisticId));
      }
    });
  }

  function handleRemove(tag: Tag) {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    if (tag.id.startsWith("temp-")) return;
    startTransition(async () => {
      await removeTagFromNote(noteId, tag.id);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]/40">
        Tags
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleRemove(tag)}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--teal-dark)] transition hover:bg-red-100 hover:text-red-700"
            title="Remove tag"
          >
            {tag.name}
            <span className="text-[var(--ink)]/30 group-hover:text-red-500">
              ×
            </span>
          </button>
        ))}
        <form onSubmit={handleAdd} className="inline-flex">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="+ tag"
            disabled={isPending}
            className="w-24 rounded-full border border-dashed border-[var(--ink)]/20 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-[var(--coral)]"
          />
        </form>
      </div>
    </div>
  );
}
