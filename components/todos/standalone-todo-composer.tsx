"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTodo } from "@/app/actions/todos";

interface StandaloneTodoComposerProps {
  autoFocus?: boolean;
}

export function StandaloneTodoComposer({
  autoFocus = false,
}: StandaloneTodoComposerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const nextDue = dueDate || null;
    setText("");
    setDueDate("");

    startTransition(async () => {
      await addTodo(null, trimmed, nextDue);
      router.refresh();
    });
  }

  return (
    <form
      id="new-todo"
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-[var(--ink)]/8 bg-white/70 p-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)]"
    >
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="New to-do…"
        className="min-w-[12rem] flex-1 rounded-xl border border-[var(--ink)]/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--coral)]"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Optional due date"
        className="w-[9.5rem] rounded-xl border border-[var(--ink)]/10 bg-white px-2 py-2 text-xs font-semibold text-[var(--ink)]/70 outline-none focus:border-[var(--coral)]"
      />
      <button
        type="submit"
        disabled={isPending || !text.trim()}
        className="rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_var(--ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
      >
        Add
      </button>
    </form>
  );
}
