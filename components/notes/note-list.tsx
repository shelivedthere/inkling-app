import Link from "next/link";
import type { NoteWithTags } from "@/lib/types/database";
import { formatRelativeDate } from "@/lib/utils/dates";

interface NoteListProps {
  notes: NoteWithTags[];
}

function previewText(note: NoteWithTags) {
  const text = note.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") return "Empty note";
  const body = text.body.trim();
  if (!body) return "Empty note";
  return body.length > 120 ? `${body.slice(0, 120)}…` : body;
}

export function NoteList({ notes }: NoteListProps) {
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
        <li
          key={note.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <Link
            href={`/notes/${note.id}`}
            className="block rounded-2xl border-2 border-[var(--ink)]/8 bg-white/75 px-5 py-4 shadow-[3px_3px_0_rgba(26,26,26,0.04)] transition hover:-translate-y-0.5 hover:border-[var(--coral)]/40 hover:shadow-[4px_4px_0_rgba(255,92,77,0.15)]"
          >
            <div className="flex items-start justify-between gap-3">
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
                    className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--teal-dark)]"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
