"use client";

import { useMemo } from "react";
import { TodoList } from "@/components/todos/todo-list";
import type { OpenTodo, Tag } from "@/lib/types/database";
import {
  matchesTodoDueFilter,
  TODO_DUE_FILTER_LABELS,
  type TodoDueFilter,
} from "@/lib/utils/dates";

interface TodosFilteredListProps {
  todos: OpenTodo[];
  allTags: Tag[];
  due: TodoDueFilter;
  showingClosed: boolean;
  hasTagFilter: boolean;
  tagCount?: number;
}

export function TodosFilteredList({
  todos,
  allTags,
  due,
  showingClosed,
  hasTagFilter,
  tagCount = 0,
}: TodosFilteredListProps) {
  const filtered = useMemo(
    () => todos.filter((todo) => matchesTodoDueFilter(todo, due)),
    [todos, due]
  );

  if (filtered.length === 0) {
    const hasDueFilter = due !== "all";
    const dueLabel = TODO_DUE_FILTER_LABELS[due].toLowerCase();

    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          {hasDueFilter
            ? "Nothing in this timeframe"
            : hasTagFilter
              ? "Nothing tagged here"
              : showingClosed
                ? "No closed to-dos yet"
                : "All clear"}
        </p>
        <p className="mt-2 text-sm text-[var(--ink)]/55">
          {hasDueFilter
            ? `No ${showingClosed ? "closed" : "open"} to-dos match ${dueLabel}${hasTagFilter ? " with the selected tags" : ""}.`
            : hasTagFilter
              ? `No ${showingClosed ? "closed" : "open"} to-dos match the selected tag${tagCount === 1 ? "" : "s"}.`
              : showingClosed
                ? "Completed items will show up here."
                : "Add a to-do above, or pull one from a note checklist."}
        </p>
      </div>
    );
  }

  return <TodoList todos={filtered} allTags={allTags} />;
}
