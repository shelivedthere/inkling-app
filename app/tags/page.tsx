import { AppNav } from "@/components/app-nav";
import { ManageTagsPanel } from "@/components/tags/manage-tags-panel";
import { getTagsWithUsage } from "@/lib/notes/queries";

export default async function TagsPage() {
  const tags = await getTagsWithUsage();

  return (
    <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(ellipse_at_40%_0%,var(--teal)_0%,transparent_50%)] opacity-25"
      />

      <AppNav active="tags" />

      <div>
        <h1 className="text-xl font-bold text-[var(--ink)]">Manage tags</h1>
        <p className="text-sm text-[var(--ink)]/50">
          One shared tag list for notes and standalone to-dos
        </p>
      </div>

      <ManageTagsPanel initialTags={tags} />
    </main>
  );
}
