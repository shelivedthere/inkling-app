import Link from "next/link";
import {
  buildTagFilterHref,
  todosListFilterParams,
  type TodoStatusFilter,
} from "@/lib/utils/tags";
import {
  coerceTodoDueFilter,
  type TodoDueFilter,
} from "@/lib/utils/dates";

interface TodoStatusChipsProps {
  status: TodoStatusFilter;
  due?: TodoDueFilter;
  activeTagIds?: string[];
}

export function TodoStatusChips({
  status,
  due = "all",
  activeTagIds = [],
}: TodoStatusChipsProps) {
  const openDue = coerceTodoDueFilter(due, false);
  const closedDue = coerceTodoDueFilter(due, true);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={buildTagFilterHref(
          "/todos",
          activeTagIds,
          todosListFilterParams({ status: "open", due: openDue })
        )}
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
        href={buildTagFilterHref(
          "/todos",
          activeTagIds,
          todosListFilterParams({ status: "closed", due: closedDue })
        )}
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
