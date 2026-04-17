"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";
import { toIST, startOfMonthIST, IST_OFFSET_MS } from "@/lib/date";
import { TransactionActions } from "@/components/transaction-actions";

type Expense = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string | null;
  date: string;
};

export default function ExpensesPage() {
  const nowIst = toIST(new Date());
  const [month, setMonth] = useState(nowIst.getUTCMonth() + 1);
  const [year, setYear] = useState(nowIst.getUTCFullYear());
  const [q, setQ] = useState("");
  const [rangePreset, setRangePreset] = useState<
    "month" | "week" | "year" | "custom"
  >("month");
  const [from, setFrom] = useState<string>(() => format(nowIst, "yyyy-MM-dd"));
  const [to, setTo] = useState<string>(() => format(addDays(nowIst, 1), "yyyy-MM-dd"));

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Expense["type"]>("expense");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [date, setDate] = useState(() => format(nowIst, "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<Expense["type"]>("expense");
  const [editCategory, setEditCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [editDate, setEditDate] = useState(() => format(nowIst, "yyyy-MM-dd'T'HH:mm"));
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const baseIst = new Date(Date.UTC(year, month - 1, 1));
    if (rangePreset === "month") {
      const start = baseIst;
      setFrom(format(start, "yyyy-MM-dd"));
      setTo(format(addDays(addDays(start, 32), -((addDays(start, 32).getUTCDate() - 1))), "yyyy-MM-dd"));
    }
    if (rangePreset === "year") {
      setFrom(`${year}-01-01`);
      setTo(`${year + 1}-01-01`);
    }
    if (rangePreset === "week") {
      const start = startOfWeek(nowIst, { weekStartsOn: 1 });
      setFrom(format(start, "yyyy-MM-dd"));
      setTo(format(addDays(start, 7), "yyyy-MM-dd"));
    }
  }, [rangePreset, month, year, nowIst]);

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
          date: new Date(new Date(date + "Z").getTime() - IST_OFFSET_MS).toISOString(),
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
    setEditDate(format(toIST(new Date(e.date)), "yyyy-MM-dd'T'HH:mm"));
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
          date: new Date(new Date(editDate + "Z").getTime() - IST_OFFSET_MS).toISOString(),
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
      format(toIST(new Date(e.date)), "yyyy-MM-dd HH:mm"),
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
    <div className="flex flex-col h-auto lg:h-[calc(100vh-6rem)] space-y-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 flex-wrap animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Expenses
          </h1>
          <p className="mt-1 text-sm text-cyan-400/70">Add, search, and manage transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <TransactionActions onAddSuccess={() => load()} />
          <button
            onClick={exportCsv}
            className="rounded-lg border border-cyan-500/50 bg-slate-950/60 backdrop-blur-sm px-4 py-2 text-sm font-medium text-cyan-300 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-600/20 transition-all duration-300 h-[42px]"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 min-h-0 pb-6 lg:overflow-hidden">
        {/* Full width: Transactions List + Filters */}
        <div className="w-full flex flex-col gap-4 lg:overflow-hidden">
          
          <div className="shrink-0 liquid-glass ambient-shadow overflow-hidden p-6 relative z-10 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="absolute inset-0 bg-white/[0.01] border-b border-white/5" />
            <div className="relative flex flex-col gap-5">
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
                    className={`rounded-full px-4 py-2 text-xs font-semibold tracking-tight transition-all duration-300 ${
                      rangePreset === id
                        ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                        : "bg-black/20 text-white/50 hover:bg-white/5 hover:text-white/80 border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]"
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
                        className={`rounded-full px-3 py-1.5 text-xs font-medium tracking-tight transition-all duration-300 ${
                          isActive 
                            ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] scale-105 border border-cyan-400/30"
                            : "bg-black/20 text-white/40 hover:bg-white/5 hover:text-white/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] border border-transparent"
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
                  <label className="text-xs font-medium tracking-tight text-white/60 mb-2 block">Year</label>
                  <input
                    type="number"
                    min={1970}
                    max={3000}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-[16px] bg-black/30 px-4 py-3 text-sm tracking-tight text-white placeholder-white/20 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] outline-none ring-1 ring-white/5 transition-all focus:bg-black/40 focus:ring-white/20 hover:bg-black/20 disabled:opacity-50"
                    disabled={rangePreset === "week"}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium tracking-tight text-white/60 mb-2 block">Search</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by note or category…"
                    className="w-full rounded-[16px] bg-black/30 px-4 py-3 text-sm tracking-tight text-white placeholder-white/20 shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)] outline-none ring-1 ring-white/5 transition-all focus:bg-black/40 focus:ring-white/20 hover:bg-black/20"
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
          <div className="flex-1 overflow-y-auto lg:overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-md shadow-lg scrollbar-thin scrollbar-thumb-cyan-600/50 scrollbar-track-transparent">
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

