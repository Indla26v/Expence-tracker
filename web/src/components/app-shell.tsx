"use client";

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Home, Moon, Plus, Settings } from "lucide-react";
import clsx from "clsx";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-slate-950 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #050510 0%, #0a0a15 50%, #040608 100%)' }}>
      {/* Animated background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Floating circles */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 right-20 w-80 h-80 bg-cyan-300/5 rounded-full blur-3xl animate-[floatReverse_14s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-[pulse_15s_ease-in-out_infinite]" />
        
        {/* Morphing blobs */}
        <div className="absolute top-20 right-10 w-52 h-52 bg-cyan-400/4 rounded-full blur-2xl animate-[morph_11s_ease-in-out_infinite]" />
        <div className="absolute bottom-10 right-1/3 w-48 h-48 bg-cyan-500/4 rounded-full blur-2xl animate-[morph_13s_ease-in-out_infinite_3s]" />
      </div>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className={clsx("mx-auto flex w-full items-center justify-between px-4 py-3", pathname === "/analytics" ? "max-w-screen-2xl" : "max-w-5xl")}>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 shadow-lg transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="Expense Tracker Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-base font-bold text-white tracking-wide">Expense Tracker</div>
            </Link>
            <nav className="hidden items-center gap-2 sm:flex">
              {navItems.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "rounded-md px-2 py-1 text-sm transition-colors",
                    active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="rounded-md border border-white/10 px-2 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className={clsx("mx-auto w-full px-4 pb-24 pt-6 sm:pb-8 relative z-10", pathname === "/analytics" ? "max-w-screen-2xl" : "max-w-5xl")}>
        {children}
      </div>

      <Link
        href="/expenses"
        className="fixed bottom-20 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-gray-900 dark:bg-cyan-400 dark:text-gray-900 shadow-lg shadow-cyan-400/50 sm:bottom-6 sm:right-6 transition-transform hover:scale-105"
        aria-label="Quick add"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/70 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-white" : "text-white/60 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

