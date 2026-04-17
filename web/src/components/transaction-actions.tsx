"use client";

import React, { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { formatIST, parseIST } from "@/lib/date";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type TransactionType = "income" | "expense" | null;

export function TransactionActions({ onAddSuccess }: { onAddSuccess?: () => void }) {
  const router = useRouter();
  const [modalType, setModalType] = useState<TransactionType>(null);
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Lunch");
  const [date, setDate] = useState(() => formatIST(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = (type: TransactionType) => {
    setModalType(type);
    setError(null);
    setAmount("");
    setNote("");
    setDate(formatIST(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setCategory(type === "income" ? "Salary" : "Lunch");
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError("Please enter a valid amount");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          type: modalType,
          category,
          date: parseIST(date).toISOString(),
          note: note.trim() ? note.trim() : null,
        }),
      });
      
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to add transaction");
      }
      
      setModalType(null);
      if (onAddSuccess) {
        onAddSuccess();
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={() => handleOpen("expense")}
          className="group relative flex items-center justify-center overflow-hidden rounded-[24px] p-[1px] shadow-[0_8px_16px_-4px_rgba(244,63,94,0.3)] transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/60 via-rose-500/10 to-transparent" />
          <div className="relative flex h-full w-full items-center gap-2 rounded-[23px] bg-black/20 px-6 py-3 text-rose-300 backdrop-blur-[20px] transition-colors group-hover:bg-black/10">
            <div className="absolute inset-0 opacity-20 mix-blend-screen transition-opacity group-hover:opacity-40">
              <div className="absolute -left-4 -top-4 h-12 w-12 rounded-full bg-rose-400 blur-xl" />
              <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-orange-400 blur-xl" />
            </div>
            <span className="relative z-10 font-semibold tracking-wide drop-shadow-sm">
              Expense
            </span>
          </div>
        </button>

        <button
          onClick={() => handleOpen("income")}
          className="group relative flex items-center justify-center overflow-hidden rounded-[24px] p-[1px] shadow-[0_8px_16px_-4px_rgba(16,185,129,0.3)] transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/60 via-emerald-500/10 to-transparent" />
          <div className="relative flex h-full w-full items-center gap-2 rounded-[23px] bg-black/20 px-6 py-3 text-emerald-300 backdrop-blur-[20px] transition-colors group-hover:bg-black/10">
            <div className="absolute inset-0 opacity-20 mix-blend-screen transition-opacity group-hover:opacity-40">
              <div className="absolute -left-4 -top-4 h-12 w-12 rounded-full bg-emerald-400 blur-xl" />
              <div className="absolute -bottom-4 -right-4 h-12 w-12 rounded-full bg-teal-300 blur-xl" />
            </div>
            <span className="relative z-10 font-semibold tracking-wide drop-shadow-sm">
              Income
            </span>
          </div>
        </button>
      </div>

      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm transition-all animate-in fade-in duration-300"
          onClick={() => setModalType(null)}
        >
          <div
            className="relative w-full max-w-md scale-100 transform overflow-hidden rounded-[32px] liquid-glass animate-in zoom-in-95 duration-300 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] saturate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex flex-col gap-6 rounded-[31px] p-8 pb-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
              
              <div className="pointer-events-none absolute -inset-1/2 opacity-30 mix-blend-screen">
                <div
                  className={`absolute left-1/4 top-1/4 h-48 w-48 rounded-full blur-[60px] ${
                    modalType === "income" ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <div
                  className={`absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-[60px] ${
                    modalType === "income" ? "bg-teal-400" : "bg-pink-500"
                  }`}
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-white/90">
                    Add {modalType === "income" ? "Income" : "Expense"}
                  </h2>
                  <button 
                    onClick={() => setModalType(null)}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200 border border-red-500/30">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-white/30 drop-shadow-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      autoFocus
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-[24px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent py-6 pl-14 pr-6 text-4xl font-light tracking-tight text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50"
                    />
                  </div>

                  <div className="relative">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          className="group flex w-full appearance-none items-center justify-between rounded-[20px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-6 py-4 text-white placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50"
                        >
                          <span className="font-medium tracking-tight text-white/90 flex items-center gap-3">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              style={{
                                background: CATEGORY_COLORS[category as Category] ?? "#94a3b8",
                                boxShadow: `0 0 10px ${CATEGORY_COLORS[category as Category] ?? "#94a3b8"}40`
                              }}
                            />
                            {category || "Select Category"}
                          </span>
                          <ChevronDown className="h-5 w-5 text-white/40 transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenu.Trigger>

                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          asChild
                          sideOffset={8}
                          className="z-[60] min-w-[240px] rounded-[24px] p-2"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                            className="bg-slate-900/60 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-[24px] border border-white/10 rounded-[24px] shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] outline-none saturate-200"
                          >
                            <div className="max-h-[300px] overflow-y-auto px-1 py-2 custom-scrollbar">
                              {(modalType === "income" 
                                ? (["Salary", "Budget Allowance", "Others"] as Category[]) 
                                : CATEGORIES.filter(c => !["Salary", "Budget Allowance", "Others"].includes(c))
                              ).map((c) => {
                                const isSelected = category === c;
                                return (
                                  <DropdownMenu.Item
                                    key={c}
                                    onSelect={() => setCategory(c)}
                                    className={`relative flex cursor-pointer select-none items-center rounded-[16px] px-4 py-3 text-sm font-medium tracking-tight outline-none transition-all duration-200 focus:bg-white/10 data-[highlighted]:bg-white/10 ${
                                      isSelected
                                        ? "text-white/100"
                                        : "text-white/70 hover:text-white"
                                    }`}
                                  >
                                    <div className="relative z-10 flex items-center gap-3 w-full">
                                      <div
                                        className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                        style={{
                                          background: CATEGORY_COLORS[c as Category] ?? "#94a3b8",
                                          boxShadow: `0 0 10px ${CATEGORY_COLORS[c as Category] ?? "#94a3b8"}40`
                                        }}
                                      />
                                      <span>{c}</span>
                                    </div>
                                    {isSelected && (
                                      <motion.div
                                        layoutId="activeCategory"
                                        className={`absolute inset-0 z-0 rounded-[16px] opacity-20 ${
                                          modalType === "income"
                                            ? "bg-emerald-500"
                                            : "bg-rose-500"
                                        }`}
                                      />
                                    )}
                                  </DropdownMenu.Item>
                                );
                              })}
                            </div>
                          </motion.div>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>

                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-[20px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-6 py-4 text-white tracking-tight placeholder-white/30 backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50"
                  />

                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-[20px] bg-slate-900/40 bg-gradient-to-b from-blue-500/5 to-transparent px-6 py-4 text-white tracking-tight backdrop-blur-[16px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(0,0,0,0.5)] outline-none border border-white/10 transition-all hover:border-blue-400/40 focus:border-blue-400/60 focus:shadow-[0_0_24px_rgba(59,130,246,0.3)] focus:bg-slate-800/50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert hover:[&::-webkit-calendar-picker-indicator]:opacity-80"
                  />

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="group relative mt-2 overflow-hidden rounded-[24px] p-[1px] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
                    <div className="relative rounded-[23px] bg-white/10 py-4 text-center font-semibold tracking-wide text-white backdrop-blur-[24px] transition-colors group-hover:bg-white/15">
                      {saving ? "Saving..." : `Save ${modalType === "income" ? "Income" : "Expense"}`}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
