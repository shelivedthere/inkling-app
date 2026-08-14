import type { TableBlock } from "@/lib/types/database";

export const MIN_TABLE_ROWS = 1;
export const MIN_TABLE_COLS = 1;
export const MAX_TABLE_ROWS = 40;
export const MAX_TABLE_COLS = 12;

export type TableSortDirection = "asc" | "desc";

/** Normalize to a rectangular grid of strings. */
export function normalizeTableRows(rows: string[][] | undefined | null) {
  const safe = (rows ?? []).map((row) =>
    (Array.isArray(row) ? row : []).map((cell) =>
      typeof cell === "string" ? cell : String(cell ?? "")
    )
  );

  if (safe.length === 0) return emptyTableRows(3, 3);

  const colCount = Math.max(
    MIN_TABLE_COLS,
    ...safe.map((row) => row.length),
    1
  );

  return safe.map((row) => {
    const next = row.slice(0, MAX_TABLE_COLS);
    while (next.length < colCount) next.push("");
    return next;
  });
}

export function normalizeTableHeaders(
  headers: string[] | undefined | null,
  colCount: number
) {
  const safe = (Array.isArray(headers) ? headers : []).map((cell) =>
    typeof cell === "string" ? cell : String(cell ?? "")
  );
  const next = safe.slice(0, Math.min(MAX_TABLE_COLS, colCount));
  while (next.length < colCount) next.push("");
  return next;
}

export function normalizeTableBlock(input: {
  headers?: string[] | null;
  rows?: string[][] | null;
  showSumRow?: boolean | null;
}) {
  const rows = normalizeTableRows(input.rows);
  const cols = columnCount(rows);
  const headers = normalizeTableHeaders(input.headers, cols);
  return {
    headers,
    rows,
    showSumRow: Boolean(input.showSumRow),
  };
}

export function emptyTableRows(rowCount = 3, colCount = 3) {
  const rows = Math.min(MAX_TABLE_ROWS, Math.max(MIN_TABLE_ROWS, rowCount));
  const cols = Math.min(MAX_TABLE_COLS, Math.max(MIN_TABLE_COLS, colCount));
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
}

export function emptyTableHeaders(colCount = 3) {
  const cols = Math.min(MAX_TABLE_COLS, Math.max(MIN_TABLE_COLS, colCount));
  return Array.from({ length: cols }, () => "");
}

export function createEmptyTableBlock(id: string): TableBlock {
  return {
    id,
    type: "table",
    headers: emptyTableHeaders(3),
    rows: emptyTableRows(3, 3),
    showSumRow: false,
  };
}

export function columnCount(rows: string[][]) {
  return rows[0]?.length ?? 0;
}

/** Parse plain numbers and simple currency like "$1,234.50". */
export function parseLooseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/,/g, "").replace(/^\$/, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Sum numeric cells in each column. Returns null for a column when it has
 * no parseable numbers (so the UI can show an empty total).
 */
export function sumColumnTotals(rows: string[][]): Array<number | null> {
  const cols = columnCount(rows);
  return Array.from({ length: cols }, (_, colIndex) => {
    let sum = 0;
    let count = 0;
    for (const row of rows) {
      const n = parseLooseNumber(row[colIndex] ?? "");
      if (n === null) continue;
      sum += n;
      count += 1;
    }
    return count > 0 ? sum : null;
  });
}

export function formatTableSum(value: number, columnCells: string[]) {
  const looksCurrency = columnCells.some((cell) =>
    cell.trim().startsWith("$")
  );
  const formatted = Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
  return looksCurrency ? `$${formatted}` : formatted;
}

export function compareTableCells(a: string, b: string) {
  const left = a.trim();
  const right = b.trim();

  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const na = parseLooseNumber(left);
  const nb = parseLooseNumber(right);
  if (na !== null && nb !== null) {
    if (na === nb) return 0;
    return na < nb ? -1 : 1;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortTableRows(
  rows: string[][],
  columnIndex: number,
  direction: TableSortDirection
) {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort(
    (a, b) =>
      compareTableCells(a[columnIndex] ?? "", b[columnIndex] ?? "") * factor
  );
}
