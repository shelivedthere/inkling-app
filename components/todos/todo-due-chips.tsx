import Link from "next/link";
import {
  CLOSED_DUE_FILTERS,
  OPEN_DUE_FILTERS,
  TODO_DUE_FILTER_LABELS,
  type TodoDueFilter,
} from "@/lib/utils/dates";
import {
  buildTagFilterHref,
  todosListFilterParams,
  type TodoStatusFilter,
} from "@/lib/utils/tags";

interface TodoDueChipsProps {
  status: TodoStatusFilter;
  due: TodoDueFilter;
  activeTagIds?: string[];
}

export function TodoDueChips({
  status,
  due,
  activeTagIds = [],
}: TodoDueChipsProps) {
  const showingClosed = status === "closed";
  const options = showingClosed ? CLOSED_DUE_FILTERS : OPEN_DUE_FILTERS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isActive = due === option;
        const href = buildTagFilterHref(
          "/todos",
          activeTagIds,
          todosListFilterParams({ status, due: option })
        );

        return (
          <Link
            key={option}
            href={href}
            aria-pressed={isActive}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              isActive
                ? showingClosed
                  ? "bg-[var(--teal)] text-white"
                  : "bg-[var(--ink)] text-white"
                : "bg-white/70 text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 hover:ring-[var(--ink)]/25"
            }`}
          >
            {TODO_DUE_FILTER_LABELS[option]}
          </Link>
        );
      })}
    </div>
  );
}
