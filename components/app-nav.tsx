import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";

interface AppNavProps {
  active: "notes" | "todos";
}

export function AppNav({ active }: AppNavProps) {
  return (
    <header className="flex items-end justify-between gap-4">
      <BrandMark href="/notes" size="nav" />
      <nav className="flex items-center gap-3 text-sm font-semibold">
        <Link
          href="/notes"
          className={
            active === "notes"
              ? "text-[var(--coral)]"
              : "text-[var(--ink)]/55 hover:text-[var(--ink)]"
          }
        >
          Notes
        </Link>
        <Link
          href="/todos"
          className={
            active === "todos"
              ? "text-[var(--coral)]"
              : "text-[var(--ink)]/55 hover:text-[var(--ink)]"
          }
        >
          To-dos
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-[var(--ink)]/40 transition hover:text-[var(--ink)]"
          >
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
