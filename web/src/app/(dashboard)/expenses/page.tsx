"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";
import { formatIST, parseIST } from "@/lib/date";
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
  const currentMonthStr = formatIST(new Date(), "MM");
  const currentYearStr = formatIST(new Date(), "yyyy");
  const [month, setMonth] = useState(parseInt(currentMonthStr, 10));
  const [year, setYear] = useState(parseInt(currentYearStr, 10));
  const [q, setQ] = useState("");
  const [overlayDate, setOverlayDate] = useState("");

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Expense["type"]>("expense");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [date, setDate] = useState(() => formatIST(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<Expense["type"]>("expense");
  const [editCategory, setEditCategory] = useState<(typeof CATEGORIES)[number]>("Lunch");
  const [editDate, setEditDate] = useState(() => formatIST(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("month", String(month));
    sp.set("year", String(year));
    if (q.trim()) sp.set("q", q.trim());
    return sp.toString();
  }, [month, year, q]);

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
          date: parseIST(date).toISOString(),
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
    setEditDate(formatIST(new Date(e.date), "yyyy-MM-dd'T'HH:mm"));
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
          date: parseIST(editDate).toISOString(),
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
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 min-h-0 pb-6 lg:overflow-hidden">
        {/* Full width: Transactions List + Filters */}
        <div className="w-full flex flex-col gap-4 lg:overflow-hidden">
          
          <div className="shrink-0 liquid-glass ambient-shadow overflow-hidden p-6 relative z-10 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="absolute inset-0 bg-white/[0.01] border-b border-white/5" />
            <div className="relative flex flex-col gap-6">
              
              {/* Month Selection Bubbles */}
              <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const monthName = format(new Date(2000, m - 1, 1), "MMM");
                  const isActive = month === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setMonth(m);
                        setOverlayDate(""); // Clear date selection when changing months manually
                      }}
                      className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                        isActive 
                          ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white scale-110 border border-blue-300/50 z-10"
                          : "bg-slate-800/40 backdrop-blur-md text-blue-300/70 hover:bg-slate-700/60 hover:text-blue-200 border border-white/5 hover:border-blue-400/30"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />
                      )}
                      {monthName}
                    </button>
                  );
                })}
              </div>

              {/* Secondary Row: Year, Date, Search */}
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium tracking-tight text-white/60 mb-2 block uppercase">Select Year</label>
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(Number(e.target.value));
                      setOverlayDate("");
                    }}
                    className="w-full appearance-none rounded-[16px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-4 py-3 text-sm tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50 [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium tracking-tight text-white/60 mb-2 block uppercase">Select Date</label>
                  <input
                    type="date"
                    value={overlayDate}
                    onChange={(e) => {
                      setOverlayDate(e.target.value);
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-");
                        setYear(Number(y));
                        setMonth(Number(m));
                      }
                    }}
                    className="w-full rounded-[16px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-4 py-3 text-sm tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert hover:[&::-webkit-calendar-picker-indicator]:opacity-80"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium tracking-tight text-white/60 mb-2 block uppercase">Search</label>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by note or category…"
                    className="w-full rounded-[16px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-4 py-3 text-sm tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50"
                  />
                </div>
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
                  <div 
                    key={dateKey} 
                    className="group/day relative rounded-[24px] bg-blue-900/10 border border-blue-500/20 backdrop-blur-[12px] shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-full overflow-hidden hover:scale-[1.01] hover:bg-blue-900/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:border-blue-400/30"
                  >
                    <div className="bg-blue-900/20 px-5 py-3 border-b border-blue-500/20">
                      <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-widest">{dateKey}</h3>
                    </div>
                    <div className="divide-y divide-blue-500/10">
                      {dayItems.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-blue-500/10 transition-colors group/item"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium tracking-tight text-white group-hover/item:text-blue-50 transition-colors">
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                  style={{
                                    background: e.type === "expense" ? "#f43f5e" : "#10b981",
                                    boxShadow: `0 0 10px ${e.type === "expense" ? "#f43f5e" : "#10b981"}40`
                                  }}
                                />
                                {e.category}
                              </span>
                              {e.note ? <span className="text-white/40 group-hover/item:text-white/60 transition-colors"> — {e.note}</span> : null}
                            </div>
                            <div className="text-xs tracking-tight text-white/40 group-hover/item:text-white/60 mt-1 transition-colors flex items-center gap-1">
                              <div className="w-[1.125rem] shrink-0" />
                              {format(new Date(e.date), "HH:mm")} • {e.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className={`text-base tracking-tight font-semibold transition-colors ${
                              e.type === "expense" ? "text-rose-400 group-hover/item:text-rose-300" : "text-emerald-400 group-hover/item:text-emerald-300"
                            }`}>
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

      {overlayDate ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[24px] border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-1 ring-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
              <div className="text-lg font-semibold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">Transactions for {overlayDate}</div>
              <button
                onClick={() => setOverlayDate("")}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-cyan-500/20 transition-colors border border-transparent hover:border-cyan-500/30"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-cyan-600/50 scrollbar-track-transparent">
              {items.filter(item => formatIST(new Date(item.date), "yyyy-MM-dd") === overlayDate).length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-white/50">
                  No transactions for this date.
                </div>
              ) : (
                items.filter(item => formatIST(new Date(item.date), "yyyy-MM-dd") === overlayDate)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="group/item relative rounded-xl bg-blue-900/10 border border-blue-500/20 backdrop-blur-md shadow-sm transition-all duration-300 ease-out hover:bg-blue-900/20 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-blue-400/30 flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium tracking-tight text-white group-hover/item:text-blue-50 transition-colors">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                              style={{
                                background: e.type === "expense" ? "#f43f5e" : "#10b981",
                                boxShadow: `0 0 10px ${e.type === "expense" ? "#f43f5e" : "#10b981"}40`
                              }}
                            />
                            {e.category}
                          </span>
                          {e.note ? <span className="text-white/40 group-hover/item:text-white/60 transition-colors"> — {e.note}</span> : null}
                        </div>
                        <div className="text-xs tracking-tight text-white/40 group-hover/item:text-white/60 mt-1 transition-colors flex items-center gap-1">
                          <div className="w-[1.125rem] shrink-0" />
                          {formatIST(new Date(e.date), "HH:mm")} • {e.type}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-base tracking-tight font-semibold transition-colors ${
                          e.type === "expense" ? "text-rose-400" : "text-emerald-400"
                        }`}>
                          {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 z-10">
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
                  ))
              )}
            </div>
          </div>
        </div>
      ) : null}

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
                  onChange={(e) => {
                    const newType = e.target.value as Expense["type"];
                    setEditType(newType);
                    if (newType === "income" && !["Salary", "Budget Allowance", "Others"].includes(editCategory)) {
                      setEditCategory("Salary");
                    } else if (newType === "expense" && ["Salary", "Budget Allowance", "Others"].includes(editCategory)) {
                      setEditCategory("Lunch");
                    }
                  }}
                  className="mt-1 w-full appearance-none rounded-[16px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-3 py-2 text-sm tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50 [&>option]:bg-slate-900 [&>option]:text-white"
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
                  className="mt-1 w-full appearance-none rounded-[16px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-3 py-2 text-sm tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  {(editType === "income" 
                    ? (["Salary", "Budget Allowance", "Others"] as Category[]) 
                    : CATEGORIES.filter(c => !["Salary", "Budget Allowance", "Others"].includes(c))
                  ).map((c) => (
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

