import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { CATEGORY_COLORS, type Category } from "@/lib/categories";
import { toIST, startOfDayIST, startOfMonthIST, fromIST } from "@/lib/date";
import { TransactionActions } from "@/components/transaction-actions";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-cyan-400/60">{format(nowIst, "EEEE, MMM d")}</p>
        </div>
        <TransactionActions />
      </div>

      <div className="card-grid grid gap-4 sm:grid-cols-4">
        <div className="group liquid-glass ambient-shadow p-6 transition-all duration-500 hover:-translate-y-[2px] hover:bg-white/5 hover:saturate-200">
          <div className="text-sm font-medium tracking-tight text-white/50">Total Money</div>
          <div className={`mt-3 text-3xl tracking-tight font-bold transition-colors ${totalBalance >= 0 ? "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"}`}>
            ₹{totalBalance.toFixed(2)}
          </div>
          <div className={`mt-2 h-1 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${totalBalance >= 0 ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-gradient-to-r from-rose-400 to-rose-600 shadow-[0_0_8px_rgba(251,113,133,0.6)]"}`} />
        </div>

        <div className="group liquid-glass ambient-shadow p-6 transition-all duration-500 hover:-translate-y-[2px] hover:bg-white/5 hover:saturate-200">
          <div className="text-sm font-medium tracking-tight text-white/50">Today's spend</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors drop-shadow-sm">₹{todaySpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
        </div>

        <div className="group liquid-glass ambient-shadow p-6 transition-all duration-500 hover:-translate-y-[2px] hover:bg-white/5 hover:saturate-200">
          <div className="text-sm font-medium tracking-tight text-white/50">This month</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors drop-shadow-sm">₹{monthSpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
        </div>

        <div className="group liquid-glass ambient-shadow p-6 transition-all duration-500 hover:-translate-y-[2px] hover:bg-white/5 hover:saturate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 mix-blend-screen pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="text-sm font-medium tracking-tight text-white/50">Budget</div>
            <Link href="/settings" className="text-xs tracking-tight text-emerald-400/70 hover:text-emerald-300 transition-colors">
              Set Budget
            </Link>
          </div>
          <div className={`mt-3 text-3xl tracking-tight font-bold relative z-10 transition-colors ${budgetColor.replace('text-cyan-600', 'text-white').replace('text-red-500', 'text-rose-300').replace('text-yellow-600', 'text-amber-300').replace('text-emerald-600', 'text-emerald-300').replace('dark:', 'dark:text-')} group-hover:scale-[1.02] transition-transform`}>
            ₹{budgetAmount > 0 ? budgetRemaining.toFixed(2) : "0.00"}
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/40 ring-1 ring-white/10 relative z-10">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${budgetBarColor.replace('from-cyan-600 to-cyan-500', 'from-blue-500 to-indigo-500').replace('from-emerald-500 to-emerald-400', 'from-emerald-400 to-teal-400').replace('from-yellow-500 to-yellow-400', 'from-amber-400 to-orange-400').replace('from-red-500 to-red-400', 'from-rose-400 to-red-500')} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
              style={{ width: `${Math.min(budgetPct, 1) * 100}%` }}
            />
          </div>
          <div className={`mt-3 text-xs tracking-tight font-medium relative z-10 ${budgetColor.replace('text-cyan-600', 'text-white/50').replace('dark:', '')}`}>
            {budgetAmount > 0
              ? `₹${monthSpend.toFixed(2)} spent of ₹${budgetAmount.toFixed(2)}`
              : "No budget set"}
          </div>
        </div>
      </div>

      <div className="liquid-glass ambient-shadow overflow-hidden animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards] transition-all duration-500 hover:shadow-2xl hover:shadow-white/5 hover:-translate-y-[1px] hover:saturate-200">
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.01] border-b border-white/5 rounded-t-[32px]">
          <h2 className="text-sm font-semibold tracking-tight text-white/90">Recent transactions</h2>
          <Link href="/expenses" className="text-xs font-medium tracking-tight text-white/50 hover:text-white transition-colors">
            View all
          </Link>
        </div>
        <div className="p-6 space-y-4">
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm font-medium tracking-tight text-white/50">
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
              <div key={dateKey} className="liquid-glass overflow-hidden bg-black/10 saturate-150 p-[1px] rounded-[24px]">
                <div className="bg-white/5 rounded-[23px]">
                  <div className="px-4 py-3 border-b border-white/5">
                    <h3 className="text-xs font-semibold text-white/50 tracking-wide">{dateKey}</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                    {(dayItems as typeof recent).map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium tracking-tight text-white/90 group-hover:text-white transition-colors">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                                style={{
                                  background: CATEGORY_COLORS[e.category as Category] ?? "rgba(148,163,184,1)",
                                }}
                              />
                              {e.category}
                            </span>
                            {e.note ? <span className="text-white/40 group-hover:text-white/60 transition-colors"> — {e.note}</span> : null}
                          </div>
                          <div className="text-xs tracking-tight text-white/40 group-hover:text-white/60 mt-1 transition-colors flex items-center gap-1">
                            <div className="w-[1.125rem]" />
                            {format(toIST(new Date(e.date)), "HH:mm")} • {e.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={`text-base tracking-tight font-semibold transition-colors ${
                          e.type === "expense" ? "text-rose-400 group-hover:text-rose-300" : "text-emerald-400 group-hover:text-emerald-300"
                        }`}>
                          {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

