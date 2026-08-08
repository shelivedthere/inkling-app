import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { TagChips } from "@/components/notes/tag-chips";
import { StandaloneTodoComposer } from "@/components/todos/standalone-todo-composer";
import { TodoTagsEditor } from "@/components/todos/todo-tags-editor";
import { getOpenTodos, getTags } from "@/lib/notes/queries";
import { toggleTodo } from "@/app/actions/todos";
import { formatDueDate, isOverdue } from "@/lib/utils/dates";
import { formatTagLabel, parseTagIds } from "@/lib/utils/tags";

interface TodosPageProps {
  searchParams: Promise<{ tag?: string | string[]; new?: string }>;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const { tag, new: isNew } = await searchParams;
  const activeTagIds = parseTagIds(tag);
  const [todos, tags] = await Promise.all([
    getOpenTodos(activeTagIds),
    getTags(),
  ]);
  const composeOpen = isNew === "1" || isNew === "true";
  const hasTagFilter = activeTagIds.length > 0;

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top_right,var(--coral)_0%,transparent_50%)] opacity-25"
      />

      <AppNav active="todos" />

      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Open to-dos</h1>
        <p className="text-sm text-[var(--ink)]/50">
          Earliest due dates first · undated at the end
        </p>
      </div>

      <StandaloneTodoComposer autoFocus={composeOpen} />

      <TagChips
        tags={tags}
        activeTagIds={activeTagIds}
        basePath="/todos"
      />

      {todos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {hasTagFilter ? "Nothing tagged here" : "All clear"}
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/55">
            {hasTagFilter
              ? `No open to-dos match the selected tag${activeTagIds.length === 1 ? "" : "s"}.`
              : "Add a to-do above, or pull one from a note checklist."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo, index) => {
            const overdue = isOverdue(todo.due_date, todo.done);
            const isStandalone = !todo.note_id;
            return (
              <li
                key={todo.id}
                className={`animate-fade-up flex items-start gap-3 rounded-2xl border-2 bg-white/75 px-4 py-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)] ${
                  overdue
                    ? "border-red-300/80"
                    : "border-[var(--ink)]/8"
                }`}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <form
                  action={toggleTodo.bind(null, todo.id, todo.note_id, true)}
                  className="pt-0.5"
                >
                  <button
                    type="submit"
                    aria-label="Mark complete"
                    className={`flex h-5 w-5 items-center justify-center rounded-md border-2 bg-white transition ${
                      overdue
                        ? "border-red-400 hover:border-red-500"
                        : "border-[var(--ink)]/25 hover:border-[var(--teal)]"
                    }`}
                  />
                </form>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      overdue ? "text-red-700" : "text-[var(--ink)]"
                    }`}
                  >
                    {todo.text}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {todo.due_date ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          overdue
                            ? "bg-red-100 text-red-700"
                            : "bg-[var(--sun)]/35 text-[var(--ink)]/70"
                        }`}
                      >
                        {overdue ? "Overdue · " : "Due "}
                        {formatDueDate(todo.due_date)}
                      </span>
                    ) : null}
                    {todo.note_id && todo.noteTitle ? (
                      <Link
                        href={`/notes/${todo.note_id}`}
                        className="text-xs font-semibold text-[var(--teal-dark)] hover:underline"
                      >
                        {todo.noteTitle} →
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--ink)]/40">
                        Standalone
                      </span>
                    )}
                    {!isStandalone && todo.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {todo.tags.map((todoTag) => (
                          <span
                            key={todoTag.id}
                            className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--teal-dark)]"
                          >
                            {formatTagLabel(todoTag.name)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {isStandalone ? (
                    <div className="mt-2">
                      <TodoTagsEditor
                        todoId={todo.id}
                        initialTags={todo.tags}
                        allTags={tags}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
