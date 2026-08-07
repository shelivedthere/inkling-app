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
