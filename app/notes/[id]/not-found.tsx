import Link from "next/link";
import { AppNav } from "@/components/app-nav";

export default function NoteNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <AppNav active="notes" />
      <div className="flex flex-col items-start gap-4">
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
      </div>
    </main>
  );
}
