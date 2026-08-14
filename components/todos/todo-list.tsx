"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  deleteTodo,
  toggleTodo,
  updateTodoDueDate,
  updateTodoText,
} from "@/app/actions/todos";
import { TodoTagsEditor } from "@/components/todos/todo-tags-editor";
import type { OpenTodo } from "@/lib/notes/queries";
import type { Tag } from "@/lib/types/database";
import { formatDueDate, isOverdue } from "@/lib/utils/dates";
import { tagColorClasses } from "@/lib/utils/tag-colors";
import { formatTagLabel } from "@/lib/utils/tags";

interface TodoListProps {
  todos: OpenTodo[];
  allTags: Tag[];
}

const REVEAL_WIDTH = 84;
const OPEN_THRESHOLD = 48;

export function TodoList({ todos, allTags }: TodoListProps) {
  const [items, setItems] = useState(todos);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setItems(todos);
  }, [todos]);

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((todo, index) => (
        <TodoListItem
          key={todo.id}
          todo={todo}
          index={index}
          allTags={allTags}
          isOpen={openId === todo.id}
          onOpenChange={(nextOpen) =>
            setOpenId(nextOpen ? todo.id : null)
          }
          onRemoved={() =>
            setItems((prev) => prev.filter((item) => item.id !== todo.id))
          }
          onUpdated={(next) =>
            setItems((prev) =>
              prev.map((item) => (item.id === todo.id ? next : item))
            )
          }
        />
      ))}
    </ul>
  );
}

