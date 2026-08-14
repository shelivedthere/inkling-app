"use client";

import Image from "next/image";
import {
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { ImageBlock } from "@/lib/types/database";
import {
  NOTE_IMAGES_BUCKET,
  buildNoteImagePath,
  hasImageContent,
  isAllowedNoteImage,
} from "@/lib/utils/note-images";

interface ImageBlockViewProps {
  noteId: string;
  block: ImageBlock;
  onChange: (next: Pick<ImageBlock, "path" | "url" | "name">) => void;
}

function firstImageFile(dataTransfer: DataTransfer | null) {
  if (!dataTransfer) return undefined;
  const files = Array.from(dataTransfer.files);
  return files.find((file) => file.type.startsWith("image/"));
}

export function ImageBlockView({
  noteId,
  block,
  onChange,
}: ImageBlockViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasImage = hasImageContent(block);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const check = isAllowedNoteImage(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sign in to upload images.");
        return;
      }

      const path = buildNoteImagePath({
        userId: user.id,
        noteId,
        blockId: block.id,
        file,
      });

      const { error: uploadError } = await supabase.storage
        .from(NOTE_IMAGES_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setError(uploadError.message || "Upload failed.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(NOTE_IMAGES_BUCKET).getPublicUrl(path);

      // Best-effort cleanup of the previous object when replacing.
      if (block.path && block.path !== path) {
        void supabase.storage.from(NOTE_IMAGES_BUCKET).remove([block.path]);
      }

      onChange({
        path,
        url: publicUrl,
        name: file.name,
      });
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDragEnter(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    if (event.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  }

  function handleDragOver(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes("Files")) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDragLeave(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingOver(false);
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setIsDraggingOver(false);
    if (isUploading) return;

    const file = firstImageFile(event.dataTransfer);
    if (!file) {
      setError("Drop a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    void handleFile(file);
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--ink)]/10 bg-white/60 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]/45">
          Image
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-[var(--ink)]/70 ring-1 ring-[var(--ink)]/10 transition hover:text-[var(--coral)] hover:ring-[var(--coral)]/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isUploading
              ? "Uploading…"
              : hasImage
                ? "Replace"
                : "Choose image"}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl transition ${
          isDraggingOver
            ? "ring-2 ring-[var(--coral)] ring-offset-2 ring-offset-[var(--paper)]"
            : ""
        }`}
      >
        {hasImage ? (
          <div
            className={`overflow-hidden rounded-xl border bg-[#fffdf8] ${
              isDraggingOver
                ? "border-[var(--coral)]/60"
                : "border-[var(--ink)]/10"
            }`}
          >
            <Image
              src={block.url}
              alt={block.name || "Note image"}
              width={1200}
              height={800}
              unoptimized
              className="mx-auto h-auto max-h-80 w-full object-contain"
            />
            {isDraggingOver ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--coral)]/15">
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-[var(--coral)] shadow-sm">
                  Drop to replace
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={`flex h-40 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isDraggingOver
                ? "border-[var(--coral)] bg-[var(--coral)]/10 text-[var(--coral)]"
                : "border-[var(--ink)]/15 bg-white/50 text-[var(--ink)]/45 hover:border-[var(--coral)]/40 hover:text-[var(--coral)]"
            }`}
          >
            <span>
              {isUploading
                ? "Uploading…"
                : isDraggingOver
                  ? "Drop image to upload"
                  : "Tap to choose an image"}
            </span>
            <span
              className={`text-xs font-medium ${
                isDraggingOver ? "text-[var(--coral)]/80" : "text-[var(--ink)]/35"
              }`}
            >
              {isDraggingOver
                ? "JPEG, PNG, WebP, or GIF"
                : "Or drag & drop · JPEG, PNG, WebP, or GIF · up to 5 MB"}
            </span>
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

export async function deleteNoteImageFromStorage(path: string) {
  if (!path) return;
  try {
    const supabase = createClient();
    await supabase.storage.from(NOTE_IMAGES_BUCKET).remove([path]);
  } catch {
    // Cleanup is best-effort; note content is the source of truth.
  }
}
