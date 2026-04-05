import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const querySchema = z.object({
  date: z.string().min(1),
});

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcWeekMonday(d: Date) {
  const day = startOfUtcDay(d);
  // JS: 0=Sun..6=Sat, we want Monday-based week
  const jsDow = day.getUTCDay();
  const diff = (jsDow + 6) % 7; // Mon=0, Sun=6
  day.setUTCDate(day.getUTCDate() - diff);
  return day;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ date: searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const d = new Date(parsed.data.date);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const start = startOfUtcDay(d);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const weekStart = startOfUtcWeekMonday(d);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const [totals, byHour, byDow] = await Promise.all([
    prisma.expense.groupBy({
      by: ["type"],
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<
      Array<{
        hour: number;
        expense: number | null;
        income: number | null;
      }>
    >`
      SELECT
        EXTRACT(HOUR FROM "date")::int as hour,
        SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense,
        SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income
      FROM "Expense"
      WHERE "date" >= ${start} AND "date" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<
      Array<{
        dow: number;
        expense: number | null;
        income: number | null;
      }>
    >`
      SELECT
        EXTRACT(DOW FROM "date")::int as dow,
        SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense,  
        SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income     
      FROM "Expense"
      WHERE "date" >= ${weekStart} AND "date" < ${weekEnd}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const totalExpense =
    totals.find((t) => t.type === "expense")?._sum.amount ?? 0;
  const totalIncome = totals.find((t) => t.type === "income")?._sum.amount ?? 0;

  return NextResponse.json({
    date: start,
    range: { start, end },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    },
    byHour: byHour.map((h) => ({
      hour: h.hour,
      income: Number(h.income ?? 0),
      expense: Number(h.expense ?? 0),
    })),
    week: {
      range: { start: weekStart, end: weekEnd },
      byDayOfWeek: byDow.map((x) => ({
        dow: x.dow, // 0=Sun..6=Sat (Postgres)
        expense: Number(x.expense ?? 0),
        income: Number(x.income ?? 0),
      })),
    },
  });
}

