/** Canonical storage form for tag names. */
export function normalizeTagName(name: string) {
  return name.trim().toLowerCase();
}

/** Friendly label for chips / filters (stored lowercase). */
export function formatTagLabel(name: string) {
  const normalized = normalizeTagName(name);
  if (!normalized) return "";
  return normalized.replace(/\b([a-z])/g, (char) => char.toUpperCase());
}

export function tagsMatchQuery(tagName: string, query: string) {
  const needle = normalizeTagName(query);
  if (!needle) return true;
  return normalizeTagName(tagName).includes(needle);
}

/** Parse `?tag=` search params into a de-duplicated id list. */
export function parseTagIds(
  tag: string | string[] | undefined
): string[] {
  if (!tag) return [];
  const values = Array.isArray(tag) ? tag : [tag];
  const ids = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

/** Build a list/filter href with the given active tag ids (OR filter). */
export function buildTagFilterHref(
  basePath: string,
  tagIds: string[],
  extraParams?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  for (const id of tagIds) params.append("tag", id);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Toggle a tag id in the active multi-select set. */
export function toggleTagId(activeTagIds: string[], tagId: string): string[] {
  if (activeTagIds.includes(tagId)) {
    return activeTagIds.filter((id) => id !== tagId);
  }
  return [...activeTagIds, tagId];
}

export type TodoStatusFilter = "open" | "closed";

export function parseTodoStatus(
  value: string | string[] | undefined
): TodoStatusFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "closed" ? "closed" : "open";
}
