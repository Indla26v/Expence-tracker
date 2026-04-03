import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

function utcStartOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export default async function DashboardPage() {
  const now = new Date();

  const todayStart = utcStartOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

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
      ? "text-blue-600 dark:text-blue-300"
      : budgetPct >= 1
        ? "text-red-500 dark:text-red-400"
        : budgetPct >= 0.8
          ? "text-yellow-600 dark:text-yellow-300"
          : "text-emerald-600 dark:text-emerald-400";

  const budgetBarColor =
    budgetAmount === 0
      ? "bg-gradient-to-r from-blue-600 to-blue-500"
      : budgetPct >= 1
        ? "bg-gradient-to-r from-red-500 to-red-400"
        : budgetPct >= 0.8
          ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
          : "bg-gradient-to-r from-emerald-500 to-emerald-400";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 animate-[slideDown_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div>
          <h1 className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 bg-clip-text text-3xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-blue-400/70">{format(now, "EEEE, MMM d")}</p>
        </div>
        <Link
          href="/expenses"
          className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-700/75 hover:scale-105 active:scale-95"
        >
          Quick add
        </Link>
      </div>

      <div className="card-grid grid gap-4 sm:grid-cols-4">
        <div className="group rounded-2xl border border-blue-200 bg-white dark:border-blue-600/30 dark:bg-gradient-to-br dark:from-blue-600/10 dark:via-blue-700/5 dark:to-transparent p-6 shadow-sm dark:shadow-lg dark:shadow-blue-600/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500/60 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-600/30">
          <div className="text-sm font-medium text-slate-500 dark:text-blue-300">Total Money</div>
          <div className={`mt-3 text-3xl font-bold transition-colors ${totalBalance >= 0 ? "text-emerald-500 group-hover:text-emerald-600 dark:text-emerald-400 dark:group-hover:text-emerald-300" : "text-red-500 group-hover:text-red-600 dark:text-red-400 dark:group-hover:text-red-300"}`}>
            ₹{totalBalance.toFixed(2)}
          </div>
          <div className={`mt-2 h-1 w-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${totalBalance >= 0 ? "bg-gradient-to-r from-emerald-400 to-emerald-500 dark:from-emerald-400 dark:to-emerald-600" : "bg-gradient-to-r from-red-400 to-red-500 dark:from-red-400 dark:to-red-600"}`} />
        </div>

        <div className="group rounded-2xl border border-blue-200 bg-white dark:border-blue-600/30 dark:bg-gradient-to-br dark:from-blue-600/10 dark:via-blue-700/5 dark:to-transparent p-6 shadow-sm dark:shadow-lg dark:shadow-blue-600/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500/60 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-600/30">
          <div className="text-sm font-medium text-slate-500 dark:text-blue-300">Today's spend</div>
          <div className="mt-3 text-3xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-100 transition-colors">₹{todaySpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-blue-200 bg-white dark:border-blue-500/30 dark:bg-gradient-to-br dark:from-blue-500/10 dark:via-blue-600/5 dark:to-transparent p-6 shadow-sm dark:shadow-lg dark:shadow-blue-500/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-400/60 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-500/30">
          <div className="text-sm font-medium text-slate-500 dark:text-blue-300">This month</div>
          <div className="mt-3 text-3xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-100 transition-colors">₹{monthSpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-blue-200 bg-white dark:border-blue-700/30 dark:bg-gradient-to-br dark:from-blue-700/10 dark:via-blue-600/5 dark:to-transparent p-6 shadow-sm dark:shadow-lg dark:shadow-blue-700/10 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600/60 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-blue-700/30">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500 dark:text-blue-300">Budget</div>
            <Link href="/settings" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300/70 dark:hover:text-blue-200 underline transition-colors">
              Set
            </Link>
          </div>
          <div className={`mt-3 text-3xl font-bold ${budgetColor} group-hover:scale-105 transition-transform`}>
            ₹{budgetAmount > 0 ? budgetRemaining.toFixed(2) : "0.00"}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 border-slate-200 dark:bg-white/5 border dark:border-white/10">
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

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent shadow-sm dark:shadow-lg overflow-hidden animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gradient-to-r dark:from-blue-600/10 dark:to-blue-700/10 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-sm font-semibold text-blue-800 dark:bg-gradient-to-r dark:from-blue-300 dark:to-blue-400 dark:bg-clip-text dark:text-transparent">Recent transactions</h2>
          <Link href="/expenses" className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-400 underline transition-colors">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-white/50">
              No transactions yet. Start by adding an expense!
            </div>
          ) : (
            recent.map((e, idx) => (
              <div 
                key={e.id} 
                className="flex items-center justify-between px-6 py-3 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-white/5 group"
                style={{
                  animation: `slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + idx * 0.05}s backwards`
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
                    {e.category}
                    {e.note ? <span className="text-slate-500 dark:text-white/50 group-hover:text-slate-600 dark:group-hover:text-white/70"> — {e.note}</span> : null}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-white/40 group-hover:text-slate-500 dark:group-hover:text-white/60 transition-colors">
                    {format(e.date, "MMM d, yyyy")} • {e.type}
                  </div>
                </div>
                <div className={`shrink-0 text-sm font-bold rounded-lg px-3 py-1 ${
                  e.type === "expense"
                    ? "text-red-500 bg-red-50 dark:text-red-300 dark:bg-red-500/10"
                    : "text-emerald-500 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10"
                } transition-all group-hover:shadow-sm dark:group-hover:shadow-lg`}>
                  {e.type === "expense" ? "-" : "+"}₹{e.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

