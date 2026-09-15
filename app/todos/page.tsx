import { AppNav } from "@/components/app-nav";
import { TagChips } from "@/components/notes/tag-chips";
import { StandaloneTodoComposer } from "@/components/todos/standalone-todo-composer";
import { TodoDueChips } from "@/components/todos/todo-due-chips";
import { TodosFilteredList } from "@/components/todos/todos-filtered-list";
import { TodoStatusChips } from "@/components/todos/todo-status-chips";
import { getTags, getTodos } from "@/lib/notes/queries";
import {
  coerceTodoDueFilter,
  parseTodoDueFilter,
} from "@/lib/utils/dates";
import {
  parseTagIds,
  parseTodoStatus,
  todosListFilterParams,
} from "@/lib/utils/tags";

interface TodosPageProps {
  searchParams: Promise<{
    tag?: string | string[];
    new?: string;
    status?: string | string[];
    due?: string | string[];
  }>;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const {
    tag,
    new: isNew,
    status: statusParam,
    due: dueParam,
  } = await searchParams;
  const activeTagIds = parseTagIds(tag);
  const status = parseTodoStatus(statusParam);
  const showingClosed = status === "closed";
  const due = coerceTodoDueFilter(parseTodoDueFilter(dueParam), showingClosed);
  const [todos, tags] = await Promise.all([
    getTodos({ tagIds: activeTagIds, done: showingClosed }),
    getTags(),
  ]);
  const composeOpen = isNew === "1" || isNew === "true";
  const hasTagFilter = activeTagIds.length > 0;
  const listExtra = todosListFilterParams({ status, due });

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top_right,var(--coral)_0%,transparent_50%)] opacity-25"
      />

      <AppNav active="todos" />

      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">
          {showingClosed ? "Closed to-dos" : "Open to-dos"}
        </h1>
        <p className="text-sm text-[var(--ink)]/50">
          {showingClosed
            ? "Most recently completed first"
            : "Earliest due dates first · undated at the end"}
        </p>
      </div>

      {!showingClosed ? (
        <StandaloneTodoComposer autoFocus={composeOpen} />
      ) : null}

      <div className="flex flex-col gap-3">
        <TodoStatusChips
          status={status}
          due={due}
          activeTagIds={activeTagIds}
        />
        <TodoDueChips status={status} due={due} activeTagIds={activeTagIds} />
        <TagChips
          tags={tags}
          activeTagIds={activeTagIds}
          basePath="/todos"
          extraParams={listExtra}
        />
      </div>

      <TodosFilteredList
        todos={todos}
        allTags={tags}
        due={due}
        showingClosed={showingClosed}
        hasTagFilter={hasTagFilter}
        tagCount={activeTagIds.length}
      />
    </main>
  );
}
