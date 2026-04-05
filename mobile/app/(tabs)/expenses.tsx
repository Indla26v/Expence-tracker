import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { useAuthedFetch } from "@/components/auth";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";

type Expense = {
  id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string | null;
  date: string;
};

export default function ExpensesScreen() {
  const authedFetch = useAuthedFetch();
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [q, setQ] = useState("");
  const [rangePreset, setRangePreset] = useState<"month" | "week" | "year" | "custom">("month");
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10));

  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Expense["type"]>("expense");
  const [category, setCategory] = useState<Category>("Lunch");
  const [date, setDate] = useState(() => new Date());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<Expense["type"]>("expense");
  const [editCategory, setEditCategory] = useState<Category>("Lunch");
  const [editDate, setEditDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editNote, setEditNote] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const qs = useMemo(() => {
    const sp = new URLSearchParams();
    if (rangePreset === "month") {
      sp.set("month", String(month));
      sp.set("year", String(year));
    } else if (rangePreset === "year") {
      sp.set("from", `${year}-01-01`);
      sp.set("to", `${year + 1}-01-01`);
    } else {
      sp.set("from", from);
      sp.set("to", to);
    }
    if (q.trim()) sp.set("q", q.trim());
    sp.set("limit", "100");
    return sp.toString();
  }, [month, year, q, rangePreset, from, to]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/expenses?₹{qs}`);
      if (!res.ok) throw new Error("Failed to load expenses");
      const json = (await res.json()) as { items: Expense[] };
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  async function onAdd() {
    setSaving(true);
    setError(null);
    try {
      const res = await authedFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          type,
          category,
          date,
          note: note.trim() ? note.trim() : null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to add");
      }
      setAmount("");
      setNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setEditAmount(String(e.amount));
    setEditType(e.type);
    setEditCategory((CATEGORIES.includes(e.category as Category) ? (e.category as Category) : "Other") as Category);
    setEditDate(String(e.date).slice(0, 10));
    setEditNote(e.note ?? "");
  }

  async function onEditSave() {
    if (!editing) return;
    setEditSaving(true);
    setError(null);
    try {
      const res = await authedFetch(`/api/expenses/₹{editing.id}`, {
        method: "PUT",
        body: JSON.stringify({
          amount: Number(editAmount),
          type: editType,
          category: editCategory,
          date: editDate,
          note: editNote.trim() ? editNote.trim() : null,
        }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? "Failed to update");
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  }

  async function onDelete(id: string) {
    setError(null);
    const prev = items;
    setItems((x) => x.filter((e) => e.id !== id));
    const res = await authedFetch(`/api/expenses/₹{id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      setError("Failed to delete");
    }
  }

  return (
    <View className="flex-1 bg-black px-5 pt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-semibold text-slate-100">Expenses</Text>
        <Pressable onPress={() => void load()} className="rounded-xl border border-white/10 px-3 py-2">
          <Text className="text-xs text-slate-100/80">Refresh</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-blue-500/50 bg-slate-950 p-4 shadow-md p-4">
        <Text className="text-sm font-medium text-slate-100">Add transaction</Text>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => setType("expense")}
            className={`flex-1 rounded-xl border px-3 py-2 ${
              type === "expense" ? "border-white/20 bg-white/10" : "border-white/10"
            }`}
          >
            <Text className="text-center text-xs text-slate-100">Expense</Text>
          </Pressable>
          <Pressable
            onPress={() => setType("income")}
            className={`flex-1 rounded-xl border px-3 py-2 ${
              type === "income" ? "border-white/20 bg-white/10" : "border-white/10"
            }`}
          >
            <Text className="text-center text-xs text-slate-100">Income</Text>
          </Pressable>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={`rounded-full border px-3 py-2 ${
                category === c ? "border-white/20 bg-white/10" : "border-white/10"
              }`}
            >
              <View className="flex-row items-center gap-2">
                <View
                  style={{ backgroundColor: CATEGORY_COLORS[c], width: 8, height: 8, borderRadius: 999 }}
                />
                <Text className="text-xs text-slate-100">{c}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="mt-3 flex-row gap-2">
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
            placeholder="Amount"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
          <TextInput
            value={typeof date === "string" ? date : (date instanceof Date ? date.toISOString().split("T")[0] : String(date))}
            onChangeText={setDate as any}
            className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="rgba(255,255,255,0.4)"
          />
        </View>
        <TextInput
          value={note}
          onChangeText={setNote}
          className="mt-2 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
          placeholder="Note (optional)"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />

        <Pressable
          onPress={() => void onAdd()}
          disabled={saving || !amount}
          className="mt-3 rounded-xl bg-white px-4 py-3 items-center disabled:opacity-60"
        >
          <Text className="text-black font-medium">{saving ? "Saving…" : "Add"}</Text>
        </Pressable>
      </View>

      <View className="mt-4 rounded-2xl border border-blue-500/50 bg-slate-950 p-4 shadow-md p-4">
        <Text className="text-sm font-medium text-slate-100">Filters</Text>

        <View className="mt-3 flex-row gap-2">
          {(
            [
              ["month", "Month"],
              ["week", "Week"],
              ["year", "Year"],
              ["custom", "Custom"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setRangePreset(id)}
              className={`flex-1 rounded-xl border px-3 py-2 ${
                rangePreset === id ? "border-white/20 bg-white/10" : "border-white/10"
              }`}
            >
              <Text className="text-center text-xs text-slate-100">{label}</Text>
            </Pressable>
          ))}
        </View>

        {rangePreset === "month" ? (
          <View className="mt-3 flex-row gap-2">
            <TextInput
              value={String(month)}
              onChangeText={(t) => setMonth(Number(t || "0"))}
              keyboardType="number-pad"
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="Month"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <TextInput
              value={String(year)}
              onChangeText={(t) => setYear(Number(t || "0"))}
              keyboardType="number-pad"
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="Year"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>
        ) : null}

        {rangePreset === "year" ? (
          <View className="mt-3 flex-row gap-2">
            <TextInput
              value={String(year)}
              onChangeText={(t) => setYear(Number(t || "0"))}
              keyboardType="number-pad"
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="Year"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>
        ) : null}

        {rangePreset === "week" ? (
          <View className="mt-3 flex-row gap-2">
            <TextInput
              value={from}
              onChangeText={setFrom}
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="Week start (YYYY-MM-DD)"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <Pressable
              onPress={() => {
                // Keep it simple: week = [from, from+7)
                const d = new Date(from);
                if (!Number.isNaN(d.getTime())) {
                  const end = new Date(d.getTime() + 7 * 24 * 3600 * 1000);
                  setTo(end.toISOString().slice(0, 10));
                }
              }}
              className="rounded-xl border border-white/10 px-3 py-3"
            >
              <Text className="text-xs text-slate-100/80">+7d</Text>
            </Pressable>
          </View>
        ) : null}

        {rangePreset === "custom" ? (
          <View className="mt-3 flex-row gap-2">
            <TextInput
              value={from}
              onChangeText={setFrom}
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="From (YYYY-MM-DD)"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <TextInput
              value={to}
              onChangeText={setTo}
              className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="To (YYYY-MM-DD)"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
          </View>
        ) : null}

        <TextInput
          value={q}
          onChangeText={setQ}
          className="mt-3 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
          placeholder="Search note or category…"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />
      </View>

      {error ? (
        <View className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <Text className="text-red-200 text-sm">{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <Text className="mt-4 font-medium text-slate-300">Loading…</Text>
      ) : items.length === 0 ? (
        <Text className="mt-4 font-medium text-slate-300">No transactions.</Text>
      ) : (
        <FlatList
          className="mt-3"
          data={items}
          keyExtractor={(e) => e.id}
          ItemSeparatorComponent={() => <View className="h-px bg-white/10" />}
          renderItem={({ item }) => (
            <View className="py-3 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <View
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[(item.category as Category) ?? "Other"] ?? "#94a3b8",
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                    }}
                  />
                  <Text className="text-slate-100">{item.category}</Text>
                </View>
                {item.note ? <Text className="text-slate-100/60 text-xs">{item.note}</Text> : null}
              </View>
              <View className="items-end gap-2">
                <Text className="text-slate-100 font-medium">
                  {item.type === "expense" ? "-" : "+"}₹{item.amount.toFixed(2)}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => openEdit(item)} className="rounded-lg border border-white/10 px-2 py-1">
                    <Text className="text-xs text-slate-100/80">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => void onDelete(item.id)} className="rounded-lg border border-white/10 px-2 py-1">
                    <Text className="text-xs text-slate-100/80">Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {editing ? (
        <View className="absolute inset-0 bg-black/70 px-5 pt-24">
          <View className="rounded-2xl border border-white/10 bg-black p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-100 font-medium">Edit transaction</Text>
              <Pressable onPress={() => setEditing(null)} className="rounded-lg border border-white/10 px-2 py-1">
                <Text className="text-xs text-slate-100/80">Close</Text>
              </Pressable>
            </View>

            <View className="mt-4 flex-row gap-2">
              <Pressable
                onPress={() => setEditType("expense")}
                className={`flex-1 rounded-xl border px-3 py-2 ${
                  editType === "expense" ? "border-white/20 bg-white/10" : "border-white/10"
                }`}
              >
                <Text className="text-center text-xs text-slate-100">Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setEditType("income")}
                className={`flex-1 rounded-xl border px-3 py-2 ${
                  editType === "income" ? "border-white/20 bg-white/10" : "border-white/10"
                }`}
              >
                <Text className="text-center text-xs text-slate-100">Income</Text>
              </Pressable>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setEditCategory(c)}
                  className={`rounded-full border px-3 py-2 ${
                    editCategory === c ? "border-white/20 bg-white/10" : "border-white/10"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{ backgroundColor: CATEGORY_COLORS[c], width: 8, height: 8, borderRadius: 999 }}
                    />
                    <Text className="text-xs text-slate-100">{c}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <View className="mt-3 flex-row gap-2">
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
                placeholder="Amount"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TextInput
                value={editDate}
                onChangeText={setEditDate}
                className="flex-1 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
            </View>
            <TextInput
              value={editNote}
              onChangeText={setEditNote}
              className="mt-2 rounded-xl border border-blue-500/50 bg-slate-950 p-4 shadow-md px-4 py-3 text-slate-100"
              placeholder="Note (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Pressable
              onPress={() => void onEditSave()}
              disabled={editSaving}
              className="mt-3 rounded-xl bg-white px-4 py-3 items-center disabled:opacity-60"
            >
              <Text className="text-black font-medium">{editSaving ? "Saving…" : "Save changes"}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

