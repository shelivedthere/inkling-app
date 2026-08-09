"use client";

import Link from "next/link";
import {
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { deleteNote } from "@/app/actions/notes";
import type { NoteWithTags } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/dates";
import { tagColorClasses } from "@/lib/utils/tag-colors";
import { formatTagLabel } from "@/lib/utils/tags";

interface NoteListProps {
  notes: NoteWithTags[];
}

const REVEAL_WIDTH = 84;
const OPEN_THRESHOLD = 48;

function previewText(note: NoteWithTags) {
  const text = note.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") return "Empty note";
  const body = text.body.trim();
  if (!body) return "Empty note";
  return body.length > 120 ? `${body.slice(0, 120)}…` : body;
}

export function NoteList({ notes }: NoteListProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (notes.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          No notes yet
        </p>
        <p className="mt-2 text-sm text-[var(--ink)]/55">
          Tap New note to start scribbling.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note, index) => (
        <NoteListItem
          key={note.id}
          note={note}
          index={index}
          isOpen={openId === note.id}
          onOpenChange={(nextOpen) =>
            setOpenId(nextOpen ? note.id : null)
          }
        />
      ))}
    </ul>
  );
}

interface NoteListItemProps {
  note: NoteWithTags;
  index: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function NoteListItem({
  note,
  index,
  isOpen,
  onOpenChange,
}: NoteListItemProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const didSwipe = useRef(false);
  const axisLock = useRef<"x" | "y" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const offset =
    dragOffset ?? (isOpen ? -REVEAL_WIDTH : 0);

  function confirmAndDelete() {
    if (
      !confirm(
        `Delete “${note.title?.trim() || "Untitled"}”? This can’t be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      await deleteNote(note.id);
      onOpenChange(false);
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // Desktop delete uses the hover icon; keep mouse drags for text selection.
    if (event.pointerType === "mouse") return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    startOffset.current = isOpen ? -REVEAL_WIDTH : 0;
    didSwipe.current = false;
    axisLock.current = null;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (!axisLock.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisLock.current === "x") {
        setIsDragging(true);
        cardRef.current?.setPointerCapture(event.pointerId);
      }
    }

    if (axisLock.current !== "x") return;

    didSwipe.current = true;
    const next = Math.min(
      0,
      Math.max(-REVEAL_WIDTH, startOffset.current + dx)
    );
    setDragOffset(next);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    const wasDragging = axisLock.current === "x";
    const currentOffset = dragOffset ?? (isOpen ? -REVEAL_WIDTH : 0);
    setIsDragging(false);
    axisLock.current = null;
    setDragOffset(null);

    if (!wasDragging) return;

    onOpenChange(currentOffset <= -OPEN_THRESHOLD);
  }

  return (
    <li
      className="animate-fade-up relative overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="absolute inset-y-0 right-0 flex w-[84px]">
        <button
          type="button"
          onClick={confirmAndDelete}
          disabled={isPending}
          className="flex w-full items-center justify-center bg-red-500 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
          aria-label={`Delete ${note.title || "Untitled"}`}
        >
          {isPending ? "…" : "Delete"}
        </button>
      </div>

      <div
        ref={cardRef}
        className={`group relative touch-pan-y bg-[var(--paper)] ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Link
          href={`/notes/${note.id}`}
          onClick={(event) => {
            if (didSwipe.current || isOpen) {
              event.preventDefault();
              if (isOpen) onOpenChange(false);
            }
          }}
          className="block rounded-2xl border-2 border-[var(--ink)]/8 bg-white/75 px-5 py-4 shadow-[3px_3px_0_rgba(26,26,26,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--coral)]/40 hover:shadow-[4px_4px_0_rgba(255,92,77,0.15)]"
        >
          <div className="flex items-start justify-between gap-3 pr-8">
            <h2 className="text-lg font-bold text-[var(--ink)]">
              {note.title || "Untitled"}
            </h2>
            <time className="shrink-0 text-xs font-medium text-[var(--ink)]/40">
              {formatRelativeDate(note.updated_at)}
            </time>
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--ink)]/60">
            {previewText(note)}
          </p>
          {note.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagColorClasses(tag.color, "soft")}`}
                >
                  {formatTagLabel(tag.name)}
                </span>
              ))}
            </div>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            confirmAndDelete();
          }}
          disabled={isPending}
          className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-[var(--ink)]/35 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 md:inline-flex"
          aria-label={`Delete ${note.title || "Untitled"}`}
          title="Delete note"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      aria-hidden
    >
      <path
        d="M4.5 6h11M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6.5 15V6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9v4.5M11.5 9v4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
