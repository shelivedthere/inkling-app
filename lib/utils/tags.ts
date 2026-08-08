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
  tagIds: string[]
): string {
  if (tagIds.length === 0) return basePath;
  const params = new URLSearchParams();
  for (const id of tagIds) params.append("tag", id);
  return `${basePath}?${params.toString()}`;
}

/** Toggle a tag id in the active multi-select set. */
export function toggleTagId(activeTagIds: string[], tagId: string): string[] {
  if (activeTagIds.includes(tagId)) {
    return activeTagIds.filter((id) => id !== tagId);
  }
  return [...activeTagIds, tagId];
}
