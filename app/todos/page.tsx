import { AppNav } from "@/components/app-nav";
import { TagChips } from "@/components/notes/tag-chips";
import { StandaloneTodoComposer } from "@/components/todos/standalone-todo-composer";
import { TodoList } from "@/components/todos/todo-list";
import { TodoStatusChips } from "@/components/todos/todo-status-chips";
import { getTags, getTodos } from "@/lib/notes/queries";
import { parseTagIds, parseTodoStatus } from "@/lib/utils/tags";

interface TodosPageProps {
  searchParams: Promise<{
    tag?: string | string[];
    new?: string;
    status?: string | string[];
  }>;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const { tag, new: isNew, status: statusParam } = await searchParams;
  const activeTagIds = parseTagIds(tag);
  const status = parseTodoStatus(statusParam);
  const showingClosed = status === "closed";
  const [todos, tags] = await Promise.all([
    getTodos({ tagIds: activeTagIds, done: showingClosed }),
    getTags(),
  ]);
  const composeOpen = isNew === "1" || isNew === "true";
  const hasTagFilter = activeTagIds.length > 0;
  const statusExtra = showingClosed ? { status: "closed" } : undefined;

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
        <TodoStatusChips status={status} activeTagIds={activeTagIds} />
        <TagChips
          tags={tags}
          activeTagIds={activeTagIds}
          basePath="/todos"
          extraParams={statusExtra}
        />
      </div>

      {todos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {hasTagFilter
              ? "Nothing tagged here"
              : showingClosed
                ? "No closed to-dos yet"
                : "All clear"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/55">
            {hasTagFilter
              ? `No ${showingClosed ? "closed" : "open"} to-dos match the selected tag${activeTagIds.length === 1 ? "" : "s"}.`
              : showingClosed
                ? "Completed items will show up here."
                : "Add a to-do above, or pull one from a note checklist."}
          </p>
        </div>
      ) : (
        <TodoList todos={todos} allTags={tags} />
      )}
    </main>
  );
}
