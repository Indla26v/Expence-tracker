"use client";

import { useEffect, useMemo, useState } from "react";

type Budget = { id: string; month: number; year: number; amount: number };

export default function SettingsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [amount, setAmount] = useState("");

  const [current, setCurrent] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function onSave() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-white/70">Budget and preferences</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="text-sm font-medium">Monthly budget</div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-white/70">Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/70">Year</label>
            <input
              type="number"
              min={1970}
              max={3000}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/70">Amount</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-white/70">Loading…</div>
        ) : current ? (
          <div className="mt-4 text-sm text-white/70">
            Current budget: <span className="text-white">₹{current.amount.toFixed(2)}</span>
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/70">No budget set.</div>
        )}

        {error ? (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => void onSave()}
            disabled={saving || !amount}
            className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

