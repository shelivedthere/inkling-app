import type { ImageBlock } from "@/lib/types/database";
import { createId } from "@/lib/utils/id";

export const NOTE_IMAGES_BUCKET = "note-images";
export const MAX_NOTE_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function createEmptyImageBlock(id: string): ImageBlock {
  return {
    id,
    type: "image",
    path: "",
    url: "",
  };
}

export function hasImageContent(block: Pick<ImageBlock, "path" | "url">) {
  return Boolean(block.path && block.url);
}

export function isAllowedNoteImage(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false as const, error: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_NOTE_IMAGE_BYTES) {
    return { ok: false as const, error: "Images must be 5 MB or smaller." };
  }
  return { ok: true as const };
}

function extensionForMime(mime: string, fileName: string) {
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/** Storage path: {userId}/{noteId}/{blockId}-{rand}.{ext} */
export function buildNoteImagePath(input: {
  userId: string;
  noteId: string;
  blockId: string;
  file: File;
}) {
  const ext = extensionForMime(input.file.type, input.file.name);
  return `${input.userId}/${input.noteId}/${input.blockId}-${createId()}.${ext}`;
}
