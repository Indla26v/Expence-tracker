import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const querySchema = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ year: searchParams.get("year") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { year } = parsed.data;
  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  const prevStart = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0));
  const prevEnd = start;

  const [byMonth, byMonthPrev, byCategory, totals] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        month: Date;
        expense: number | null;
        income: number | null;
      }>
    >`
      SELECT
        date_trunc('month', "date") as month,
        SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense,
        SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income
      FROM "Expense"
      WHERE "date" >= ${start} AND "date" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.$queryRaw<
      Array<{
        month: Date;
        expense: number | null;
        income: number | null;
      }>
    >`
      SELECT
        date_trunc('month', "date") as month,
        SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense,
        SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income
      FROM "Expense"
      WHERE "date" >= ${prevStart} AND "date" < ${prevEnd}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.expense.groupBy({
      by: ["category"],
      where: { type: "expense", date: { gte: start, lt: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.expense.groupBy({
      by: ["type"],
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalExpense =
    totals.find((t) => t.type === "expense")?._sum.amount ?? 0;
  const totalIncome = totals.find((t) => t.type === "income")?._sum.amount ?? 0;

  return NextResponse.json({
    year,
    range: { start, end },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    },
    byMonth: byMonth.map((m) => ({
      month: m.month,
      income: Number(m.income ?? 0),
      expense: Number(m.expense ?? 0),
    })),
    yearOverYear: {
      year,
      prevYear: year - 1,
      byMonthPrev: byMonthPrev.map((m) => ({
        month: m.month,
        income: Number(m.income ?? 0),
        expense: Number(m.expense ?? 0),
      })),
    },
    byCategory: byCategory.map((c) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
    })),
  });
}

