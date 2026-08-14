"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import type { Tag } from "@/lib/types/database";
import { DEFAULT_TAG_COLOR, tagColorClasses } from "@/lib/utils/tag-colors";
import {
  formatTagLabel,
  normalizeTagName,
  tagsMatchQuery,
} from "@/lib/utils/tags";

export interface TagsEditorProps {
  initialTags: Tag[];
  allTags: Tag[];
  onAdd: (name: string) => Promise<Tag | null>;
  onAttach: (tagId: string) => Promise<Tag>;
  onRemove: (tagId: string) => Promise<void>;
  label?: string;
  /** Hide the "Tags" heading for compact row layouts */
  compact?: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
}

export function TagsEditor({
  initialTags,
  allTags,
  onAdd,
  onAttach,
  onRemove,
  label = "Tags",
  compact = false,
}: TagsEditorProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [tags, setTags] = useState(initialTags);
  const [catalog, setCatalog] = useState(allTags);
  const [draft, setDraft] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  useEffect(() => {
    setCatalog(allTags);
  }, [allTags]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
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

  const showMenu = isOpen && options.length > 0;

  useLayoutEffect(() => {
    if (!showMenu) {
      setMenuPos(null);
      return;
    }

    function updatePosition() {
      const input = inputRef.current;
      if (!input) return;

      const rect = input.getBoundingClientRect();
      const estimatedHeight = Math.min(options.length * 34 + 8, 260);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow;
      const gutter = 8;

      setMenuPos({
        top: openAbove
          ? Math.max(gutter, rect.top - estimatedHeight - 4)
          : rect.bottom + 4,
        left: Math.min(
          rect.left,
          window.innerWidth - Math.max(rect.width, 192) - gutter
        ),
        minWidth: Math.max(rect.width, 192),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    // Capture scroll from swipe cards / nested overflow containers.
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showMenu, options.length, draft]);

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
      prev.some(
        (t) =>
          t.id === tag.id ||
          normalizeTagName(t.name) === normalizeTagName(tag.name)
      )
        ? prev
        : [...prev, tag]
    );
    setDraft("");
    setIsOpen(false);

    startTransition(async () => {
      try {
        const saved = tag.id.startsWith("temp-")
          ? await onAdd(tag.name)
          : await onAttach(tag.id);

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
      color: DEFAULT_TAG_COLOR,
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
      await onRemove(tag.id);
    });
  }

  const menu =
    showMenu && menuPos
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: Math.max(8, menuPos.left),
              minWidth: menuPos.minWidth,
              zIndex: 80,
            }}
            className="overflow-hidden rounded-xl border border-[var(--ink)]/10 bg-white py-1 shadow-[4px_4px_0_rgba(26,26,26,0.08)]"
          >
            {options.map((option, index) => {
              const selected = index === activeIndex;
              if (option.kind === "existing") {
                return (
                  <li
                    key={option.tag.id}
                    role="option"
                    aria-selected={selected}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(index)}
                      className={`flex w-full px-3 py-1.5 text-left text-xs font-semibold ${
                        selected
                          ? tagColorClasses(option.tag.color, "soft")
                          : "text-[var(--ink)]/80 hover:bg-[var(--ink)]/5"
                      }`}
                    >
                      {formatTagLabel(option.tag.name)}
                    </button>
                  </li>
                );
              }

              return (
                <li
                  key={`create-${option.name}`}
                  role="option"
                  aria-selected={selected}
                >
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
          </ul>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      {!compact ? (
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]/40">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => handleRemove(tag)}
            className={`group inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:bg-red-100 hover:text-red-700 ${tagColorClasses(tag.color, "soft")}`}
            title="Remove tag"
          >
            {formatTagLabel(tag.name)}
            <span className="opacity-40 group-hover:text-red-500 group-hover:opacity-100">
              ×
            </span>
          </button>
        ))}

        <form onSubmit={handleSubmit} className="relative inline-flex">
          <input
            ref={inputRef}
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
            aria-expanded={showMenu}
            aria-controls={listboxId}
            aria-autocomplete="list"
            className="w-28 rounded-full border border-dashed border-[var(--ink)]/20 bg-transparent px-2.5 py-1 text-xs outline-none focus:border-[var(--coral)]"
          />
        </form>
      </div>
      {menu}
    </div>
  );
}
