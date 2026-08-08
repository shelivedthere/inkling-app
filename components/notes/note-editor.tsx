"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { deleteNoteAndGoToList, updateNote } from "@/app/actions/notes";
import { SketchCanvas } from "@/components/sketch/sketch-canvas";
import { ChecklistBlockView } from "@/components/notes/checklist-block";
import { NoteTagsEditor } from "@/components/notes/note-tags-editor";
import type {
  ContentBlock,
  NoteWithTags,
  SketchBlock,
  Tag,
  TextBlock,
  Todo,
} from "@/lib/types/database";
import {
  hasSketchContent,
  isLegacySketchData,
  isSketchSceneData,
  type SketchSceneData,
} from "@/lib/types/sketch";
import { createId } from "@/lib/utils/id";

interface NoteEditorProps {
  note: NoteWithTags;
  todos: Todo[];
  allTags: Tag[];
}

export function NoteEditor({ note, todos, allTags }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<ContentBlock[]>(note.content);
  const [editingSketchId, setEditingSketchId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title, content });

  useEffect(() => {
    latest.current = { title, content };
  }, [title, content]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function scheduleSave(
    nextTitle: string = latest.current.title,
    nextContent: ContentBlock[] = latest.current.content
  ) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await updateNote(note.id, {
          title: nextTitle.trim() || "Untitled",
          content: nextContent,
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      });
    }, 450);
  }

  function updateTextBlock(id: string, body: string) {
    setContent((prev) => {
      const next = prev.map((block) =>
        block.id === id && block.type === "text"
          ? ({ ...block, body } satisfies TextBlock)
          : block
      );
      scheduleSave(title, next);
      return next;
    });
  }

  function insertBlock(type: "text" | "sketch" | "checklist", afterId?: string) {
    if (type === "checklist" && content.some((b) => b.type === "checklist")) {
      return;
    }

    const block: ContentBlock =
      type === "text"
        ? { id: createId(), type: "text", body: "" }
        : type === "sketch"
          ? { id: createId(), type: "sketch", data: "" }
          : { id: createId(), type: "checklist" };

    setContent((prev) => {
      let next: ContentBlock[];
      if (!afterId) {
        next = [...prev, block];
      } else {
        const index = prev.findIndex((b) => b.id === afterId);
        next = [
          ...prev.slice(0, index + 1),
          block,
          ...prev.slice(index + 1),
        ];
      }
      scheduleSave(title, next);
      return next;
    });

    if (type === "sketch") setEditingSketchId(block.id);
  }

  function removeBlock(id: string) {
    setContent((prev) => {
      const next = prev.filter((b) => b.id !== id);
      // Keep at least one text block
      const ensured =
        next.length === 0
          ? ([{ id: createId(), type: "text", body: "" }] as ContentBlock[])
          : next;
      scheduleSave(title, ensured);
      return ensured;
    });
    if (editingSketchId === id) setEditingSketchId(null);
  }

  function saveSketch(id: string, scene: SketchSceneData) {
    setContent((prev) => {
      const next = prev.map((block) =>
        block.id === id && block.type === "sketch"
          ? ({ ...block, data: scene } satisfies SketchBlock)
          : block
      );
      scheduleSave(title, next);
      return next;
    });
    setEditingSketchId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setContent((prev) => {
      const from = prev.findIndex((b) => b.id === active.id);
      const to = prev.findIndex((b) => b.id === over.id);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = arrayMove(prev, from, to);
      scheduleSave(title, next);
      return next;
    });
  }

  const hasChecklist = content.some((b) => b.type === "checklist");
  const firstChecklistId = content.find((b) => b.type === "checklist")?.id;
  const blockIds = content.map((block) => block.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/notes"
          className="text-sm font-semibold text-[var(--ink)]/50 transition hover:text-[var(--coral)]"
        >
          ← All notes
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--ink)]/40">
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
                ? "Saved"
                : ""}
          </span>
          <form action={deleteNoteAndGoToList.bind(null, note.id)}>
            <button
              type="submit"
              className="text-xs font-semibold text-red-500/70 transition hover:text-red-600"
              onClick={(e) => {
                if (!confirm("Delete this note?")) e.preventDefault();
              }}
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => {
          const next = e.target.value;
          setTitle(next);
          scheduleSave(next, content);
        }}
        placeholder="Untitled"
        className="w-full bg-transparent font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/25 sm:text-5xl"
      />

      <NoteTagsEditor
        noteId={note.id}
        initialTags={note.tags}
        allTags={allTags}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-5">
            {content.map((block) => {
              if (block.type === "text") {
                return (
                  <SortableBlock key={block.id} id={block.id}>
                    <textarea
                      value={block.body}
                      onChange={(e) =>
                        updateTextBlock(block.id, e.target.value)
                      }
                      placeholder="Start writing…"
                      rows={Math.max(3, block.body.split("\n").length + 1)}
                      className="w-full resize-none bg-transparent text-base leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/30"
                    />
                    <BlockToolbar
                      onAddText={() => insertBlock("text", block.id)}
                      onAddSketch={() => insertBlock("sketch", block.id)}
                      onAddChecklist={
                        hasChecklist
                          ? undefined
                          : () => insertBlock("checklist", block.id)
                      }
                      onRemove={() => removeBlock(block.id)}
                    />
                  </SortableBlock>
                );
              }

              if (block.type === "sketch") {
                const isEditing = editingSketchId === block.id;
                const isLegacy = isLegacySketchData(block.data);
                const scene = isSketchSceneData(block.data) ? block.data : null;
                const previewSvg = scene?.previewSvg;

                return (
                  <SortableBlock
                    key={block.id}
                    id={block.id}
                    disabled={isEditing}
                  >
                    {isEditing && !isLegacy ? (
                      <SketchCanvas
                        key={block.id}
                        initialData={scene}
                        onSave={(nextScene) => saveSketch(block.id, nextScene)}
                        onCancel={() => {
                          if (!hasSketchContent(block.data))
                            removeBlock(block.id);
                          else setEditingSketchId(null);
                        }}
                      />
                    ) : isLegacy ? (
                      <div className="rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/60 px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-[var(--ink)]/70">
                          Legacy sketch
                        </p>
                        <p className="mt-1 text-xs text-[var(--ink)]/45">
                          This was drawn with the old freehand canvas and
                          can&apos;t be edited. Remove it and add a new sketch.
                        </p>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          className="mt-3 rounded-lg bg-[var(--ink)]/5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove legacy sketch
                        </button>
                      </div>
                    ) : previewSvg ? (
                      <button
                        type="button"
                        onClick={() => setEditingSketchId(block.id)}
                        className="sketch-preview block w-full overflow-hidden rounded-2xl border-2 border-[var(--ink)]/10 bg-[#fffdf8] text-left text-[var(--ink)] transition hover:border-[var(--coral)]/40 [&_svg]:pointer-events-none [&_svg]:block [&_svg]:h-auto [&_svg]:max-h-64 [&_svg]:w-full"
                        dangerouslySetInnerHTML={{ __html: previewSvg }}
                        aria-label="Edit sketch"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingSketchId(block.id)}
                        className="flex h-40 w-full items-center justify-center rounded-2xl border-2 border-dashed border-[var(--ink)]/15 bg-white/50 text-sm font-semibold text-[var(--ink)]/45 transition hover:border-[var(--coral)]/40 hover:text-[var(--coral)]"
                      >
                        {hasSketchContent(block.data)
                          ? "Tap to edit sketch"
                          : "Tap to draw"}
                      </button>
                    )}
                    <BlockToolbar
                      onAddText={() => insertBlock("text", block.id)}
                      onAddSketch={() => insertBlock("sketch", block.id)}
                      onAddChecklist={
                        hasChecklist
                          ? undefined
                          : () => insertBlock("checklist", block.id)
                      }
                      onRemove={() => removeBlock(block.id)}
                    />
                  </SortableBlock>
                );
              }

              return (
                <SortableBlock key={block.id} id={block.id}>
                  {block.id === firstChecklistId ? (
                    <ChecklistBlockView
                      key={`${note.id}-checklist`}
                      noteId={note.id}
                      initialTodos={todos}
                    />
                  ) : (
                    <p className="text-sm text-[var(--ink)]/45">
                      Checklist already added above.
                    </p>
                  )}
                  <BlockToolbar
                    onAddText={() => insertBlock("text", block.id)}
                    onAddSketch={() => insertBlock("sketch", block.id)}
                    onRemove={() => removeBlock(block.id)}
                  />
                </SortableBlock>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap gap-2 border-t border-[var(--ink)]/8 pt-4">
        <InsertButton label="+ Text" onClick={() => insertBlock("text")} />
        <InsertButton label="+ Sketch" onClick={() => insertBlock("sketch")} />
        <InsertButton
          label="+ Checklist"
          onClick={() => insertBlock("checklist")}
          disabled={hasChecklist}
        />
      </div>
    </div>
  );
}

function SortableBlock({
  id,
  children,
  disabled = false,
}: {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex gap-1 sm:gap-2 ${
        isDragging ? "z-10 opacity-90" : ""
      }`}
    >
      <button
        type="button"
        className={`mt-1 flex h-8 w-7 shrink-0 touch-none items-center justify-center rounded-md text-[var(--ink)]/25 transition hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]/60 focus-visible:bg-[var(--ink)]/5 focus-visible:text-[var(--ink)]/60 focus-visible:outline-none ${
          disabled
            ? "cursor-not-allowed opacity-0"
            : "cursor-grab opacity-60 active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        }`}
        aria-label="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="4" cy="3" r="1.25" />
      <circle cx="10" cy="3" r="1.25" />
      <circle cx="4" cy="7" r="1.25" />
      <circle cx="10" cy="7" r="1.25" />
      <circle cx="4" cy="11" r="1.25" />
      <circle cx="10" cy="11" r="1.25" />
    </svg>
  );
}

function InsertButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 transition hover:text-[var(--coral)] hover:ring-[var(--coral)]/40 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function BlockToolbar({
  onAddText,
  onAddSketch,
  onAddChecklist,
  onRemove,
}: {
  onAddText: () => void;
  onAddSketch: () => void;
  onAddChecklist?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
      <TinyButton onClick={onAddText}>+ text</TinyButton>
      <TinyButton onClick={onAddSketch}>+ sketch</TinyButton>
      {onAddChecklist ? (
        <TinyButton onClick={onAddChecklist}>+ checklist</TinyButton>
      ) : null}
      <TinyButton onClick={onRemove} danger>
        remove
      </TinyButton>
    </div>
  );
}

function TinyButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        danger
          ? "text-red-500/70 hover:bg-red-50"
          : "text-[var(--ink)]/40 hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]/70"
      }`}
    >
      {children}
    </button>
  );
}
