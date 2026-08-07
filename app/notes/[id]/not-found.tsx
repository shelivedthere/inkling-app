import Link from "next/link";

export default function NoteNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Note not found
      </h1>
      <p className="text-[var(--ink)]/60">
        That note may have been deleted.
      </p>
      <Link
        href="/notes"
        className="font-semibold text-[var(--coral)] hover:underline"
      >
        ← Back to notes
      </Link>
    </main>
  );
}
