"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTag, deleteTag, updateTagColor } from "@/app/actions/tags";
import { TagColorPicker } from "@/components/tags/tag-color-picker";
import type { TagWithUsage } from "@/lib/types/database";
import {
  DEFAULT_TAG_COLOR,
  resolveTagColor,
  tagColorClasses,
  type TagColorId,
} from "@/lib/utils/tag-colors";
import { formatTagLabel, normalizeTagName } from "@/lib/utils/tags";

interface ManageTagsPanelProps {
  initialTags: TagWithUsage[];
}

export function ManageTagsPanel({ initialTags }: ManageTagsPanelProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] =
    useState<TagColorId>(DEFAULT_TAG_COLOR);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const name = normalizeTagName(draft);
    if (!name) return;

    if (tags.some((tag) => normalizeTagName(tag.name) === name)) {
      setDraft("");
      return;
    }

    const optimisticId = `temp-${name}`;
    const color = draftColor;
    setTags((prev) =>
      [
        ...prev,
        {
          id: optimisticId,
          user_id: "",
          name,
          color,
          created_at: new Date().toISOString(),
          noteCount: 0,
          standaloneTodoCount: 0,
        },
      ].sort((a, b) =>
        normalizeTagName(a.name).localeCompare(normalizeTagName(b.name))
      )
    );
    setDraft("");
    setDraftColor(DEFAULT_TAG_COLOR);

    startTransition(async () => {
      try {
        const created = await createTag(name, color);
        if (!created) {
          setTags((prev) => prev.filter((t) => t.id !== optimisticId));
          return;
        }
        setTags((prev) =>
          prev
            .map((t) =>
              t.id === optimisticId
                ? {
                    ...created,
                    noteCount: 0,
                    standaloneTodoCount: 0,
                  }
                : t
            )
            .sort((a, b) =>
              normalizeTagName(a.name).localeCompare(normalizeTagName(b.name))
            )
        );
        router.refresh();
      } catch {
        setTags((prev) => prev.filter((t) => t.id !== optimisticId));
      }
    });
  }

  function handleColorChange(tag: TagWithUsage, color: TagColorId) {
    const previous = resolveTagColor(tag.color);
    if (previous === color) return;

    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, color } : t))
    );
    if (tag.id.startsWith("temp-")) return;

    startTransition(async () => {
      try {
        await updateTagColor(tag.id, color);
        router.refresh();
      } catch {
        setTags((prev) =>
          prev.map((t) =>
            t.id === tag.id ? { ...t, color: previous } : t
          )
        );
      }
    });
  }

  function handleDelete(tag: TagWithUsage) {
    const total = tag.noteCount + tag.standaloneTodoCount;
    const label = formatTagLabel(tag.name);
    const message =
      total === 0
        ? `Delete unused tag “${label}”?`
        : total === 1
          ? `Delete “${label}”? It will be removed from 1 item. Notes and to-dos themselves will not be deleted.`
          : `Delete “${label}”? It will be removed from ${tag.noteCount} note${tag.noteCount === 1 ? "" : "s"} and ${tag.standaloneTodoCount} standalone to-do${tag.standaloneTodoCount === 1 ? "" : "s"}. Notes and to-dos themselves will not be deleted.`;

    if (!confirm(message)) return;

    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    if (tag.id.startsWith("temp-")) return;

    startTransition(async () => {
      try {
        await deleteTag(tag.id);
        router.refresh();
      } catch {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-3 rounded-2xl border-2 border-[var(--ink)]/8 bg-white/70 p-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="New tag name…"
            className="min-w-[12rem] flex-1 rounded-xl border border-[var(--ink)]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--coral)]"
          />
          <button
            type="submit"
            disabled={isPending || !normalizeTagName(draft)}
            className="rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Create tag
          </button>
        </div>
        <TagColorPicker
          value={draftColor}
          onChange={setDraftColor}
          disabled={isPending}
        />
      </form>

      {tags.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            No tags yet
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/55">
            Create one above, or add tags from a note or standalone to-do.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--ink)]/8 bg-white/75 px-4 py-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)]"
            >
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tagColorClasses(tag.color, "soft")}`}
                >
                  {formatTagLabel(tag.name)}
                </span>
                <p className="mt-1.5 text-xs text-[var(--ink)]/50">
                  {formatUsage(tag.noteCount, tag.standaloneTodoCount)}
                </p>
                <div className="mt-2">
                  <TagColorPicker
                    value={resolveTagColor(tag.color)}
                    onChange={(color) => handleColorChange(tag, color)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(tag)}
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600/80 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatUsage(noteCount: number, todoCount: number) {
  const notes = noteCount === 1 ? "1 note" : `${noteCount} notes`;
  const todos = todoCount === 1 ? "1 to-do" : `${todoCount} to-dos`;
  return `${notes}, ${todos}`;
}
