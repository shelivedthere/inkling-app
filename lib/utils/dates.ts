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
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDueDate(dueDate: string) {
  const [year, month, day] = dueDate.split("-").map(Number);
  if (!year || !month || !day) return dueDate;

  const date = new Date(year, month - 1, day);
  const today = todayDateKey();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = [
    tomorrowDate.getFullYear(),
    String(tomorrowDate.getMonth() + 1).padStart(2, "0"),
    String(tomorrowDate.getDate()).padStart(2, "0"),
  ].join("-");

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
