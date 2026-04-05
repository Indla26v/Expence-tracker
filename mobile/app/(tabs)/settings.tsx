import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useAuth, useAuthedFetch } from "@/components/auth";

type Budget = { amount: number };

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function SettingsScreen() {
  const { logout } = useAuth();
  const authedFetch = useAuthedFetch();

  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialBalance, setInitialBalance] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const qs = useMemo(() => "" + "month=" + month + "&year=" + year, [month, year]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await authedFetch("/api/budget?" + qs);
      const json = (await res.json().catch(() => null)) as { budget: Budget | null } | null;
      if (!cancelled) {
        setAmount(json?.budget ? String(json.budget.amount) : "");
        setLoading(false);
      }
    })().catch((e) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : "Failed to load");
        setLoading(false);
      }
    });

    (async () => {
      setLoadingSettings(true);
      const res = await authedFetch("/api/user/settings");
      const json = await res.json().catch(() => null);
      if (!cancelled && json && json.initialBalance !== undefined) {
        setInitialBalance(String(json.initialBalance ?? ""));
        setLoadingSettings(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authedFetch, qs]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await authedFetch("/api/budget", {
        method: "POST",
        body: JSON.stringify({ month, year: Number(year), amount: Number(amount) }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to save");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveBalance() {
    setSavingBalance(true);
    setBalanceError(null);
    try {
      const res = await authedFetch("/api/user/settings", {
        method: "POST",
        body: JSON.stringify({ initialBalance: Number(initialBalance) }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to save settings");
      }
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSavingBalance(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-black px-5 pt-4">
      <Text className="text-2xl font-semibold text-slate-100">Settings</Text>
      <Text className="mt-1 text-slate-400">Budget and preferences</Text>

      <View className="mt-6 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm">
        <Text className="text-sm font-medium text-slate-100">Total Money Base Amount</Text>
        <Text className="text-xs text-slate-400 mt-1 mb-4">Set an initial balance offset.</Text>

        <TextInput
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="decimal-pad"
          className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100"
          placeholder="e.g. 1000"
          placeholderTextColor="#94a3b8"
        />

        {balanceError ? (
          <View className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <Text className="text-red-200 text-sm">{balanceError}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSaveBalance}
          disabled={savingBalance || loadingSettings}
          className="mt-4 rounded-xl bg-purple-600 px-4 py-3 items-center disabled:opacity-60"
        >
          <Text className="text-white font-medium">{savingBalance ? "Saving..." : "Save Base Amount"}</Text>
        </Pressable>
      </View>

      <View className="mt-6 rounded-2xl border border-purple-500/50 bg-slate-950 p-4 shadow-sm">
        <Text className="text-sm font-medium text-slate-100 mb-3">Monthly budget</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {MONTHS.map((m, i) => {
              const selected = month === i + 1;
              return (
                <Pressable 
                  key={i} 
                  onPress={() => setMonth(i + 1)}
                  className={"rounded-lg px-4 py-2 " + (selected ? "bg-purple-600" : "bg-slate-800")}
                >
                  <Text className={"font-medium " + (selected ? "text-white" : "text-slate-300")}>{m}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row gap-2 mt-2">
          <TextInput
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100"
            placeholder="Year"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100"
            placeholder="Amount"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>

        {loading ? <Text className="mt-3 text-slate-400">Loading...</Text> : null}
        {error ? (
          <View className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <Text className="text-red-200 text-sm">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSave}
          disabled={saving || !amount}
          className="mt-4 rounded-xl bg-purple-600 px-4 py-3 items-center disabled:opacity-60"
        >
          <Text className="text-white font-medium">{saving ? "Saving..." : "Save Budget"}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => void logout()}
        className="mt-6 mb-10 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 items-center"
      >
        <Text className="text-red-400 font-medium">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
