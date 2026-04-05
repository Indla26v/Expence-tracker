import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useAuthedFetch } from "@/components/auth";
import { useRouter } from "expo-router";

type Expense = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string | null;
  date: string;
};

export default function DashboardScreen() {
  const authedFetch = useAuthedFetch();
  const router = useRouter();

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("month", String(month));
    sp.set("year", String(year));
    sp.set("limit", "10");
    return sp.toString();
  }, [month, year]);

  const [items, setItems] = useState<Expense[]>([]);
  const [todaySpend, setTodaySpend] = useState(0);
  const [monthSpend, setMonthSpend] = useState(0);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const todayIso = new Date().toISOString().slice(0, 10);
    const [expensesRes, budgetRes, dailyRes] = await Promise.all([
      authedFetch(`/api/expenses?₹{qs}`),
      authedFetch(`/api/budget?month=₹{month}&year=₹{year}`),
      authedFetch(`/api/analytics/daily?date=₹{todayIso}`),
    ]);

    const expensesJson = (await expensesRes.json().catch(() => null)) as { items?: Expense[] } | null;
    const budgetJson = (await budgetRes.json().catch(() => null)) as { budget?: { amount: number } | null } | null;
    const dailyJson = (await dailyRes.json().catch(() => null)) as { totals?: { expense: number } } | null;

    setItems(expensesJson?.items ?? []);
    setBudget(budgetJson?.budget?.amount ?? 0);
    setTodaySpend(dailyJson?.totals?.expense ?? 0);

    const monthTotal = (expensesJson?.items ?? [])
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + e.amount, 0);
    setMonthSpend(monthTotal);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  const budgetPct = budget > 0 ? monthSpend / budget : 0;
  const budgetColor =
    budget <= 0 ? "font-medium text-slate-300" : budgetPct >= 1 ? "text-red-300" : budgetPct >= 0.8 ? "text-yellow-200" : "text-emerald-200";
  const budgetBarColor =
    budget <= 0 ? "bg-white/30" : budgetPct >= 1 ? "bg-red-400" : budgetPct >= 0.8 ? "bg-yellow-300" : "bg-emerald-300";

  return (
    <View className="flex-1 bg-black px-5 pt-4">
      <Text className="text-2xl font-semibold text-slate-100">Dashboard</Text>
      <Text className="mt-1 font-medium text-slate-300">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
      </Text>

      <View className="mt-5 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm p-4">
          <Text className="text-xs font-medium text-slate-300">Today</Text>
          <Text className="mt-2 text-xl font-semibold text-slate-100">₹{todaySpend.toFixed(2)}</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm p-4">
          <Text className="text-xs font-medium text-slate-300">This month</Text>
          <Text className="mt-2 text-xl font-semibold text-slate-100">₹{monthSpend.toFixed(2)}</Text>
        </View>
      </View>

      <View className="mt-3 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-slate-300">Budget</Text>
          <Text className={`text-xs ${budgetColor}`}>
            {budget > 0 ? `${Math.round(budgetPct * 100)}% used` : "Not set"}
          </Text>
        </View>
        <Text className={`mt-2 text-xl font-semibold ${budgetColor}`}>₹{budget.toFixed(2)}</Text>
        <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <View className={`h-full rounded-full ${budgetBarColor}`} style={{ width: `${Math.min(budgetPct, 1) * 100}%` }} />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-100">Recent</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push("/(tabs)/expenses")}
            className="rounded-xl bg-white px-3 py-2"
          >
            <Text className="text-xs text-black font-medium">Quick add</Text>
          </Pressable>
          <Pressable onPress={() => void load()} className="rounded-xl border border-white/10 px-3 py-2">
            <Text className="text-xs text-slate-100/80">Refresh</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text className="mt-3 text-red-200">{error}</Text> : null}

      {loading ? (
        <Text className="mt-4 font-medium text-slate-300">Loading…</Text>
      ) : (
        <FlatList
          className="mt-3"
          data={items}
          keyExtractor={(e) => e.id}
          ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
          renderItem={({ item }) => (
            <View className="py-3 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-slate-100">{item.category}</Text>
                {item.note ? <Text className="text-slate-100/60 text-xs">{item.note}</Text> : null}
              </View>
              <Text className="text-slate-100 font-medium">
                {item.type === "expense" ? "-" : "+"}₹{item.amount.toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
