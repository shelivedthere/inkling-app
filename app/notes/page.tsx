import { createNote } from "@/app/actions/notes";
import { AppNav } from "@/components/app-nav";
import { NoteList } from "@/components/notes/note-list";
import { TagChips } from "@/components/notes/tag-chips";
import { getNotes, getTags } from "@/lib/notes/queries";

interface NotesPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { tag } = await searchParams;
  const [notes, tags] = await Promise.all([getNotes(tag), getTags()]);

  return (
    <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_top,var(--sun)_0%,transparent_55%)] opacity-30"
      />

      <AppNav active="notes" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--ink)]">Your notes</h1>
          <p className="text-sm text-[var(--ink)]/50">
            Sorted by most recently updated
          </p>
        </div>
        <form action={createNote}>
          <button
            type="submit"
            className="rounded-xl bg-[var(--coral)] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--ink)]"
          >
            New note
          </button>
        </form>
      </div>

      <TagChips tags={tags} activeTagId={tag} />

      <NoteList notes={notes} />
    </main>
  );
}
