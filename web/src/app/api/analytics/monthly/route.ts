import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1970).max(3000),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    month: searchParams.get("month"),
    year: searchParams.get("year"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { month, year } = parsed.data;
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const [totals, byDay, byCategory] = await Promise.all([
    prisma.expense.groupBy({
      by: ["type"],
      where: { date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<
      Array<{
        day: Date;
        expense: number | null;
        income: number | null;
      }>
    >`
      SELECT
        date_trunc('day', "date") as day,
        SUM(CASE WHEN "type" = 'expense' THEN "amount" ELSE 0 END) as expense,
        SUM(CASE WHEN "type" = 'income' THEN "amount" ELSE 0 END) as income
      FROM "Expense"
      WHERE "date" >= ${start} AND "date" < ${end}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.expense.groupBy({
      by: ["category"],
      where: { type: "expense", date: { gte: start, lt: end } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
  ]);

  const totalExpense =
    totals.find((t) => t.type === "expense")?._sum.amount ?? 0;
  const totalIncome = totals.find((t) => t.type === "income")?._sum.amount ?? 0;

  const topCategories = byCategory.slice(0, 5).map((c) => ({
    category: c.category,
    total: c._sum.amount ?? 0,
  }));

  return NextResponse.json({
    month,
    year,
    range: { start, end },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    },
    byDay: byDay.map((d) => ({
      day: d.day,
      income: Number(d.income ?? 0),
      expense: Number(d.expense ?? 0),
    })),
    byCategory: byCategory.map((c) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
    })),
    topCategories,
  });
}

