"use client";

import { useCallback } from "react";
import Link from "next/link";
import { FocusTodosSection } from "@/components/dashboard/focus-todos-section";
import type { OpenTodo, Tag } from "@/lib/types/database";
import {
  isDueLaterThisWeek,
  isDueTodayOrOverdue,
} from "@/lib/utils/dates";

interface DashboardFocusTodosProps {
  todos: OpenTodo[];
  allTags: Tag[];
}

export function DashboardFocusTodos({
  todos,
  allTags,
}: DashboardFocusTodosProps) {
  const dueToday = useCallback(
    (todo: OpenTodo) => isDueTodayOrOverdue(todo.due_date, todo.done),
    []
  );
  const dueLaterThisWeek = useCallback(
    (todo: OpenTodo) => isDueLaterThisWeek(todo.due_date, todo.done),
    []
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">Due today</h2>
            <p className="text-sm text-[var(--ink)]/50">
              Overdue and anything due today
            </p>
          </div>
          <Link
            href="/todos"
            className="text-sm font-semibold text-[var(--teal-dark)] hover:underline"
          >
            All to-dos →
          </Link>
        </div>

        <FocusTodosSection
          todos={todos}
          allTags={allTags}
          filter={dueToday}
          emptyTitle="Nothing due today"
          emptyHint="You’re clear for today — later this week shows below."
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink)]">Due this week</h2>
          <p className="text-sm text-[var(--ink)]/50">
            Tomorrow through Sunday
          </p>
        </div>

        <FocusTodosSection
          todos={todos}
          allTags={allTags}
          filter={dueLaterThisWeek}
          emptyTitle="Nothing else due this week"
          emptyHint="Open to-dos without a due date stay on the full to-do list."
        />
      </section>
    </div>
  );
}
