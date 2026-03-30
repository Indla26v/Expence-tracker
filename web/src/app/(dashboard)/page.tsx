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

  const [todayTotals, monthTotals, budget, recent] = await Promise.all([
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
  ]);

  const todaySpend = todayTotals._sum.amount ?? 0;
  const monthSpend = monthTotals._sum.amount ?? 0;
  const budgetAmount = budget?.amount ?? 0;
  const budgetPct = budgetAmount > 0 ? monthSpend / budgetAmount : 0;

  const budgetColor =
    budgetAmount === 0
      ? "text-blue-300"
      : budgetPct >= 1
        ? "text-red-400"
        : budgetPct >= 0.8
          ? "text-yellow-300"
          : "text-emerald-400";

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

      <div className="card-grid grid gap-4 sm:grid-cols-3">
        <div className="group rounded-2xl border border-blue-600/30 bg-gradient-to-br from-blue-600/10 via-blue-700/5 to-transparent p-6 shadow-lg shadow-blue-600/10 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-600/30">
          <div className="text-sm font-medium text-blue-300">Today's spend</div>
          <div className="mt-3 text-3xl font-bold text-white group-hover:text-blue-100 transition-colors">₹{todaySpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent p-6 shadow-lg shadow-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-500/30">
          <div className="text-sm font-medium text-blue-300">This month</div>
          <div className="mt-3 text-3xl font-bold text-white group-hover:text-blue-100 transition-colors">₹{monthSpend.toFixed(2)}</div>
          <div className="mt-2 h-1 w-12 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="group rounded-2xl border border-blue-700/30 bg-gradient-to-br from-blue-700/10 via-blue-600/5 to-transparent p-6 shadow-lg shadow-blue-700/10 backdrop-blur-sm transition-all duration-300 hover:border-blue-600/60 hover:shadow-xl hover:shadow-blue-700/30">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-blue-300">Budget</div>
            <Link href="/settings" className="text-xs text-blue-300/70 hover:text-blue-200 underline transition-colors">
              Set
            </Link>
          </div>
          <div className={`mt-3 text-3xl font-bold ${budgetColor} group-hover:scale-105 transition-transform`}>
            ₹{budgetAmount.toFixed(2)}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
            <div
              className={`h-full rounded-full shadow-lg transition-all duration-500 ${budgetBarColor}`}
              style={{ width: `${Math.min(budgetPct, 1) * 100}%` }}
            />
          </div>
          <div className={`mt-2 text-xs font-medium ${budgetColor}`}>
            {budgetAmount > 0
              ? `${Math.round(budgetPct * 100)}% used`
              : "No budget set"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-lg backdrop-blur-sm overflow-hidden animate-[slideUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_backwards]">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600/10 to-blue-700/10 border-b border-white/10">
          <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">Recent transactions</h2>
          <Link href="/expenses" className="text-xs text-blue-300 hover:text-blue-400 underline transition-colors">
            View all
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-white/50">
              No transactions yet. Start by adding an expense!
            </div>
          ) : (
            recent.map((e, idx) => (
              <div 
                key={e.id} 
                className="flex items-center justify-between px-6 py-3 transition-all duration-300 hover:bg-white/5 group"
                style={{
                  animation: `slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + idx * 0.05}s backwards`
                }}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white group-hover:text-blue-200 transition-colors">
                    {e.category}
                    {e.note ? <span className="text-white/50 group-hover:text-white/70"> — {e.note}</span> : null}
                  </div>
                  <div className="text-xs text-white/40 group-hover:text-white/60 transition-colors">
                    {format(e.date, "MMM d, yyyy")} • {e.type}
                  </div>
                </div>
                <div className={`shrink-0 text-sm font-bold rounded-lg px-3 py-1 ${
                  e.type === "expense"
                    ? "text-red-300 bg-red-500/10"
                    : "text-emerald-300 bg-emerald-500/10"
                } transition-all group-hover:shadow-lg`}>
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

