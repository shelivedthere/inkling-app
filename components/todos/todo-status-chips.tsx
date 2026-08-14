import Link from "next/link";
import {
  buildTagFilterHref,
  type TodoStatusFilter,
} from "@/lib/utils/tags";

interface TodoStatusChipsProps {
  status: TodoStatusFilter;
  activeTagIds?: string[];
}

export function TodoStatusChips({
  status,
  activeTagIds = [],
}: TodoStatusChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={buildTagFilterHref("/todos", activeTagIds)}
        aria-pressed={status === "open"}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          status === "open"
            ? "bg-[var(--ink)] text-white"
            : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
        }`}
      >
        Open
      </Link>
      <Link
        href={buildTagFilterHref("/todos", activeTagIds, { status: "closed" })}
        aria-pressed={status === "closed"}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          status === "closed"
            ? "bg-[var(--teal)] text-white"
            : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
        }`}
      >
        Closed
      </Link>
    </div>
  );
}
