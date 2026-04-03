"use client";

import { useEffect, useMemo, useState } from "react";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-white/70">Budget and preferences</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/50 dark:border-white/10 dark:bg-black/20 p-4">
        <div className="text-sm font-medium text-slate-900 dark:text-white">Total Money Baseline</div>
        <p className="mb-4 text-xs text-slate-500 dark:text-white/60">Set an initial or base amount to adjust your Total Money calculation.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-white/70">Base Amount</label>
            <input
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {balanceError ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-200">
            {balanceError}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => void onSaveBalance()}
            disabled={savingBalance || loadingSettings}
            className="rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-white px-3 py-2 text-sm font-medium text-white dark:text-black disabled:opacity-60 transition-colors"
          >
            {savingBalance ? "Saving..." : "Save Base Amount"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white/50 dark:border-white/10 dark:bg-black/20 p-4">
        <div className="text-sm font-medium text-slate-900 dark:text-white">Monthly budget</div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-white/70">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-white/70">Year</label>
            <input
              type="number"
              min={1970}
              max={3000}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-white/70">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-white/70">Loading...</div>
        ) : current ? (
          <div className="mt-4 text-sm text-slate-500 dark:text-white/70">
            Current budget: <span className="font-semibold text-slate-900 dark:text-white">₹{current.amount.toFixed(2)}</span>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-500 dark:text-white/70">No budget set.</div>
        )}

        {error ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => void onSaveBudget()}
            disabled={saving || !amount}
            className="rounded-md bg-blue-600 hover:bg-blue-700 dark:bg-white px-3 py-2 text-sm font-medium text-white dark:text-black disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </div>
    </div>
  );
}
