import Link from "next/link";
import type { Tag } from "@/lib/types/database";
import { tagColorClasses } from "@/lib/utils/tag-colors";
import {
  buildTagFilterHref,
  formatTagLabel,
  toggleTagId,
} from "@/lib/utils/tags";

interface TagChipsProps {
  tags: Tag[];
  /** Currently selected tag ids (OR filter). */
  activeTagIds?: string[];
  /** Destination path for filter links. Defaults to notes list. */
  basePath?: "/" | "/notes" | "/todos";
  /** Show a Manage tags link next to the chips */
  showManageLink?: boolean;
}

export function TagChips({
  tags,
  activeTagIds = [],
  basePath = "/notes",
  showManageLink = true,
}: TagChipsProps) {
  if (tags.length === 0 && !showManageLink) return null;

  const hasActiveFilters = activeTagIds.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.length > 0 ? (
        <>
          <Link
            href={basePath}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              !hasActiveFilters
                ? "bg-[var(--ink)] text-white"
                : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
            }`}
          >
            All
          </Link>
          {tags.map((tag) => {
            const isActive = activeTagIds.includes(tag.id);
            const nextIds = toggleTagId(activeTagIds, tag.id);
            return (
              <Link
                key={tag.id}
                href={buildTagFilterHref(basePath, nextIds)}
                aria-pressed={isActive}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive
                    ? tagColorClasses(tag.color, "solid")
                    : `${tagColorClasses(tag.color, "soft")} ring-1 ring-black/5 hover:brightness-[0.98]`
                }`}
              >
                {formatTagLabel(tag.name)}
              </Link>
            );
          })}
        </>
      ) : null}

      {showManageLink ? (
        <Link
          href="/tags"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]/45 transition hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]/75"
          title="Manage tags"
        >
          <ManageTagsIcon />
          Manage tags
        </Link>
      ) : null}
    </div>
  );
}

function ManageTagsIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="opacity-80"
    >
      <path
        d="M2.5 4.5h7.2M2.5 8h11M2.5 11.5h5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="9" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
