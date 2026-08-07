import Link from "next/link";
import type { Tag } from "@/lib/types/database";

interface TagChipsProps {
  tags: Tag[];
  activeTagId?: string;
}

export function TagChips({ tags, activeTagId }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/notes"
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          !activeTagId
            ? "bg-[var(--ink)] text-white"
            : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
        }`}
      >
        All
      </Link>
      {tags.map((tag) => {
        const isActive = tag.id === activeTagId;
        return (
          <Link
            key={tag.id}
            href={`/notes?tag=${tag.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
            }`}
          >
            {tag.name}
          </Link>
        );
      })}
    </div>
  );
}
