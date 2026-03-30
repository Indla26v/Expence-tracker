import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useAuth, useAuthedFetch } from "@/components/auth";

type Budget = { amount: number };

export default function SettingsScreen() {
  const { logout } = useAuth();
  const authedFetch = useAuthedFetch();

  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => `month=${month}&year=${year}`, [month, year]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await authedFetch(`/api/budget?${qs}`);
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
        body: JSON.stringify({ month, year, amount: Number(amount) }),
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

  return (
    <View className="flex-1 bg-black px-5 pt-4">
      <Text className="text-2xl font-semibold text-white">Settings</Text>
      <Text className="mt-1 text-white/70">Budget and account</Text>

      <View className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Text className="text-sm font-medium text-white">Monthly budget</Text>

        <View className="mt-4 flex-row gap-2">
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

        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          placeholder="Amount"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />

        {loading ? <Text className="mt-3 text-white/70">Loading…</Text> : null}
        {error ? (
          <View className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <Text className="text-red-200 text-sm">{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={onSave}
          disabled={saving || !amount}
          className="mt-4 rounded-xl bg-white px-4 py-3 items-center disabled:opacity-60"
        >
          <Text className="text-black font-medium">{saving ? "Saving…" : "Save"}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => void logout()}
        className="mt-6 rounded-xl border border-white/10 px-4 py-3 items-center"
      >
        <Text className="text-white/90 font-medium">Sign out</Text>
      </Pressable>
    </View>
  );
}

