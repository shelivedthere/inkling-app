export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Local calendar day as YYYY-MM-DD. */
export function todayDateKey() {
  return toDateKey(new Date());
}

export function formatDueDate(dueDate: string) {
  const [year, month, day] = dueDate.split("-").map(Number);
  if (!year || !month || !day) return dueDate;

  const date = new Date(year, month - 1, day);
  const today = todayDateKey();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDateKey(tomorrowDate);

  if (dueDate === today) return "Today";
  if (dueDate === tomorrow) return "Tomorrow";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(dueDate: string | null | undefined, done = false) {
  if (!dueDate || done) return false;
  return dueDate < todayDateKey();
}

/** Local calendar day key for a Date. */
export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * End of the current local week as YYYY-MM-DD (Sunday).
 * Used for “due this week” windows: dated items with due_date <= this key.
 */
export function endOfWeekDateKey(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return toDateKey(d);
}

/** Open item with a due date on or before the end of this week (includes overdue). */
export function isDueThisWeekOrOverdue(
  dueDate: string | null | undefined,
  done = false
) {
  if (!dueDate || done) return false;
  return dueDate <= endOfWeekDateKey();
}

export function compareTodosByDueDate(
  a: { due_date: string | null; created_at: string },
  b: { due_date: string | null; created_at: string }
) {
  if (a.due_date && b.due_date) {
    const byDue = a.due_date.localeCompare(b.due_date);
    if (byDue !== 0) return byDue;
  } else if (a.due_date) {
    return -1;
  } else if (b.due_date) {
    return 1;
  }

  return b.created_at.localeCompare(a.created_at);
}

/** Most recently completed first; falls back to created_at. */
export function compareTodosByCompletedAt(
  a: { completed_at: string | null; created_at: string },
  b: { completed_at: string | null; created_at: string }
) {
  if (a.completed_at && b.completed_at) {
    const byCompleted = b.completed_at.localeCompare(a.completed_at);
    if (byCompleted !== 0) return byCompleted;
  } else if (a.completed_at) {
    return -1;
  } else if (b.completed_at) {
    return 1;
  }

  return b.created_at.localeCompare(a.created_at);
}
