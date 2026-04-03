"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { CATEGORY_COLORS, type Category } from "@/lib/categories";

type MonthlyResponse = {
  month: number;
  year: number;
  totals: { income: number; expense: number; net: number };
  byDay: Array<{ day: string; income: number; expense: number }>;
  byCategory: Array<{ category: string; total: number }>;
  topCategories: Array<{ category: string; total: number }>;
};

type YearlyResponse = {
  year: number;
  totals: { income: number; expense: number; net: number };
  byMonth: Array<{ month: string; income: number; expense: number }>;
  byCategory: Array<{ category: string; total: number }>;
};

type DailyResponse = {
  date: string;
  totals: { income: number; expense: number; net: number };
  byHour: Array<{ hour: number; income: number; expense: number }>;
  week: { byDayOfWeek: Array<{ dow: number; expense: number }> };
};

export default function AnalyticsPage() {
  const now = new Date();
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [date, setDate] = useState(() => format(now, "yyyy-MM-dd"));

  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [yearly, setYearly] = useState<YearlyResponse | null>(null);
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    if (view === "monthly") return `month={month}&year=₹{year}`;
    if (view === "yearly") return `year=₹{year}`;
    return `date=₹{encodeURIComponent(date)}`;
  }, [month, year, view, date]);

  useEffect(() => {
    let cancelled = false;
    const url =
      view === "monthly"
        ? `/api/analytics/monthly?₹{qs}`
        : view === "yearly"
          ? `/api/analytics/yearly?₹{qs}`
          : `/api/analytics/daily?₹{qs}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return (await res.json()) as unknown;
      })
      .then((json) => {
        if (cancelled) return;
        if (view === "monthly") setMonthly(json as MonthlyResponse);
        if (view === "yearly") setYearly(json as YearlyResponse);
        if (view === "daily") setDaily(json as DailyResponse);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [qs, view]);

  const pieData =
    ((view === "monthly" ? monthly?.byCategory : view === "yearly" ? yearly?.byCategory : []) ?? [])
      .filter((x) => x.total > 0)
      .map((x) => ({
        name: x.category,
        value: x.total,
        color: CATEGORY_COLORS[x.category as Category] ?? "#94a3b8",
      })) ?? [];

  const lineData =
    monthly?.byDay.map((d) => ({
      day: format(new Date(d.day), "d"),
      expense: d.expense,
      income: d.income,
    })) ?? [];

  const monthBars =
    yearly?.byMonth.map((m) => ({
      month: format(new Date(m.month), "MMM"),
      expense: m.expense,
      income: m.income,
    })) ?? [];

  const hourBars =
    daily?.byHour.map((h) => ({
      hour: `${h.hour}:00`,
      expense: h.expense,
      income: h.income,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-white/70">Daily, monthly, and yearly reports</p>
      </div>

      <div className="grid gap-4 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-4">
        <div className="sm:col-span-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["daily", "Daily"],
              ["monthly", "Monthly"],
              ["yearly", "Yearly"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setLoading(true);
                setError(null);
                setView(id);
              }}
              className={`rounded-md border px-2 py-1 text-xs ${
                view === id
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "monthly" ? (
          <div className="sm:col-span-1">
          <label className="text-xs text-white/70">Month</label>
          <select
            value={month}
            onChange={(e) => {
              setLoading(true);
              setError(null);
              setMonth(Number(e.target.value));
            }}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          </div>
        ) : null}

        <div className="sm:col-span-1">
          <label className="text-xs text-white/70">Year</label>
          <input
            type="number"
            min={1970}
            max={3000}
            value={year}
            onChange={(e) => {
              setLoading(true);
              setError(null);
              setYear(Number(e.target.value));
            }}
            className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
        </div>

        {view === "daily" ? (
          <div className="sm:col-span-2">
            <label className="text-xs text-white/70">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setLoading(true);
                setError(null);
                setDate(e.target.value);
              }}
              className="mt-1 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
            />
          </div>
        ) : null}

        <div className="sm:col-span-2 grid grid-cols-3 gap-3">
          <div>
            <div className="text-xs text-white/70">Income</div>
            <div className="mt-1 text-lg font-semibold">
              $
              {(
                view === "monthly"
                  ? monthly?.totals.income
                  : view === "yearly"
                    ? yearly?.totals.income
                    : daily?.totals.income
              )?.toFixed(2) ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/70">Expense</div>
            <div className="mt-1 text-lg font-semibold">
              $
              {(
                view === "monthly"
                  ? monthly?.totals.expense
                  : view === "yearly"
                    ? yearly?.totals.expense
                    : daily?.totals.expense
              )?.toFixed(2) ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/70">Net</div>
            <div className="mt-1 text-lg font-semibold">
              $
              {(
                view === "monthly"
                  ? monthly?.totals.net
                  : view === "yearly"
                    ? yearly?.totals.net
                    : daily?.totals.net
              )?.toFixed(2) ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-medium">
            {view === "daily" ? "Today by hour" : "Spending by category"}
          </div>
          <div className="mt-3 h-64">
            {loading ? (
              <div className="h-full grid place-items-center text-sm text-white/70">Loading…</div>
            ) : view === "daily" ? (
              hourBars.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-white/70">
                  No data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourBars}>
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.85)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="expense" fill="white" />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : pieData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-white/70">
                No data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="text-sm font-medium">
            {view === "yearly" ? "Month-by-month" : "Day-by-day"}
          </div>
          <div className="mt-3 h-64">
            {loading ? (
              <div className="h-full grid place-items-center text-sm text-white/70">Loading…</div>
            ) : view === "yearly" ? (
              monthBars.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-white/70">
                  No data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthBars}>
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.85)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="expense" fill="white" />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : lineData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-white/70">
                No data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0,0,0,0.85)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="white"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

