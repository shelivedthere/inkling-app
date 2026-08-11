"use client";

import { useMemo } from "react";
import { TodoList } from "@/components/todos/todo-list";
import type { OpenTodo } from "@/lib/notes/queries";
import type { Tag } from "@/lib/types/database";
import { isDueThisWeekOrOverdue } from "@/lib/utils/dates";

interface FocusTodosSectionProps {
  todos: OpenTodo[];
  allTags: Tag[];
}

/** Filters with the visitor’s local calendar so week boundaries match their clock. */
export function FocusTodosSection({ todos, allTags }: FocusTodosSectionProps) {
  const focusTodos = useMemo(
    () =>
      todos.filter((todo) => isDueThisWeekOrOverdue(todo.due_date, todo.done)),
    [todos]
  );

  if (focusTodos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/12 bg-white/40 px-5 py-8 text-center">
        <p className="text-sm font-medium text-[var(--ink)]/60">
          Nothing due this week
        </p>
        <p className="mt-1 text-xs text-[var(--ink)]/45">
          Open to-dos without a due date stay on the full to-do list.
        </p>
      </div>
    );
  }

  return <TodoList todos={focusTodos} allTags={allTags} />;
}
