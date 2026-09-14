"use client";

import { useMemo } from "react";
import { TodoList } from "@/components/todos/todo-list";
import type { OpenTodo, Tag } from "@/lib/types/database";

interface FocusTodosSectionProps {
  todos: OpenTodo[];
  allTags: Tag[];
  filter: (todo: OpenTodo) => boolean;
  emptyTitle: string;
  emptyHint?: string;
}

/** Filters with the visitor’s local calendar so day/week boundaries match their clock. */
export function FocusTodosSection({
  todos,
  allTags,
  filter,
  emptyTitle,
  emptyHint = "Open to-dos without a due date stay on the full to-do list.",
}: FocusTodosSectionProps) {
  const focusTodos = useMemo(() => todos.filter(filter), [todos, filter]);

  if (focusTodos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/12 bg-white/40 px-5 py-8 text-center">
        <p className="text-sm font-medium text-[var(--ink)]/60">{emptyTitle}</p>
        <p className="mt-1 text-xs text-[var(--ink)]/45">{emptyHint}</p>
      </div>
    );
  }

  return <TodoList todos={focusTodos} allTags={allTags} />;
}
