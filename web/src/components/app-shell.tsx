"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Home, Moon, Plus, Settings, Wallet, Menu, X } from "lucide-react";
import clsx from "clsx";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const resetTimer = () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => {
        void signOut({ callbackUrl: "/login" });
      }, INACTIVITY_TIMEOUT);
    };

    resetTimer();

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetTimer));

    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, []);

  return (
    <div className="min-h-dvh bg-slate-950 text-white relative overflow-x-hidden font-sans" style={{ background: 'radial-gradient(ellipse at top left, #0d1222 0%, #030308 50%, #000000 100%)' }}>
      {/* Animated background shapes for deep mesh gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-1/3 w-[25rem] h-[25rem] bg-blue-800/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.1] bg-[#0a0a0f]/70 backdrop-blur-[12px] shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between max-w-5xl px-6 py-4">
          
          <Link href="/" className="flex items-center gap-3 group relative z-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-cyan-400 to-emerald-500 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <div className="w-full h-full bg-black/40 backdrop-blur-sm rounded-[13px] flex items-center justify-center">
                <Wallet className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]" />
              </div>
            </div>
            <div className="text-lg font-bold tracking-tight text-white drop-shadow-sm">Expense Tracker</div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "relative px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-300 rounded-full",
                    active
                      ? "bg-white/10 text-cyan-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      : "text-white/60 hover:text-cyan-400 hover:bg-white/5 hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="rounded-full border border-transparent px-5 py-2 text-sm font-semibold tracking-wide text-white/70 hover:bg-red-500/10 hover:text-rose-400 hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all duration-300"
            >
              Sign out
            </button>
          </div>

          <button
            type="button"
            className="md:hidden relative z-50 rounded-full p-2 text-white/70 hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-[72px] left-0 right-0 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl p-6 md:hidden animate-[slideDown_0.3s_ease-out]">
            <nav className="flex flex-col gap-2">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold tracking-wide transition-all",
                      active
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "text-white/70 hover:bg-white/5 hover:text-cyan-400"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                );
              })}
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => void signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] transition-all"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-8">
        {children}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/expenses"
        className="fixed bottom-6 right-6 z-50 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95"
        aria-label="Quick add"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

