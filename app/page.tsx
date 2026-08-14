import Link from "next/link";
import { redirect } from "next/navigation";
import { createNote } from "@/app/actions/notes";
import { goToNewTodo } from "@/app/actions/todos";
import { AppNav } from "@/components/app-nav";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { FocusTodosSection } from "@/components/dashboard/focus-todos-section";
import { NoteList } from "@/components/notes/note-list";
import { TagChips } from "@/components/notes/tag-chips";
import { getNotes, getOpenTodos, getTags } from "@/lib/notes/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { parseTagIds } from "@/lib/utils/tags";

interface HomePageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { tag } = await searchParams;
  const activeTagIds = parseTagIds(tag);
  const [notes, openTodos, tags] = await Promise.all([
    getNotes(activeTagIds),
    getOpenTodos(),
    getTags(),
  ]);

  // Dated open to-dos only — client filters to this week / overdue in local time.
  const datedOpenTodos = openTodos.filter((todo) => Boolean(todo.due_date));

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top_left,var(--sun)_0%,transparent_55%),radial-gradient(ellipse_at_top_right,var(--coral)_0%,transparent_50%)] opacity-30"
      />

      <AppNav />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <DashboardGreeting />
          <p className="mt-1 text-sm text-[var(--ink)]/50">
            What’s on your plate this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={goToNewTodo}>
            <button
              type="submit"
              className="rounded-xl bg-[var(--sun)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
            >
              New to-do
            </button>
          </form>
          <form action={createNote}>
            <button
              type="submit"
              className="rounded-xl bg-[var(--coral)] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
            >
              New note
            </button>
          </form>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">
              Due this week
            </h2>
            <p className="text-sm text-[var(--ink)]/50">
              Overdue and anything due by Sunday
            </p>
          </div>
          <Link
            href="/todos"
            className="text-sm font-semibold text-[var(--teal-dark)] hover:underline"
          >
            All to-dos →
          </Link>
        </div>

        <FocusTodosSection todos={datedOpenTodos} allTags={tags} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)]">Notes</h2>
            <p className="text-sm text-[var(--ink)]/50">
              Sorted by most recently updated
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form action={goToNewTodo}>
              <button
                type="submit"
                className="rounded-xl bg-[var(--sun)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
              >
                New to-do
              </button>
            </form>
            <form action={createNote}>
              <button
                type="submit"
                className="rounded-xl bg-[var(--coral)] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
              >
                New note
              </button>
            </form>
          </div>
        </div>

        <TagChips tags={tags} activeTagIds={activeTagIds} basePath="/" />

        {notes.length === 0 && activeTagIds.length > 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/40 px-6 py-14 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Nothing tagged here
            </p>
            <p className="mt-2 text-sm text-[var(--ink)]/55">
              No notes match the selected tag
              {activeTagIds.length === 1 ? "" : "s"}.
            </p>
          </div>
        ) : (
          <NoteList notes={notes} />
        )}
      </section>
    </main>
  );
}
