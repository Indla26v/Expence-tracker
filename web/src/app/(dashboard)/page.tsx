import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CATEGORY_COLORS, type Category } from "@/lib/categories";
import { toIST, startOfDayIST, startOfMonthIST, fromIST } from "@/lib/date";

export default async function DashboardPage() {
  const now = new Date();
  const nowIst = toIST(now);

  const todayStart = startOfDayIST(now);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  const monthStart = startOfMonthIST(now);
  const nextMonthStart = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth() + 1, 1) - 19800000);

  const month = nowIst.getUTCMonth() + 1;
  const year = nowIst.getUTCFullYear();

  let todayTotals: any = { _sum: { amount: null } };
  let monthTotals: any = { _sum: { amount: null } };
  let budget: any = null;
  let recent: any[] = [];
  let totalIncome: any = { _sum: { amount: null } };
  let totalExpense: any = { _sum: { amount: null } };
  let user: any = null;

  try {
    [todayTotals, monthTotals, budget, recent, totalIncome, totalExpense, user] = await Promise.all([
      prisma.expense.aggregate({
        where: { type: "expense", date: { gte: todayStart, lt: tomorrowStart } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { type: "expense", date: { gte: monthStart, lt: nextMonthStart } },
        _sum: { amount: true },
      }),
      prisma.budget.findUnique({
        where: { month_year: { month, year } },
      }),
      prisma.expense.findMany({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
      prisma.expense.aggregate({
        where: { type: "income" },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { type: "expense" },
        _sum: { amount: true },
      }),
      prisma.user.findFirst()
    ]);
  } catch (error) {
    // Database tables may not exist yet
    console.log('Database not initialized yet, using empty data');
  }

  const todaySpend = todayTotals._sum.amount ?? 0;
  const monthSpend = monthTotals._sum.amount ?? 0;
  const budgetAmount = budget?.amount ?? 0;
  const budgetPct = budgetAmount > 0 ? monthSpend / budgetAmount : 0;
  const budgetRemaining = Math.max(0, budgetAmount - monthSpend);
  const initialBalance = user?.initialBalance ?? 0;
  const totalBalance = initialBalance + (totalIncome._sum.amount ?? 0) - (totalExpense._sum.amount ?? 0);

  const budgetColor =
    budgetAmount === 0
      ? "text-cyan-600 dark:text-cyan-300"
      : budgetPct >= 1
        ? "text-red-500 dark:text-red-400"
        : budgetPct >= 0.8
          ? "text-yellow-600 dark:text-yellow-300"
          : "text-emerald-600 dark:text-emerald-400";

  const budgetBarColor =
    budgetAmount === 0
      ? "bg-gradient-to-r from-cyan-600 to-cyan-500"
      : budgetPct >= 1
        ? "bg-gradient-to-r from-red-500 to-red-400"
        : budgetPct >= 0.8
          ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
          : "bg-gradient-to-r from-emerald-500 to-emerald-400";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-cyan-400/60">{format(nowIst, "EEEE, MMM d")}</p>
        </div>
        <Link
          href="/expenses"
          className="rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg shadow-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/75 hover:scale-105 active:scale-95"
        >
          Quick add
        </Link>
      </div>

      <div className="card-grid grid gap-4 sm:grid-cols-4">
        <div className="group rounded-2xl border border-cyan-400/50 bg-slate-950 p-6 shadow-lg shadow-cyan-900/50 transition-all duration-300 hover:border-cyan-400/70 hover:shadow-xl hover:shadow-cyan-800/50">
          <div className="text-sm font-medium text-cyan-300">Total Money</div>
          <div className={`mt-3 text-3xl font-bold transition-colors ${totalBalance >= 0 ? "text-emerald-400 group-hover:text-emerald-300" : "text-red-400 group-hover:text-red-300"}`}>
            ₹{totalBalance.toFixed(2)}
          </div>
          <div className={`mt-2 h-1 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${totalBalance >= 0 ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-600"}`} />
        </div>

        <div className="group rounded-2xl border border-cyan-400/50 bg-slate-950 p-6 shadow-lg shadow-cyan-900/50 transition-all duration-300 hover:border-cyan-400/70 hover:shadow-xl hover:shadow-cyan-800/50">
          <div className="text-sm font-medium text-cyan-300">Today's spend</div>
          <div className="mt-3 text-3xl font-bold text-white group-hover:text-cyan-200 transition-colors">₹{todaySpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-cyan-400/50 bg-slate-950 p-6 shadow-lg shadow-cyan-900/50 transition-all duration-300 hover:border-cyan-400/70 hover:shadow-xl hover:shadow-cyan-800/50">
          <div className="text-sm font-medium text-cyan-300">This month</div>
          <div className="mt-3 text-3xl font-bold text-white group-hover:text-cyan-200 transition-colors">₹{monthSpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-emerald-500/50 bg-slate-950 p-6 shadow-lg shadow-emerald-900/50 transition-all duration-300 hover:border-emerald-400/70 hover:shadow-xl hover:shadow-emerald-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-emerald-300">Budget</div>
            <Link href="/settings" className="text-xs text-emerald-400/70 hover:text-emerald-300 underline transition-colors">
              Set
            </Link>
          </div>
          <div className={`mt-3 text-3xl font-bold ${budgetColor.replace('text-cyan-600', 'text-cyan-300').replace('text-red-500', 'text-red-300').replace('text-yellow-600', 'text-yellow-300').replace('text-emerald-600', 'text-emerald-300').replace('dark:', 'dark:text-')} group-hover:scale-105 transition-transform`}>
            ₹{budgetAmount > 0 ? budgetRemaining.toFixed(2) : "0.00"}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className={`h-full rounded-full shadow-sm dark:shadow-lg transition-all duration-500 ${budgetBarColor}`}
              style={{ width: `${Math.min(budgetPct, 1) * 100}%` }}
            />
          </div>
          <div className={`mt-2 text-xs font-medium ${budgetColor}`}>
            {budgetAmount > 0
              ? `₹${monthSpend.toFixed(2)} spent of ₹${budgetAmount.toFixed(2)}`
              : "No budget set"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950 shadow-lg overflow-hidden animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards]">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10">
          <h2 className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent">Recent transactions</h2>
          <Link href="/expenses" className="text-xs text-cyan-300 hover:text-cyan-400 underline transition-colors">
            View all
          </Link>
        </div>
        <div className="p-6 space-y-4">
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-white/50">
              No transactions yet. Start by adding an expense!
            </div>
          ) : (
            Object.entries(
              recent.reduce((acc, item) => {
                const dateKey = format(toIST(new Date(item.date)), "MMM d, yyyy");
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(item);
                return acc;
              }, {} as Record<string, typeof recent>)
            )
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([dateKey, dayItems]) => (
              <div key={dateKey} className="rounded-xl bg-blue-900/30 border border-blue-500/20 overflow-hidden shadow-sm">
                <div className="bg-blue-900/40 px-4 py-2 border-b border-blue-500/20">
                  <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider">{dateKey}</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {(dayItems as typeof recent).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white group-hover:text-cyan-200 transition-colors">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                background: CATEGORY_COLORS[e.category as Category] ?? "rgba(148,163,184,1)",
                              }}
                            />
                            {e.category}
                          </span>
                          {e.note ? <span className="text-white/60 group-hover:text-white/70 transition-colors"> — {e.note}</span> : null}
                        </div>
                        <div className="text-xs text-white/60 group-hover:text-white/80 mt-[0.3125rem] transition-colors flex items-center gap-1">
                          <div className="w-[1.125rem]" />
                          {format(toIST(new Date(e.date)), "HH:mm")} • {e.type}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-base font-semibold transition-colors ${
                          e.type === "expense" ? "text-rose-400 group-hover:text-rose-300" : "text-emerald-400 group-hover:text-emerald-300"
                        }`}>
                          {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

