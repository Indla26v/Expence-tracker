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
    if (view === "monthly") return `month=${month}&year=${year}`;
    if (view === "yearly") return `year=${year}`;
    return `date=${encodeURIComponent(date)}`;
  }, [month, year, view, date]);

  useEffect(() => {
    let cancelled = false;
    const url =
      view === "monthly"
        ? `/api/analytics/monthly?${qs}`
        : view === "yearly"
          ? `/api/analytics/yearly?${qs}`
          : `/api/analytics/daily?${qs}`;

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
      <div className="flex flex-col gap-2">
        <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">Analytics</h1>
        <p className="text-sm text-blue-300/70">Daily, monthly, and yearly reports</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 via-blue-700/5 to-transparent p-6 sm:grid-cols-4 animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.1s_backwards]">
        <div className="sm:col-span-4 flex flex-wrap items-center gap-2 mb-2">
          {(
            [
              ["daily", "Daily"],
              ["monthly", "Monthly"],
              ["yearly", "Year"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setLoading(true);
                setError(null);
                setView(id);
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                view === id
                  ? "border-blue-400/60 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30"
                  : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === "monthly" ? (
          <div className="sm:col-span-1">
          <label className="text-xs font-medium text-blue-300">Month</label>
          <select
            value={month}
            onChange={(e) => {
              setLoading(true);
              setError(null);
              setMonth(Number(e.target.value));
            }}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
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
          <label className="text-xs font-medium text-blue-300">Year</label>
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
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
          />
        </div>

        {view === "daily" ? (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-blue-300">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setLoading(true);
                setError(null);
                setDate(e.target.value);
              }}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
            />
          </div>
        ) : null}

        <div className="sm:col-span-4 mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 transition-all duration-300 hover:shadow-md hover:border-emerald-400">
            <div className="text-sm font-medium text-emerald-400">Income</div>
            <div className="mt-1 text-2xl font-bold text-emerald-300">
              ₹ 
              {(
                view === "monthly"
                  ? monthly?.totals.income
                  : view === "yearly"
                    ? yearly?.totals.income
                    : daily?.totals.income
              )?.toFixed(2) ?? "---"}
            </div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 transition-all duration-300 hover:shadow-md hover:border-red-400">
            <div className="text-sm font-medium text-red-400">Expense</div>
            <div className="mt-1 text-2xl font-bold text-red-300">
              ₹ 
              {(
                view === "monthly"
                  ? monthly?.totals.expense
                  : view === "yearly"
                    ? yearly?.totals.expense
                    : daily?.totals.expense
              )?.toFixed(2) ?? "---"}
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 transition-all duration-300 hover:shadow-md hover:border-blue-400">
            <div className="text-sm font-medium text-blue-400">Net</div>
            <div className="mt-1 text-2xl font-bold text-blue-300">
              ₹ 
              {(
                view === "monthly"
                  ? monthly?.totals.net
                  : view === "yearly"
                    ? yearly?.totals.net
                    : daily?.totals.net
              )?.toFixed(2) ?? "---"}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 animate-in fade-in zoom-in duration-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards]">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-all duration-300 hover:shadow-md">
          <div className="text-sm font-semibold text-white">
            {view === "daily" ? "Today by hour" : "Spending by category"}
          </div>
          <div className="mt-6 h-[300px]">
            {loading ? (
              <div className="h-full grid place-items-center text-sm text-white/70">Loading...</div>
            ) : view === "daily" ? (
              hourBars.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-white/70">
                  No data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hour" stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "none",
                        borderRadius: "12px",
                        color: "white",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="expense" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} className="stroke-slate-900 stroke-2" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition-all duration-300 hover:shadow-md">
          <div className="text-sm font-semibold text-white">
            {view === "yearly" ? "Month-by-month" : "Day-by-day"}
          </div>
          <div className="mt-6 h-[300px]">
            {loading ? (
              <div className="h-full grid place-items-center text-sm text-white/70">Loading...</div>
            ) : view === "yearly" ? (
              monthBars.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-white/70">
                  No data.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "none",
                        borderRadius: "12px",
                        color: "white",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="expense" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : lineData.length === 0 ? (
              <div className="h-full grid place-items-center text-sm text-white/70">
                No data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-slate-500" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "12px",
                      color: "white",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#ef4444", strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }}
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
