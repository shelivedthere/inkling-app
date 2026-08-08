import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { NoteEditor } from "@/components/notes/note-editor";
import { getNote, getTags, getTodosForNote } from "@/lib/notes/queries";

interface NoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;
  const [note, todos, allTags] = await Promise.all([
    getNote(id),
    getTodosForNote(id),
    getTags(),
  ]);

  if (!note) notFound();

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_30%_0%,var(--teal)_0%,transparent_50%),radial-gradient(ellipse_at_80%_10%,var(--sun)_0%,transparent_40%)] opacity-25"
      />
      <AppNav active="notes" />
      <NoteEditor note={note} todos={todos} allTags={allTags} />
    </main>
  );
}
