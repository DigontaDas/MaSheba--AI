"use client";

import { useMemo, useState } from "react";

type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  searchValue?: (row: T) => string;
};

export function AdminTable<T>({
  rows,
  columns,
  emptyLabel,
  searchPlaceholder = "Search records",
}: {
  rows: T[];
  columns: Column<T>[];
  emptyLabel: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      columns.some((column) => (column.searchValue?.(row) || "").toLowerCase().includes(normalized)),
    );
  }, [columns, query, rows]);

  return (
    <div className="rounded-3xl border border-brand-accent/10 bg-white p-1 overflow-hidden shadow-sm">
      <div className="border-b border-brand-accent/10 p-4 bg-brand-cream/10 flex items-center justify-between gap-3">
        <label className="sr-only" htmlFor="table-search">
          Search table
        </label>
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            className="h-10 w-full pl-10 pr-4 rounded-full border border-brand-accent/10 bg-brand-cream/30 text-sm font-medium outline-none focus:bg-white focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition duration-150 text-slate-800 placeholder-slate-400"
            id="table-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={query}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-accent/10 text-sm">
          <thead className="bg-brand-cream/20 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="whitespace-nowrap px-6 py-4" key={column.key}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/10 bg-white">
            {filtered.map((row, index) => (
              <tr className="hover:bg-brand-cream/20 transition duration-150" key={index}>
                {columns.map((column) => (
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600 font-semibold" key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="px-6 py-12 text-center font-bold text-slate-400">{emptyLabel}</p> : null}
      </div>
    </div>
  );
}
