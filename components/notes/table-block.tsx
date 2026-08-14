"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MAX_TABLE_COLS,
  MAX_TABLE_ROWS,
  MIN_TABLE_COLS,
  MIN_TABLE_ROWS,
  columnCount,
  formatTableSum,
  normalizeTableBlock,
  sortTableRows,
  sumColumnTotals,
  type TableSortDirection,
} from "@/lib/utils/table";

interface TableData {
  headers: string[];
  rows: string[][];
  showSumRow: boolean;
}

interface TableBlockViewProps {
  headers: string[];
  rows: string[][];
  showSumRow?: boolean;
  onChange: (next: TableData) => void;
}

interface SortState {
  column: number;
  direction: TableSortDirection;
}

export function TableBlockView({
  headers,
  rows,
  showSumRow = false,
  onChange,
}: TableBlockViewProps) {
  const [table, setTable] = useState(() =>
    normalizeTableBlock({ headers, rows, showSumRow })
  );
  const [sort, setSort] = useState<SortState | null>(null);

  useEffect(() => {
    setTable(normalizeTableBlock({ headers, rows, showSumRow }));
  }, [headers, rows, showSumRow]);

  const cols = columnCount(table.rows);
  const columnTotals = useMemo(
    () => (table.showSumRow ? sumColumnTotals(table.rows) : []),
    [table.showSumRow, table.rows]
  );

  function commit(next: Partial<TableData> & Pick<TableData, "headers" | "rows">) {
    const normalized = normalizeTableBlock({
      ...table,
      ...next,
    });
    setTable(normalized);
    onChange(normalized);
  }

  function updateHeader(colIndex: number, value: string) {
    commit({
      headers: table.headers.map((cell, c) => (c === colIndex ? value : cell)),
      rows: table.rows,
    });
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    commit({
      headers: table.headers,
      rows: table.rows.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === colIndex ? value : cell))
          : row
      ),
    });
  }

  function addRow() {
    if (table.rows.length >= MAX_TABLE_ROWS) return;
    commit({
      headers: table.headers,
      rows: [...table.rows, Array.from({ length: cols }, () => "")],
    });
  }

  function removeRow(rowIndex: number) {
    if (table.rows.length <= MIN_TABLE_ROWS) return;
    commit({
      headers: table.headers,
      rows: table.rows.filter((_, index) => index !== rowIndex),
    });
  }

  function addColumn() {
    if (cols >= MAX_TABLE_COLS) return;
    commit({
      headers: [...table.headers, ""],
      rows: table.rows.map((row) => [...row, ""]),
    });
  }

  function removeColumn(colIndex: number) {
    if (cols <= MIN_TABLE_COLS) return;
    commit({
      headers: table.headers.filter((_, index) => index !== colIndex),
      rows: table.rows.map((row) =>
        row.filter((_, index) => index !== colIndex)
      ),
    });
    setSort((prev) => {
      if (!prev) return null;
      if (prev.column === colIndex) return null;
      if (prev.column > colIndex) {
        return { ...prev, column: prev.column - 1 };
      }
      return prev;
    });
  }

  function toggleSort(colIndex: number) {
    const nextDirection: TableSortDirection =
      sort?.column === colIndex && sort.direction === "asc" ? "desc" : "asc";
    const nextRows = sortTableRows(table.rows, colIndex, nextDirection);
    setSort({ column: colIndex, direction: nextDirection });
    commit({ headers: table.headers, rows: nextRows });
  }

  function toggleSumRow() {
    commit({
      headers: table.headers,
      rows: table.rows,
      showSumRow: !table.showSumRow,
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--teal)]/35 bg-[var(--teal)]/8 px-3 py-3 sm:px-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]/45">
          Table
        </p>
        <div className="flex flex-wrap gap-1.5">
          <TableAction
            onClick={addRow}
            disabled={table.rows.length >= MAX_TABLE_ROWS}
          >
            + Row
          </TableAction>
          <TableAction
            onClick={addColumn}
            disabled={cols >= MAX_TABLE_COLS}
          >
            + Column
          </TableAction>
          <TableAction onClick={toggleSumRow} pressed={table.showSumRow}>
            {table.showSumRow ? "Hide sum" : "Show sum"}
          </TableAction>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[16rem] border-collapse text-sm">
          <thead>
            <tr>
              {Array.from({ length: cols }, (_, colIndex) => (
                <th
                  key={`col-remove-${colIndex}`}
                  className="px-1 pb-1 text-center font-normal"
                >
                  <button
                    type="button"
                    onClick={() => removeColumn(colIndex)}
                    disabled={cols <= MIN_TABLE_COLS}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)]/35 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove column ${colIndex + 1}`}
                  >
                    − col
                  </button>
                </th>
              ))}
              <th className="w-8" aria-hidden />
            </tr>
            <tr>
              {table.headers.map((header, colIndex) => {
                const isSorted = sort?.column === colIndex;
                return (
                  <th
                    key={`header-${colIndex}`}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sort.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    title="Click header to sort · edit title in the field"
                    className="cursor-pointer border border-[var(--ink)]/15 bg-[var(--ink)]/[0.06] p-0 align-top"
                    onClick={() => toggleSort(colIndex)}
                  >
                    <div className="flex min-w-[5.5rem] items-stretch">
                      <input
                        value={header}
                        onChange={(e) =>
                          updateHeader(colIndex, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Column ${colIndex + 1} header`}
                        placeholder={`Column ${colIndex + 1}`}
                        className="min-w-0 flex-1 cursor-text bg-transparent px-2.5 py-2 text-sm font-bold text-[var(--ink)] outline-none placeholder:font-semibold placeholder:text-[var(--ink)]/35 focus:bg-[var(--sun)]/25"
                      />
                      <span
                        className={`flex shrink-0 items-center px-2 text-xs font-bold ${
                          isSorted
                            ? "text-[var(--teal-dark)]"
                            : "text-[var(--ink)]/35"
                        }`}
                        aria-hidden
                      >
                        {isSorted
                          ? sort.direction === "asc"
                            ? "↑"
                            : "↓"
                          : "↕"}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="w-8" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {row.map((cell, colIndex) => (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className="border border-[var(--ink)]/12 bg-white/85 p-0 align-top"
                  >
                    <input
                      value={cell}
                      onChange={(e) =>
                        updateCell(rowIndex, colIndex, e.target.value)
                      }
                      aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                      className="block w-full min-w-[5.5rem] bg-transparent px-2.5 py-2 text-sm font-normal text-[var(--ink)] outline-none placeholder:text-[var(--ink)]/30 focus:bg-[var(--sun)]/20"
                      placeholder="…"
                    />
                  </td>
                ))}
                <td className="pl-1 align-middle">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={table.rows.length <= MIN_TABLE_ROWS}
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink)]/35 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove row ${rowIndex + 1}`}
                  >
                    − row
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {table.showSumRow ? (
            <tfoot>
              <tr>
                {columnTotals.map((total, colIndex) => (
                  <td
                    key={`sum-${colIndex}`}
                    className="border border-[var(--ink)]/15 bg-[var(--teal)]/15 px-2.5 py-2 text-sm font-bold text-[var(--ink)]"
                  >
                    {total === null
                      ? ""
                      : formatTableSum(
                          total,
                          table.rows.map((row) => row[colIndex] ?? "")
                        )}
                  </td>
                ))}
                <td className="pl-1 align-middle">
                  <span className="px-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--ink)]/45">
                    Sum
                  </span>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}

function TableAction({
  children,
  onClick,
  disabled,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        pressed
          ? "bg-[var(--teal)]/20 text-[var(--teal-dark)] ring-[var(--teal)]/40"
          : "bg-white/80 text-[var(--ink)]/70 ring-[var(--ink)]/10 hover:text-[var(--teal-dark)] hover:ring-[var(--teal)]/40"
      }`}
    >
      {children}
    </button>
  );
}
