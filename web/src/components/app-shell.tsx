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
    <div 
      className="min-h-dvh bg-slate-950 text-white relative overflow-x-hidden font-sans" 
      style={{ background: 'radial-gradient(ellipse at top left, #0d1222 0%, #030308 50%, #000000 100%)' }}
      suppressHydrationWarning
    >
      {/* Animated background shapes for deep mesh gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" suppressHydrationWarning>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] mix-blend-screen" suppressHydrationWarning />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen" suppressHydrationWarning />
        <div className="absolute bottom-0 left-1/3 w-[25rem] h-[25rem] bg-blue-800/10 rounded-full blur-[100px] mix-blend-screen" suppressHydrationWarning />
      </div>

      <header className="hidden md:flex sticky top-0 z-40 border-b border-white/[0.1] bg-[#0a0a0f]/70 backdrop-blur-[12px] shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between max-w-5xl px-6 py-4">
          
          <Link href="/" className="flex items-center gap-3 group relative z-50">
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

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="rounded-full border border-transparent px-5 py-2 text-sm font-semibold tracking-wide text-white/70 hover:bg-red-500/10 hover:text-rose-400 hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all duration-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-8">
        {children}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-[32px] border-t border-white/5 bg-[rgba(20,20,20,0.7)] backdrop-blur-[20px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "group relative flex flex-col items-center justify-center gap-1.5 w-16 h-14 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                  active ? "text-cyan-300" : "text-white/50 hover:text-white/90 hover:bg-white/5"
                )}
              >
                {/* Active Indicator Glow */}
                <div
                  className={clsx(
                    "absolute -top-2 w-8 h-1 rounded-b-full transition-all duration-500",
                    active ? "bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] opacity-100 scale-100" : "bg-transparent opacity-0 scale-0"
                  )}
                />
                
                <Icon className={clsx("transition-transform duration-500", active ? "h-6 w-6 scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" : "h-5 w-5 group-hover:scale-110")} />
                <span className={clsx("text-[10px] font-semibold tracking-wide transition-all duration-500", active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 absolute bottom-0 pointer-events-none")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

