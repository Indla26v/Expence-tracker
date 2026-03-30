import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, TextInput } from "react-native";
import { useAuthedFetch } from "@/components/auth";
import { CATEGORY_COLORS, type Category } from "@/lib/categories";

type MonthlyResponse = {
  totals: { income: number; expense: number; net: number };
  byCategory: Array<{ category: string; total: number }>;
};

type YearlyResponse = {
  totals: { income: number; expense: number; net: number };
  byMonth: Array<{ month: string; income: number; expense: number }>;
  byCategory: Array<{ category: string; total: number }>;
};

type DailyResponse = {
  totals: { income: number; expense: number; net: number };
  byHour: Array<{ hour: number; income: number; expense: number }>;
};

export default function AnalyticsScreen() {
  const authedFetch = useAuthedFetch();
  const now = new Date();
  const [view, setView] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const qs = useMemo(() => {
    if (view === "monthly") return `month=${month}&year=${year}`;
    if (view === "yearly") return `year=${year}`;
    return `date=${encodeURIComponent(date)}`;
  }, [date, month, view, year]);

  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [yearly, setYearly] = useState<YearlyResponse | null>(null);
  const [daily, setDaily] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const path =
        view === "monthly"
          ? `/api/analytics/monthly?${qs}`
          : view === "yearly"
            ? `/api/analytics/yearly?${qs}`
            : `/api/analytics/daily?${qs}`;

      const res = await authedFetch(path);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = (await res.json()) as unknown;
      if (view === "monthly") setMonthly(json as MonthlyResponse);
      if (view === "yearly") setYearly(json as YearlyResponse);
      if (view === "daily") setDaily(json as DailyResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const totals =
    view === "monthly"
      ? monthly?.totals
      : view === "yearly"
        ? yearly?.totals
        : daily?.totals;

  const categoryRows =
    (view === "monthly" ? monthly?.byCategory : view === "yearly" ? yearly?.byCategory : []) ?? [];

  const maxCategory = Math.max(0, ...categoryRows.map((x) => x.total));
  const maxBar =
    view === "yearly"
      ? Math.max(0, ...(yearly?.byMonth ?? []).map((m) => m.expense))
      : Math.max(0, ...(daily?.byHour ?? []).map((h) => h.expense));

  return (
    <View className="flex-1 bg-black px-5 pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-semibold text-white">Analytics</Text>
        <Pressable onPress={() => void load()} className="rounded-xl border border-white/10 px-3 py-2">
          <Text className="text-xs text-white/80">Refresh</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-2">
        {(
          [
            ["daily", "Daily"],
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => {
              setView(id);
              setLoading(true);
              setError(null);
            }}
            className={`flex-1 rounded-xl border px-3 py-2 ${
              view === id ? "border-white/20 bg-white/10" : "border-white/10"
            }`}
          >
            <Text className="text-center text-xs text-white">{label}</Text>
          </Pressable>
        ))}
      </View>

      {view === "monthly" ? (
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={String(month)}
            onChangeText={(t) => setMonth(Number(t || "0"))}
            keyboardType="number-pad"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="Month"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TextInput
            value={String(year)}
            onChangeText={(t) => setYear(Number(t || "0"))}
            keyboardType="number-pad"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="Year"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
      ) : null}

      {view === "yearly" ? (
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={String(year)}
            onChangeText={(t) => setYear(Number(t || "0"))}
            keyboardType="number-pad"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="Year"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
      ) : null}

      {view === "daily" ? (
        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={date}
            onChangeText={setDate}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
      ) : null}

      {error ? (
        <View className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <Text className="text-red-200 text-sm">{error}</Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
          <Text className="text-xs text-white/70">Income</Text>
          <Text className="mt-2 text-lg font-semibold text-white">
            ${totals?.income.toFixed(2) ?? "—"}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
          <Text className="text-xs text-white/70">Expense</Text>
          <Text className="mt-2 text-lg font-semibold text-white">
            ${totals?.expense.toFixed(2) ?? "—"}
          </Text>
        </View>
      </View>

      <Text className="mt-6 text-sm font-medium text-white">
        {view === "daily" ? "By hour" : view === "yearly" ? "Month-by-month" : "By category"}
      </Text>

      {loading ? (
        <Text className="mt-3 text-white/70">Loading…</Text>
      ) : view === "yearly" ? (
        <View className="mt-3 gap-2">
          {(yearly?.byMonth ?? []).map((m) => {
            const w = maxBar > 0 ? (m.expense / maxBar) * 100 : 0;
            return (
              <View key={m.month} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xs">{new Date(m.month).toLocaleString(undefined, { month: "short" })}</Text>
                  <Text className="text-white/90 text-xs font-medium">${m.expense.toFixed(2)}</Text>
                </View>
                <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <View className="h-full rounded-full bg-white" style={{ width: `${w}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : view === "daily" ? (
        <View className="mt-3 gap-2">
          {(daily?.byHour ?? []).filter((h) => h.expense > 0).map((h) => {
            const w = maxBar > 0 ? (h.expense / maxBar) * 100 : 0;
            return (
              <View key={h.hour} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white text-xs">{`${h.hour}:00`}</Text>
                  <Text className="text-white/90 text-xs font-medium">${h.expense.toFixed(2)}</Text>
                </View>
                <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <View className="h-full rounded-full bg-white" style={{ width: `${w}%` }} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <>
          <Text className="mt-6 text-sm font-medium text-white">By category</Text>
          <View className="mt-3">
            <FlatList
              data={categoryRows.filter((x) => x.total > 0)}
              keyExtractor={(x) => x.category}
              ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
              renderItem={({ item }) => {
                const w = maxCategory > 0 ? (item.total / maxCategory) * 100 : 0;
                const color = CATEGORY_COLORS[item.category as Category] ?? "#94a3b8";
                return (
                  <View className="py-3">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color }} />
                        <Text className="text-white">{item.category}</Text>
                      </View>
                      <Text className="text-white/90 font-medium">${item.total.toFixed(2)}</Text>
                    </View>
                    <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <View className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text className="mt-3 text-white/70">No data.</Text>}
            />
          </View>
        </>
      )}

    </View>
  );
}

