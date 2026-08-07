import Link from "next/link";
import type { Tag } from "@/lib/types/database";
import { formatTagLabel } from "@/lib/utils/tags";

interface TagChipsProps {
  tags: Tag[];
  activeTagId?: string;
  /** Destination path for filter links. Defaults to notes list. */
  basePath?: "/notes" | "/todos";
}

export function TagChips({
  tags,
  activeTagId,
  basePath = "/notes",
}: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={basePath}
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
            href={`${basePath}?tag=${tag.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-[var(--teal)] text-white"
                : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
            }`}
          >
            {formatTagLabel(tag.name)}
          </Link>
        );
      })}
    </div>
  );
}
