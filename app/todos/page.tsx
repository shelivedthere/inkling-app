import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { getOpenTodos } from "@/lib/notes/queries";
import { toggleTodo } from "@/app/actions/todos";

export default async function TodosPage() {
  const todos = await getOpenTodos();

  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top_right,var(--coral)_0%,transparent_50%)] opacity-25"
      />

      <AppNav active="todos" />

      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Open to-dos</h1>
        <p className="text-sm text-[var(--ink)]/50">
          Everything still unchecked, across all notes
        </p>
      </div>

      {todos.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            All clear
          </p>
          <p className="mt-2 text-sm text-[var(--ink)]/55">
            No open to-dos. Enjoy the empty list.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo, index) => (
            <li
              key={todo.id}
              className="animate-fade-up flex items-center gap-3 rounded-2xl border-2 border-[var(--ink)]/8 bg-white/75 px-4 py-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)]"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <form
                action={toggleTodo.bind(null, todo.id, todo.note_id, true)}
              >
                <button
                  type="submit"
                  aria-label="Mark complete"
                  className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-[var(--ink)]/25 bg-white transition hover:border-[var(--teal)]"
                />
              </form>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ink)]">
                  {todo.text}
                </p>
                <Link
                  href={`/notes/${todo.note_id}`}
                  className="text-xs font-semibold text-[var(--teal-dark)] hover:underline"
                >
                  {todo.noteTitle} →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