interface TodoListItemProps {
  todo: OpenTodo;
  index: number;
  allTags: Tag[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoved: () => void;
  onUpdated: (todo: OpenTodo) => void;
}

function TodoListItem({
  todo,
  index,
  allTags,
  isOpen,
  onOpenChange,
  onRemoved,
  onUpdated,
}: TodoListItemProps) {
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(todo.text);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const didSwipe = useRef(false);
  const axisLock = useRef<"x" | "y" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(todo.text);
  }, [todo.text]);

  const offset = dragOffset ?? (isOpen ? -REVEAL_WIDTH : 0);
  const overdue = isOverdue(todo.due_date, todo.done);
  const isStandalone = !todo.note_id;

  function confirmAndDelete() {
    if (
      !confirm(
        `Delete “${todo.text.trim() || "to-do"}”? This can’t be undone.`
      )
    ) {
      return;
    }

    onRemoved();
    onOpenChange(false);
    startTransition(async () => {
      await deleteTodo(todo.id, todo.note_id);
    });
  }

  function saveText() {
    const trimmed = text.trim();
    if (!trimmed || trimmed === todo.text) {
      setText(todo.text);
      return;
    }

    onUpdated({ ...todo, text: trimmed });
    startTransition(async () => {
      await updateTodoText(todo.id, todo.note_id, trimmed);
    });
  }

  function handleTextKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setText(todo.text);
      event.currentTarget.blur();
    }
  }

  function handleDueDateChange(value: string) {
    const nextDue = value || null;
    onUpdated({ ...todo, due_date: nextDue });
    startTransition(async () => {
      await updateTodoDueDate(todo.id, todo.note_id, nextDue);
    });
  }

  function handleToggleDone() {
    const nextDone = !todo.done;
    onRemoved();
    startTransition(async () => {
      await toggleTodo(todo.id, todo.note_id, nextDone);
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    startX.current = event.clientX;
    startY.current = event.clientY;
    startOffset.current = isOpen ? -REVEAL_WIDTH : 0;
    didSwipe.current = false;
    axisLock.current = null;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (!axisLock.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axisLock.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axisLock.current === "x") {
        setIsDragging(true);
        cardRef.current?.setPointerCapture(event.pointerId);
      }
    }

    if (axisLock.current !== "x") return;

    didSwipe.current = true;
    const next = Math.min(
      0,
      Math.max(-REVEAL_WIDTH, startOffset.current + dx)
    );
    setDragOffset(next);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;

    const wasDragging = axisLock.current === "x";
    const currentOffset = dragOffset ?? (isOpen ? -REVEAL_WIDTH : 0);
    setIsDragging(false);
    axisLock.current = null;
    setDragOffset(null);

    if (!wasDragging) return;

    onOpenChange(currentOffset <= -OPEN_THRESHOLD);
  }

  return (
    <li
      className="animate-fade-up relative overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="absolute inset-y-0 right-0 flex w-[84px]">
        <button
          type="button"
          onClick={confirmAndDelete}
          disabled={isPending}
          className="flex w-full items-center justify-center bg-red-500 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
          aria-label={`Delete ${todo.text || "to-do"}`}
        >
          {isPending ? "…" : "Delete"}
        </button>
      </div>

      <div
        ref={cardRef}
        className={`group relative touch-pan-y bg-[var(--paper)] ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className={`flex items-start gap-3 rounded-2xl border-2 bg-white/75 px-4 py-3 shadow-[2px_2px_0_rgba(26,26,26,0.04)] ${
            overdue
              ? "border-red-300/80"
              : todo.done
                ? "border-[var(--teal)]/25"
                : "border-[var(--ink)]/8"
          }`}
        >
          <button
            type="button"
            onClick={handleToggleDone}
            disabled={isPending}
            aria-label={todo.done ? "Mark incomplete" : "Mark complete"}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
              todo.done
                ? "border-[var(--teal-dark)] bg-[var(--teal)] text-white"
                : overdue
                  ? "border-red-400 bg-white hover:border-red-500"
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

          <div className="min-w-0 flex-1 pr-6">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={saveText}
              onKeyDown={handleTextKeyDown}
              aria-label="To-do text"
              className={`w-full bg-transparent text-sm font-medium outline-none ${
                todo.done
                  ? "text-[var(--ink)]/40 line-through"
                  : overdue
                    ? "text-red-700"
                    : "text-[var(--ink)]"
              }`}
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <label className="relative shrink-0">
                <span className="sr-only">Due date</span>
                <input
                  type="date"
                  value={todo.due_date ?? ""}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className={`rounded-lg border px-1.5 py-1 text-[11px] font-semibold outline-none focus:border-[var(--coral)] ${
                    overdue
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-[var(--ink)]/10 bg-white/80 text-[var(--ink)]/70"
                  }`}
                />
              </label>
              {todo.due_date ? (
                <span
                  className={`text-xs font-semibold ${
                    overdue ? "text-red-600" : "text-[var(--ink)]/50"
                  }`}
                >
                  {overdue ? "Overdue · " : "Due "}
                  {formatDueDate(todo.due_date)}
                </span>
              ) : (
                <span className="text-xs font-semibold text-[var(--ink)]/35">
                  No due date
                </span>
              )}
              {todo.note_id && todo.noteTitle ? (
                <Link
                  href={`/notes/${todo.note_id}`}
                  onClick={(event) => {
                    if (didSwipe.current || isOpen) {
                      event.preventDefault();
                      if (isOpen) onOpenChange(false);
                    }
                  }}
                  className="text-xs font-semibold text-[var(--teal-dark)] hover:underline"
                >
                  {todo.noteTitle} →
                </Link>
              ) : (
                <span className="text-xs font-semibold text-[var(--ink)]/40">
                  Standalone
                </span>
              )}
              {!isStandalone && todo.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {todo.tags.map((todoTag) => (
                    <span
                      key={todoTag.id}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tagColorClasses(todoTag.color, "soft")}`}
                    >
                      {formatTagLabel(todoTag.name)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            {isStandalone ? (
              <div className="mt-2">
                <TodoTagsEditor
                  todoId={todo.id}
                  initialTags={todo.tags}
                  allTags={allTags}
                />
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            confirmAndDelete();
          }}
          disabled={isPending}
          className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-[var(--ink)]/35 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none group-hover:opacity-100 md:inline-flex"
          aria-label={`Delete ${todo.text || "to-do"}`}
          title="Delete to-do"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      aria-hidden
    >
      <path
        d="M4.5 6h11M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2.5 0v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 6.5 15V6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 9v4.5M11.5 9v4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
