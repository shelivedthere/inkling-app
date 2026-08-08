import { createNote } from "@/app/actions/notes";
import { goToNewTodo } from "@/app/actions/todos";
import { AppNav } from "@/components/app-nav";
import { NoteList } from "@/components/notes/note-list";
import { TagChips } from "@/components/notes/tag-chips";
import { getNotes, getTags } from "@/lib/notes/queries";
import { parseTagIds } from "@/lib/utils/tags";

interface NotesPageProps {
  searchParams: Promise<{ tag?: string | string[] }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { tag } = await searchParams;
  const activeTagIds = parseTagIds(tag);
  const [notes, tags] = await Promise.all([
    getNotes(activeTagIds),
    getTags(),
  ]);

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,var(--sun)_0%,transparent_55%)] opacity-30"
      />

      <AppNav active="notes" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Your notes</h1>
          <p className="text-sm text-[var(--ink)]/50">
            Sorted by most recently updated
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={goToNewTodo}>
            <button
              type="submit"
              className="rounded-xl bg-white/80 px-4 py-2.5 text-sm font-bold text-[var(--ink)]/80 ring-1 ring-[var(--ink)]/12 transition hover:text-[var(--coral)] hover:ring-[var(--coral)]/40"
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

      <TagChips tags={tags} activeTagIds={activeTagIds} />

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
    </main>
  );
}
