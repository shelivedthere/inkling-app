"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  addTagToNote,
  attachTagToNote,
  removeTagFromNote,
} from "@/app/actions/tags";
import type { Tag } from "@/lib/types/database";
import {
  formatTagLabel,
  normalizeTagName,
  tagsMatchQuery,
} from "@/lib/utils/tags";

interface NoteTagsEditorProps {
  noteId: string;
  initialTags: Tag[];
  allTags: Tag[];
}

export function NoteTagsEditor({
  noteId,
  initialTags,
  allTags,
}: NoteTagsEditorProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState(initialTags);
  const [catalog, setCatalog] = useState(allTags);
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const normalizedDraft = normalizeTagName(draft);
  const attachedNames = useMemo(
    () => new Set(tags.map((tag) => normalizeTagName(tag.name))),
    [tags]
  );

  const suggestions = useMemo(() => {
    if (!normalizedDraft) return [];
    return catalog
      .filter(
        (tag) =>
          tagsMatchQuery(tag.name, normalizedDraft) &&
          !attachedNames.has(normalizeTagName(tag.name))
      )
      .slice(0, 8);
  }, [catalog, normalizedDraft, attachedNames]);

  const exactMatch = suggestions.find(
    (tag) => normalizeTagName(tag.name) === normalizedDraft
  );
  const canCreate =
    Boolean(normalizedDraft) &&
    !exactMatch &&
    !attachedNames.has(normalizedDraft);

  const options = useMemo(() => {
    const items: Array<
      | { kind: "existing"; tag: Tag }
      | { kind: "create"; name: string }
    > = suggestions.map((tag) => ({ kind: "existing", tag }));

    if (canCreate) {
      items.push({ kind: "create", name: normalizedDraft });
    }
    return items;
  }, [suggestions, canCreate, normalizedDraft]);

  function applyTag(tag: Tag) {
    if (attachedNames.has(normalizeTagName(tag.name))) {
      setDraft("");
      setIsOpen(false);
      return;
    }

    const optimisticId = tag.id.startsWith("temp-")
      ? tag.id
      : `temp-${tag.id}`;
    const optimistic = { ...tag, id: optimisticId };
    setTags((prev) => [...prev, optimistic]);
    setCatalog((prev) =>
      prev.some((t) => t.id === tag.id || normalizeTagName(t.name) === normalizeTagName(tag.name))
        ? prev
        : [...prev, tag]
    );
    setDraft("");
    setIsOpen(false);

    startTransition(async () => {
      try {
        const saved = tag.id.startsWith("temp-")
          ? await addTagToNote(noteId, tag.name)
          : await attachTagToNote(noteId, tag.id);

        if (!saved) {
          setTags((prev) => prev.filter((t) => t.id !== optimisticId));
          return;
        }

        setTags((prev) =>
          prev.map((t) => (t.id === optimisticId ? saved : t))
        );
        setCatalog((prev) => {
          const without = prev.filter(
            (t) =>
              t.id !== saved.id &&
              normalizeTagName(t.name) !== normalizeTagName(saved.name)
          );
          return [...without, saved];
        });
      } catch {
        setTags((prev) => prev.filter((t) => t.id !== optimisticId));
      }
    });
  }

  function createTag(name: string) {
    applyTag({
      id: `temp-${name}`,
      user_id: "",
      name: normalizeTagName(name),
      created_at: new Date().toISOString(),
    });
  }

  function chooseOption(index: number) {
    const option = options[index];
    if (!option) return;
    if (option.kind === "existing") applyTag(option.tag);
    else createTag(option.name);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!normalizedDraft) return;

    if (options.length > 0) {
      chooseOption(activeIndex);
      return;
    }

    if (!attachedNames.has(normalizedDraft)) {
      createTag(normalizedDraft);
    } else {
      setDraft("");
      setIsOpen(false);
    }
  }

  function handleRemove(tag: Tag) {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    if (tag.id.startsWith("temp-")) return;
    startTransition(async () => {
      await removeTagFromNote(noteId, tag.id);
    });
  }

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]/40">
        Tags
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleRemove(tag)}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--teal)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--teal-dark)] transition hover:bg-red-100 hover:text-red-700"
            title="Remove tag"
          >
            {formatTagLabel(tag.name)}
            <span className="text-[var(--ink)]/30 group-hover:text-red-500">
              ×
            </span>
          </button>
        ))}

        <form onSubmit={handleSubmit} className="relative inline-flex">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setActiveIndex(0);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                setIsOpen(true);
                return;
              }
              if (!isOpen || options.length === 0) {
                if (e.key === "Escape") setIsOpen(false);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % options.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(
                  (i) => (i - 1 + options.length) % options.length
                );
              } else if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
            placeholder="+ tag"
            disabled={isPending}
            role="combobox"
            aria-expanded={isOpen && options.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="w-28 rounded-full border border-dashed border-[var(--ink)]/20 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-[var(--coral)]"
          />

          {isOpen && options.length > 0 ? (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute left-0 top-full z-20 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--ink)]/10 bg-white py-1 shadow-[4px_4px_0_rgba(26,26,26,0.08)]"
            >
              {options.map((option, index) => {
                const selected = index === activeIndex;
                if (option.kind === "existing") {
                  return (
                    <li key={option.tag.id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => chooseOption(index)}
                        className={`flex w-full px-3 py-1.5 text-left text-xs font-semibold ${
                          selected
                            ? "bg-[var(--teal)]/15 text-[var(--teal-dark)]"
                            : "text-[var(--ink)]/80 hover:bg-[var(--ink)]/5"
                        }`}
                      >
                        {formatTagLabel(option.tag.name)}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={`create-${option.name}`} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(index)}
                      className={`flex w-full px-3 py-1.5 text-left text-xs font-semibold ${
                        selected
                          ? "bg-[var(--coral)]/15 text-[var(--coral)]"
                          : "text-[var(--ink)]/70 hover:bg-[var(--ink)]/5"
                      }`}
                    >
                      Create new tag: {formatTagLabel(option.name)}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </form>
      </div>
    </div>
  );
}
