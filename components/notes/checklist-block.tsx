"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  addTodo,
  deleteTodo,
  toggleTodo,
  updateTodoDueDate,
} from "@/app/actions/todos";
import type { Todo } from "@/lib/types/database";
import { formatDueDate, isOverdue } from "@/lib/utils/dates";

interface ChecklistBlockProps {
  noteId: string;
  checklistBlockId: string;
  initialTodos: Todo[];
}

export function ChecklistBlockView({
  noteId,
  checklistBlockId,
  initialTodos,
}: ChecklistBlockProps) {
  const [todos, setTodos] = useState(initialTodos);
  const [draft, setDraft] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const dueDate = draftDueDate || null;
    const optimisticId = `temp-${Date.now()}`;
    setTodos((prev) => [
      ...prev,
      {
        id: optimisticId,
        user_id: "",
        note_id: noteId,
        checklist_block_id: checklistBlockId,
        text,
        done: false,
        due_date: dueDate,
        created_at: new Date().toISOString(),
        completed_at: null,
      },
    ]);
    setDraft("");
    setDraftDueDate("");

    startTransition(async () => {
      try {
        const created = await addTodo(
          noteId,
          text,
          dueDate,
          checklistBlockId
        );
        if (!created) {
          setTodos((prev) => prev.filter((t) => t.id !== optimisticId));
          return;
        }
        setTodos((prev) =>
          prev.map((t) =>
            t.id === optimisticId
              ? {
                  ...created,
                  checklist_block_id:
                    created.checklist_block_id ?? checklistBlockId,
                  due_date: created.due_date ?? null,
                }
              : t
          )
        );
      } catch {
        setTodos((prev) => prev.filter((t) => t.id !== optimisticId));
      }
    });
  }

  function handleToggle(todo: Todo) {
    if (todo.id.startsWith("temp-")) return;
    const nextDone = !todo.done;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              done: nextDone,
              completed_at: nextDone ? new Date().toISOString() : null,
            }
          : t
      )
    );
    startTransition(async () => {
      await toggleTodo(todo.id, noteId, nextDone);
    });
  }

  function handleDelete(todo: Todo) {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    if (todo.id.startsWith("temp-")) return;
    startTransition(async () => {
      await deleteTodo(todo.id, noteId);
    });
  }

  function handleDueDateChange(todo: Todo, value: string) {
    if (todo.id.startsWith("temp-")) return;
    const nextDue = value || null;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, due_date: nextDue } : t))
    );
    startTransition(async () => {
      await updateTodoDueDate(todo.id, noteId, nextDue);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--sun)]/50 bg-[var(--sun)]/15 px-4 py-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]/45">
        Checklist
      </p>
      <ul className="flex flex-col gap-2">
        {todos.map((todo) => {
          const overdue = isOverdue(todo.due_date, todo.done);
          return (
            <li key={todo.id} className="group flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggle(todo)}
                aria-label={todo.done ? "Mark incomplete" : "Mark complete"}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  todo.done
                    ? "border-[var(--teal-dark)] bg-[var(--teal)] text-white"
                    : "border-[var(--ink)]/25 bg-white hover:border-[var(--teal)]"
                }`}
              >
                {todo.done ? (
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                    <path
                      d="M3.5 8.5 6.5 11.5 12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>
              <div className="min-w-0 flex-1">
                <span
                  className={`block break-words [overflow-wrap:anywhere] text-sm ${
                    todo.done
                      ? "text-[var(--ink)]/40 line-through"
                      : overdue
                        ? "text-red-700"
                        : "text-[var(--ink)]"
                  }`}
                >
                  {todo.text}
                </span>
                {todo.due_date ? (
                  <span
                    className={`mt-0.5 inline-flex text-[11px] font-semibold ${
                      overdue
                        ? "text-red-600"
                        : todo.done
                          ? "text-[var(--ink)]/35"
                          : "text-[var(--ink)]/50"
                    }`}
                  >
                    {overdue ? "Overdue · " : "Due "}
                    {formatDueDate(todo.due_date)}
                  </span>
                ) : null}
              </div>
              <label className="relative shrink-0">
                <span className="sr-only">Due date</span>
                <input
                  type="date"
                  value={todo.due_date ?? ""}
                  onChange={(e) => handleDueDateChange(todo, e.target.value)}
                  disabled={todo.id.startsWith("temp-")}
                  className="w-[7.5rem] rounded-lg border border-[var(--ink)]/10 bg-white/80 px-1.5 py-1 text-[11px] font-semibold text-[var(--ink)]/70 outline-none focus:border-[var(--coral)] disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                onClick={() => handleDelete(todo)}
                className="rounded px-1.5 py-0.5 text-xs font-semibold text-[var(--ink)]/30 opacity-0 transition hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
          className="min-w-[10rem] flex-1 rounded-xl border border-[var(--ink)]/10 bg-white/80 px-3 py-2 text-sm outline-none focus:border-[var(--coral)]"
        />
        <input
          type="date"
          value={draftDueDate}
          onChange={(e) => setDraftDueDate(e.target.value)}
          aria-label="Optional due date"
          className="w-[9.5rem] rounded-xl border border-[var(--ink)]/10 bg-white/80 px-2 py-2 text-xs font-semibold text-[var(--ink)]/70 outline-none focus:border-[var(--coral)]"
        />
        <button
          type="submit"
          disabled={isPending || !draft.trim()}
          className="rounded-xl bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}

/** Todos belonging to this checklist block (legacy null ids → first block). */
export function todosForChecklistBlock(
  todos: Todo[],
  blockId: string,
  firstChecklistId: string | undefined
) {
  return todos.filter((todo) => {
    if (todo.checklist_block_id === blockId) return true;
    if (todo.checklist_block_id == null && blockId === firstChecklistId) {
      return true;
    }
    return false;
  });
}
