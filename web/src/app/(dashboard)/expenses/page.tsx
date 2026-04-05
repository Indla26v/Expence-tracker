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
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<Expense["type"]>("expense");
  const [editCategory, setEditCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [editDate, setEditDate] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
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
    setEditDate(format(new Date(e.date), "yyyy-MM-dd'T'HH:mm"));
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
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-cyan-400/70">Add, search, and manage transactions</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-cyan-500/50 bg-slate-950/60 backdrop-blur-sm px-4 py-2 text-sm font-medium text-cyan-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-600/20 transition-all duration-300"
        >
          Export CSV
        </button>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-6 min-h-0 pb-6">
        {/* Left Column: Add New Transaction (fixed, ~30%) */}
        <div className="w-full lg:w-[30%] shrink-0">
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/60 backdrop-blur-md p-6 shadow-lg shadow-cyan-900/30 sticky top-0 animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_backwards]">
            <h2 className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent mb-4">Add New Transaction</h2>
            <div className="grid gap-3 sm:grid-cols-1">
              <div>
                <label className="text-xs font-medium text-cyan-300">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Expense["type"])}
                  className="mt-1 w-full rounded-lg border border-cyan-600/30 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-cyan-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
                  className="mt-1 w-full rounded-lg border border-cyan-600/30 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all dark:[&>option]:bg-slate-900 dark:[&>option]:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-cyan-300">Amount</label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="mt-0.5 w-full rounded-md border border-cyan-600/30 bg-slate-800/50 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-cyan-300">Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-cyan-600/30 bg-slate-800/50 px-3 py-2 text-sm text-white focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-cyan-300">Note (optional)</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Lunch"
                  className="mt-1 w-full rounded-lg border border-cyan-600/30 bg-slate-800/50 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                />
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 animate-[slideDown_0.3s_ease-out]">
                {error}
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => void onAdd()}
                disabled={saving || !amount}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-600/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-700/50 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 active:scale-95"
              >
                {saving ? "Saving…" : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions List + Filters (~70%) */}
        <div className="w-full lg:w-[70%] flex flex-col gap-4 overflow-hidden">
          
          {/* Filter/Search Bar */}
          <div className="shrink-0 rounded-2xl border border-cyan-500/30 bg-slate-950/60 backdrop-blur-md p-4 sm:p-6 shadow-lg shadow-cyan-900/30 z-10 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="flex flex-col gap-4">
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
                        ? "border-cyan-400/60 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md shadow-cyan-600/30"
                        : "border-cyan-600/30 text-cyan-300 hover:border-cyan-400/60 hover:bg-cyan-600/20"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rangePreset === "month" && (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const monthName = format(new Date(2000, m - 1, 1), "MMM");
                    const isActive = month === m;
                    return (
                      <button
                        key={m}
                        onClick={() => setMonth(m)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                          isActive 
                            ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)] text-slate-950 scale-110 border border-cyan-400"
                            : "bg-slate-800/60 text-cyan-300/70 hover:bg-cyan-900/40 hover:text-cyan-200 border border-cyan-700/30"
                        }`}
                      >
                        {monthName}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium text-cyan-300">Year</label>
                  <input
                    type="number"
                    min={1970}
                    max={3000}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-md border border-cyan-600/30 bg-slate-800/50 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all disabled:opacity-50"
                    disabled={rangePreset === "week"}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-cyan-300">Search</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by note or category…"
                    className="mt-0.5 w-full rounded-md border border-cyan-600/30 bg-slate-800/50 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                  />
                </div>
                
                {rangePreset === "custom" && (
                  <>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-cyan-300">From</label>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="mt-0.5 w-full rounded-md border border-cyan-600/30 bg-slate-800/50 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-cyan-300">To</label>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="mt-0.5 w-full rounded-md border border-cyan-600/30 bg-slate-800/50 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-lg scrollbar-thin scrollbar-thumb-cyan-600/50 scrollbar-track-transparent">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-sm">
              <h2 className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">Transactions List</h2>
            </div>
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="px-6 py-10 text-center text-sm text-white/70">Loading…</div>
              ) : items.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-white/50">
                  No transactions for this period.
                </div>
              ) : (
                Object.entries(
                  items.reduce((acc, item) => {
                    const dateKey = format(new Date(item.date), "MMM d, yyyy");
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(item);
                    return acc;
                  }, {} as Record<string, Expense[]>)
                )
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .map(([dateKey, dayItems]) => (
                  <div key={dateKey} className="rounded-xl bg-blue-900/30 border border-blue-500/20 overflow-hidden shadow-sm">
                    <div className="bg-blue-900/40 px-4 py-2 border-b border-blue-500/20">
                      <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider">{dateKey}</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      {dayItems.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-white">
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
                              {e.note ? <span className="text-white/60"> — {e.note}</span> : null}
                            </div>
                            <div className="text-xs text-white/60 mt-1">
                              {format(new Date(e.date), "HH:mm")} • {e.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`text-base font-semibold ${e.type === "expense" ? "text-rose-400" : "text-emerald-400"}`}>
                              {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(e)}
                                className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-500/50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => void onDelete(e.id)}
                                className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:text-red-300 hover:bg-red-900/40 hover:border-red-500/50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="text-sm font-semibold text-white">Edit transaction</div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-md px-2 py-1 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white [&>option]:bg-slate-900 [&>option]:text-white"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white [&>option]:bg-slate-900 [&>option]:text-white"
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs text-white/70">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="text-xs text-white/70">Note</label>
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
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

