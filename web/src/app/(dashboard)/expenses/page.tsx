"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfMonth, startOfWeek } from "date-fns";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";

type Expense = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string | null;
  date: string;
};

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [q, setQ] = useState("");
  const [rangePreset, setRangePreset] = useState<
    "month" | "week" | "year" | "custom"
  >("month");
  const [from, setFrom] = useState<string>(() => format(now, "yyyy-MM-dd"));
  const [to, setTo] = useState<string>(() => format(addDays(now, 1), "yyyy-MM-dd"));

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Expense["type"]>("expense");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<Expense["type"]>("expense");
  const [editCategory, setEditCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [editDate, setEditDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const base = new Date(Date.UTC(year, month - 1, 1));
    if (rangePreset === "month") {
      const start = startOfMonth(base);
      setFrom(format(start, "yyyy-MM-dd"));
      setTo(format(addDays(addDays(start, 32), -((addDays(start, 32).getUTCDate() - 1))), "yyyy-MM-dd"));
      // to is exclusive-ish for API, but UI uses date input; we’ll send `to` as next day below.
    }
    if (rangePreset === "year") {
      setFrom(`${year}-01-01`);
      setTo(`${year + 1}-01-01`);
    }
    if (rangePreset === "week") {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      setFrom(format(start, "yyyy-MM-dd"));
      setTo(format(addDays(start, 7), "yyyy-MM-dd"));
    }
  }, [rangePreset, month, year]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (rangePreset === "month") {
      sp.set("month", String(month));
      sp.set("year", String(year));
    } else {
      sp.set("from", from);
      sp.set("to", to);
    }
    if (q.trim()) sp.set("q", q.trim());
    return sp.toString();
  }, [month, year, q, rangePreset, from, to]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses?${queryString}`, {
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = (await res.json()) as { items: Expense[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function onAdd() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          type,
          category,
          date,
          note: note.trim() ? note.trim() : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to add expense");
      }
      setAmount("");
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add expense");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    const prev = items;
    setItems((x) => x.filter((e) => e.id !== id));
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      setError("Failed to delete");
    }
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setEditAmount(String(e.amount));
    setEditType(e.type);
    setEditCategory((CATEGORIES.includes(e.category as Category) ? (e.category as Category) : "Other") as Category);
    setEditDate(format(new Date(e.date), "yyyy-MM-dd"));
    setEditNote(e.note ?? "");
  }

  async function onEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${editing.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(editAmount),
          type: editType,
          category: editCategory,
          date: editDate,
          note: editNote.trim() ? editNote.trim() : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to update");
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  }

  function exportCsv() {
    const header = ["date", "type", "category", "amount", "note"];
    const rows = items.map((e) => [
      format(new Date(e.date), "yyyy-MM-dd"),
      e.type,
      e.category,
      e.amount.toFixed(2),
      (e.note ?? "").replaceAll("\n", " ").trim(),
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-blue-400/70">Add, search, and manage transactions</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-blue-400 bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-slate-950 dark:border-blue-500/50 px-4 py-2 text-sm font-medium text-blue-200 dark:text-blue-300 hover:border-blue-500 dark:hover:border-blue-400/60 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-blue-600/20 transition-all duration-300"
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-blue-400 bg-gradient-to-br from-blue-900 to-blue-800 dark:bg-slate-950 dark:border-blue-500/50 p-6 sm:grid-cols-5 shadow-md dark:shadow-lg dark:shadow-blue-900/30">
        <div className="sm:col-span-5">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["month", "Month"],
                ["week", "Week"],
                ["year", "Year"],
                ["custom", "Custom"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setRangePreset(id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                  rangePreset === id
                    ? "border-blue-500 dark:border-blue-400/60 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-md shadow-blue-500/20 dark:shadow-blue-600/30"
                    : "border-slate-200 dark:border-blue-600/30 text-slate-600 dark:text-blue-300 hover:border-slate-300 dark:hover:border-blue-400/60 hover:bg-slate-50 dark:hover:bg-blue-600/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-blue-400 bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-slate-800/50 px-3 py-2 text-sm text-blue-100 dark:text-white placeholder-blue-300 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all disabled:opacity-50"
            disabled={rangePreset !== "month"}
          />
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Year</label>
          <input
            type="number"
            min={1970}
            max={3000}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all disabled:opacity-50"
            disabled={rangePreset === "week"}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by note or category…"
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
          />
        </div>
        {rangePreset === "custom" ? (
          <>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600 dark:text-blue-300">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600 dark:text-blue-300">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="rounded-2xl border border-purple-400 bg-gradient-to-br from-purple-900 to-purple-800 dark:bg-slate-950 dark:border-purple-500/50 p-6 shadow-md dark:shadow-lg dark:shadow-purple-900/30 backdrop-blur-sm animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_backwards]">
        <h2 className="text-sm font-semibold text-blue-800 dark:bg-gradient-to-r dark:from-blue-300 dark:to-blue-400 dark:bg-clip-text dark:text-transparent mb-4">Add New Transaction</h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-1">
            <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Expense["type"])}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-xs font-medium text-slate-600 dark:text-blue-300">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Lunch with coworkers"
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-blue-600/30 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-blue-500 dark:focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 outline-none transition-all"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-300 animate-[slideDown_0.3s_ease-out]">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={() => void onAdd()}
            disabled={saving || !amount}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-md dark:shadow-shadow-blue-600/30 transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-700/50 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 active:scale-95"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-600 bg-gradient-to-b from-slate-900 to-slate-800 dark:bg-slate-950 dark:border-white/10 shadow-md dark:shadow-lg backdrop-blur-sm overflow-hidden animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gradient-to-r dark:from-blue-600/10 dark:to-transparent border-b border-slate-200 dark:border-white/10">
          <h2 className="text-sm font-semibold text-blue-800 dark:bg-gradient-to-r dark:from-blue-300 dark:to-blue-400 dark:bg-clip-text dark:text-transparent">Transactions</h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/70">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-white/50">
              No transactions for this period.
            </div>
          ) : (
            items.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            CATEGORY_COLORS[e.category as Category] ?? "rgba(148,163,184,1)",
                        }}
                      />
                      {e.category}
                    </span>
                    {e.note ? <span className="text-slate-500 dark:text-white/60"> — {e.note}</span> : null}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-white/60 mt-1">
                    {format(new Date(e.date), "MMM d, yyyy")} • {e.type}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-medium ${e.type === "expense" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                  </div>
                  <button
                    onClick={() => openEdit(e)}
                    className="rounded-md border border-slate-200 dark:border-white/10 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-slate-100 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void onDelete(e.id)}
                    className="rounded-md border border-slate-200 dark:border-white/10 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-white/80 dark:hover:text-white dark:hover:bg-red-500/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 dark:bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-600 bg-gradient-to-b from-slate-900 to-slate-800 dark:bg-slate-900 p-4 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Edit transaction</div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="text-xs text-white/70">Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as Expense["type"])}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-white/70">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) =>
                    setEditCategory(e.target.value as (typeof CATEGORIES)[number])
                  }
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-white/70">Amount</label>
                <input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs text-white/70">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="text-xs text-white/70">Note</label>
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => void onEditSave()}
                disabled={editSaving}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
              >
                {editSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

