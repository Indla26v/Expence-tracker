"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, Calendar, CalendarDays, IndianRupee, Database, Trash2, Download, Check, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

type Budget = { id: string; month: number; year: number; amount: number };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SettingsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [amount, setAmount] = useState("");

  const [current, setCurrent] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialBalance, setInitialBalance] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [dbMonth, setDbMonth] = useState(now.getUTCMonth() + 1);
  const [dbYear, setDbYear] = useState(now.getUTCFullYear());
  const [dbMonthMenuOpen, setDbMonthMenuOpen] = useState(false);
  const [budgetMonthMenuOpen, setBudgetMonthMenuOpen] = useState(false);
  const [dbDeleting, setDbDeleting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSuccess, setDbSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dbExporting, setDbExporting] = useState(false);

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("month", String(month));
    sp.set("year", String(year));
    return sp.toString();
  }, [month, year]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/budget?${qs}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load budget");
        return (await res.json()) as { budget: Budget | null };
      })
      .then((json) => {
        if (cancelled) return;
        setCurrent(json.budget);
        setAmount(json.budget ? String(json.budget.amount) : "");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load budget");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qs]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSettings(true);
    fetch("/api/user/settings")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load settings");
        return await res.json();
      })
      .then((json: any) => {
        if (!cancelled) setInitialBalance(String(json.initialBalance ?? ""));
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSaveBudget() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          amount: Number(amount),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save budget");
      }
      const json = (await res.json()) as { budget: Budget };
      setCurrent(json.budget);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBalance() {
    setSavingBalance(true);
    setBalanceError(null);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          initialBalance: Number(initialBalance),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save total money");
      }
      const json = await res.json();
      setInitialBalance(String(json.initialBalance));
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to save total money");
    } finally {
      setSavingBalance(false);
    }
  }

  async function onExportCsv() {
    setDbExporting(true);
    setDbError(null);
    setDbSuccess(null);
    try {
      const res = await fetch(`/api/expenses/export?month=${dbMonth}&year=${dbYear}`);
      if (!res.ok) {
        throw new Error("Failed to export data");
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${dbYear}-${dbMonth.toString().padStart(2, "0")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDbSuccess("Data exported successfully.");
    } catch (e) {
      setDbError(e instanceof Error ? e.message : "Failed to export data");
    } finally {
      setDbExporting(false);
    }
  }

  async function onDeleteData() {
    setDbDeleting(true);
    setDbError(null);
    setDbSuccess(null);
    try {
      if (!confirmDelete) {
        setConfirmDelete(true);
        setDbDeleting(false);
        return;
      }
      
      const res = await fetch(`/api/expenses?month=${dbMonth}&year=${dbYear}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete data");
      }
      
      const json = await res.json();
      setDbSuccess(`Successfully deleted ${json.deleted ?? 0} records.`);
      setConfirmDelete(false);
    } catch (e) {
      setDbError(e instanceof Error ? e.message : "Failed to delete data");
    } finally {
      setDbDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-8 space-y-8 font-sans">
      <div className="text-center space-y-2 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Settings & Preferences
        </h1>
        <p className="text-sm font-medium tracking-tight text-white/50">Manage your total money baseline and monthly budgets</p>
      </div>

      <div className="space-y-6">
        <div className="liquid-glass ambient-shadow p-8 rounded-[24px] border border-white/5 bg-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:bg-slate-950/50 hover:shadow-cyan-900/10 hover:shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-white/90 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-cyan-400" />
              Total Money Baseline
            </h2>
            <p className="mt-1 text-xs tracking-tight text-white/50">
              Set an initial amount to adjust your overall wallet calculation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Base Amount</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 group-focus-within:text-cyan-400 transition-colors">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <input
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm font-medium tracking-tight text-white placeholder-white/30 outline-none ring-1 ring-transparent transition-all hover:bg-black/30 focus:border-cyan-500/50 focus:bg-black/40 focus:ring-cyan-500/20 focus:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                />
              </div>
            </div>

            {balanceError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                {balanceError}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => void onSaveBalance()}
                disabled={savingBalance || loadingSettings}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
              >
                {savingBalance ? "Saving..." : "Save Baseline"}
              </button>
            </div>
          </div>
        </div>

        <div className="liquid-glass ambient-shadow p-8 rounded-[24px] border border-white/5 bg-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:bg-slate-950/50 hover:shadow-indigo-900/10 hover:shadow-2xl">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white/90 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-400" />
                Monthly Budget
              </h2>
              <p className="mt-1 text-xs tracking-tight text-white/50">
                Set and manage your target spending limit for any month.
              </p>
            </div>
            
            <div className="shrink-0 mt-1 sm:mt-0">
              {loading ? (
                <div className="h-6 w-24 animate-pulse rounded-full bg-white/10" />
              ) : current ? (
                <div className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-300 ring-1 ring-inset ring-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                  Active Limit: ₹{current.amount.toFixed(2)}
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-white/40 ring-1 ring-inset ring-white/10">
                  No Budget Set
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="z-[80] relative">
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Month</label>
              <DropdownMenu.Root open={budgetMonthMenuOpen} onOpenChange={setBudgetMonthMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-[1px] text-sm font-medium tracking-tight text-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all hover:bg-white/[0.06] hover:shadow-[0_4px_32px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <div className="flex h-11 w-full items-center justify-between rounded-[10px] bg-gradient-to-b from-white/[0.05] to-transparent pl-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        <span className="text-white/90 tracking-tight">
                          {MONTHS[month - 1]}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </button>
                </DropdownMenu.Trigger>

                <AnimatePresence>
                  {budgetMonthMenuOpen && (
                    <DropdownMenu.Portal forceMount>
                      <DropdownMenu.Content
                        asChild
                        align="start"
                        sideOffset={8}
                        className="z-[999] min-w-[200px]"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]/90 p-1.5 shadow-[0_16px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar"
                        >
                          {MONTHS.map((mName, i) => {
                            const mValue = i + 1;
                            const isSelected = month === mValue;
                            return (
                              <DropdownMenu.Item
                                key={mValue}
                                onSelect={() => {
                                  setMonth(mValue);
                                  setBudgetMonthMenuOpen(false);
                                }}
                                className={`relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all outline-none data-[highlighted]:bg-white/10 ${
                                  isSelected ? "text-indigo-400 bg-indigo-500/10" : "text-white/80"
                                }`}
                              >
                                <span className="truncate">{mName}</span>
                                {isSelected && <Check className="h-4 w-4" />}
                              </DropdownMenu.Item>
                            );
                          })}
                        </motion.div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  )}
                </AnimatePresence>
              </DropdownMenu.Root>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Year</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 group-focus-within:text-indigo-400 transition-colors">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  min={1970}
                  max={3000}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm font-medium tracking-tight text-white outline-none ring-1 ring-transparent transition-all hover:bg-black/30 focus:border-indigo-500/50 focus:bg-black/40 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Amount</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 group-focus-within:text-indigo-400 transition-colors">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm font-medium tracking-tight text-white placeholder-white/30 outline-none ring-1 ring-transparent transition-all hover:bg-black/30 focus:border-indigo-500/50 focus:bg-black/40 focus:ring-indigo-500/20 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-rose-300">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-6">
            <button
              onClick={() => void onSaveBudget()}
              disabled={saving || !amount}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
            >
              {saving ? "Saving..." : "Save Limit"}
            </button>
          </div>
        </div>

        {/* Database Management Section */}
        <div className="liquid-glass ambient-shadow p-8 rounded-[24px] border border-red-500/20 bg-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:bg-slate-950/50 hover:shadow-red-900/10 hover:shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-red-400 flex items-center gap-2">
              <Database className="h-5 w-5 text-red-500" />
              Database Management
            </h2>
            <p className="mt-1 text-xs tracking-tight text-white/50">
              Export data or permanently delete old records to optimize application performance.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="z-[70] relative">
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Target Month</label>
              <DropdownMenu.Root open={dbMonthMenuOpen} onOpenChange={setDbMonthMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04] p-[1px] text-sm font-medium tracking-tight text-white/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all hover:bg-white/[0.06] hover:shadow-[0_4px_32px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <div className="flex h-11 w-full items-center justify-between rounded-[10px] bg-gradient-to-b from-white/[0.05] to-transparent pl-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        <span className="text-white/90 tracking-tight">
                          {MONTHS[dbMonth - 1]}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/40 transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </button>
                </DropdownMenu.Trigger>

                <AnimatePresence>
                  {dbMonthMenuOpen && (
                    <DropdownMenu.Portal forceMount>
                      <DropdownMenu.Content
                        asChild
                        align="start"
                        sideOffset={8}
                        className="z-[999] min-w-[200px]"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0a0a0a]/90 p-1.5 shadow-[0_16px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar"
                        >
                          {MONTHS.map((mName, i) => {
                            const mValue = i + 1;
                            const isSelected = dbMonth === mValue;
                            return (
                              <DropdownMenu.Item
                                key={mValue}
                                onSelect={() => {
                                  setDbMonth(mValue);
                                  setConfirmDelete(false);
                                  setDbSuccess(null);
                                  setDbError(null);
                                  setDbMonthMenuOpen(false);
                                }}
                                className={`relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all outline-none data-[highlighted]:bg-white/10 ${
                                  isSelected ? "text-indigo-400 bg-indigo-500/10" : "text-white/80"
                                }`}
                              >
                                <span className="truncate">{mName}</span>
                                {isSelected && <Check className="h-4 w-4" />}
                              </DropdownMenu.Item>
                            );
                          })}
                        </motion.div>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  )}
                </AnimatePresence>
              </DropdownMenu.Root>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wide text-white/80 uppercase">Target Year</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-white/40 group-focus-within:text-red-400 transition-colors">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  min={1970}
                  max={3000}
                  value={dbYear}
                  onChange={(e) => {
                    setDbYear(Number(e.target.value));
                    setConfirmDelete(false);
                    setDbSuccess(null);
                    setDbError(null);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 py-3 text-sm font-medium tracking-tight text-white outline-none ring-1 ring-transparent transition-all hover:bg-black/30 focus:border-red-500/50 focus:bg-black/40 focus:ring-red-500/20 focus:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                />
              </div>
            </div>
          </div>

          {dbError && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-rose-300">
              {dbError}
            </div>
          )}
          
          {dbSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
              {dbSuccess}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6">
            <button
              onClick={() => void onExportCsv()}
              disabled={dbExporting}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-6 py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-black/50 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              {dbExporting ? "Exporting..." : "Export as CSV"}
            </button>
            
            <button
              onClick={() => void onDeleteData()}
              disabled={dbDeleting}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 focus:outline-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                confirmDelete 
                  ? "bg-red-600 hover:bg-red-500 shadow-red-500/30 focus:ring-2 focus:ring-red-400/50 animate-pulse" 
                  : "bg-gradient-to-r from-rose-500 to-red-600 shadow-red-500/25 hover:from-rose-400 hover:to-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] focus:ring-2 focus:ring-red-400/50"
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {dbDeleting ? "Processing..." : confirmDelete ? "Click again to confirm PERMANENT DELETE" : "Clear Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
