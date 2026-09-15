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

/** Open item due today or already overdue. */
export function isDueTodayOrOverdue(
  dueDate: string | null | undefined,
  done = false
) {
  if (!dueDate || done) return false;
  return dueDate <= todayDateKey();
}

/**
 * Open item due later this week (after today through Sunday).
 * Excludes overdue and today so it can sit beside a “Due today” list.
 */
export function isDueLaterThisWeek(
  dueDate: string | null | undefined,
  done = false
) {
  if (!dueDate || done) return false;
  const today = todayDateKey();
  return dueDate > today && dueDate <= endOfWeekDateKey();
}

/** Monday after the current local week ends (Sunday). */
export function startOfNextWeekDateKey(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay(); // 0 = Sunday
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilNextMonday);
  return toDateKey(d);
}

/** Sunday of next local week. */
export function endOfNextWeekDateKey(from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay();
  const daysUntilNextSunday = day === 0 ? 7 : 14 - day;
  d.setDate(d.getDate() + daysUntilNextSunday);
  return toDateKey(d);
}

/** Due exactly today (local calendar). */
export function isDueToday(dueDate: string | null | undefined) {
  if (!dueDate) return false;
  return dueDate === todayDateKey();
}

/** Due from today through Sunday of this week (excludes overdue). */
export function isDueRemainingThisWeek(dueDate: string | null | undefined) {
  if (!dueDate) return false;
  const today = todayDateKey();
  return dueDate >= today && dueDate <= endOfWeekDateKey();
}

/** Due sometime during next local week (Mon–Sun). */
export function isDueNextWeek(dueDate: string | null | undefined) {
  if (!dueDate) return false;
  return (
    dueDate >= startOfNextWeekDateKey() && dueDate <= endOfNextWeekDateKey()
  );
}

/** completed_at is within the last `days` days (local clock). */
export function isCompletedWithinDays(
  completedAt: string | null | undefined,
  days: number
) {
  if (!completedAt) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(completedAt).getTime() >= cutoff.getTime();
}

export type TodoDueFilter =
  | "all"
  | "overdue"
  | "today"
  | "this-week"
  | "next-week"
  | "no-date"
  | "last-30d";

/** Presets valid for the open list. */
export const OPEN_DUE_FILTERS: TodoDueFilter[] = [
  "all",
  "overdue",
  "today",
  "this-week",
  "next-week",
  "no-date",
];

/** Presets valid for the closed list. */
export const CLOSED_DUE_FILTERS: TodoDueFilter[] = [
  "all",
  "last-30d",
  "no-date",
];

export const TODO_DUE_FILTER_LABELS: Record<TodoDueFilter, string> = {
  all: "Any time",
  overdue: "Overdue",
  today: "Today",
  "this-week": "This week",
  "next-week": "Next week",
  "no-date": "No date",
  "last-30d": "Last 30 days",
};

export function parseTodoDueFilter(
  value: string | string[] | undefined
): TodoDueFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  switch (raw) {
    case "overdue":
    case "today":
    case "this-week":
    case "next-week":
    case "no-date":
    case "last-30d":
      return raw;
    default:
      return "all";
  }
}

/** Drop due presets that don’t apply when switching Open ↔ Closed. */
export function coerceTodoDueFilter(
  due: TodoDueFilter,
  showingClosed: boolean
): TodoDueFilter {
  const allowed = showingClosed ? CLOSED_DUE_FILTERS : OPEN_DUE_FILTERS;
  return allowed.includes(due) ? due : "all";
}

export function matchesTodoDueFilter(
  todo: {
    due_date: string | null;
    completed_at: string | null;
    done: boolean;
  },
  due: TodoDueFilter
) {
  switch (due) {
    case "all":
      return true;
    case "overdue":
      return isOverdue(todo.due_date, todo.done);
    case "today":
      return isDueToday(todo.due_date);
    case "this-week":
      return isDueRemainingThisWeek(todo.due_date);
    case "next-week":
      return isDueNextWeek(todo.due_date);
    case "no-date":
      return !todo.due_date;
    case "last-30d":
      return isCompletedWithinDays(todo.completed_at, 30);
    default:
      return true;
  }
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
