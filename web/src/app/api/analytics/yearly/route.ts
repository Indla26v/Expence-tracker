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
  const tzOffsetStr = searchParams.get("tzOffset");
  const tzOffset = tzOffsetStr ? Number.parseInt(tzOffsetStr, 10) : -330;

  const parsed = querySchema.safeParse({ year: searchParams.get("year") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { year } = parsed.data;
  
  const localStart = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  const localEnd = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0);
  const start = new Date(localStart + tzOffset * 60000);
  const end = new Date(localEnd + tzOffset * 60000);
  
  const prevLocalStart = Date.UTC(year - 1, 0, 1, 0, 0, 0, 0);
  const prevStart = new Date(prevLocalStart + tzOffset * 60000);
  const prevEnd = start;

  const [expenses, prevExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      select: { amount: true, type: true, date: true, category: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: prevStart, lt: prevEnd } },
      select: { amount: true, type: true, date: true },
    }),
  ]);

  const monthMap = new Map<number, { income: number; expense: number }>();
  const prevMonthMap = new Map<number, { income: number; expense: number }>();
  const categoryMap = new Map<string, { total: number; count: number }>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const e of expenses) {
    const localDate = new Date(e.date.getTime() - tzOffset * 60000);
    const m = localDate.getUTCMonth();
    
    if (e.type === "expense") {
      totalExpense += e.amount;
      const cat = categoryMap.get(e.category) || { total: 0, count: 0 };
      cat.total += e.amount;
      cat.count += 1;
      categoryMap.set(e.category, cat);
    } else {
      totalIncome += e.amount;
    }

    const mData = monthMap.get(m) || { income: 0, expense: 0 };
    if (e.type === "expense") mData.expense += e.amount;
    else mData.income += e.amount;
    monthMap.set(m, mData);
  }

  for (const e of prevExpenses) {
    const localDate = new Date(e.date.getTime() - tzOffset * 60000);
    const m = localDate.getUTCMonth();
    const mData = prevMonthMap.get(m) || { income: 0, expense: 0 };
    if (e.type === "expense") mData.expense += e.amount;
    else mData.income += e.amount;
    prevMonthMap.set(m, mData);
  }

  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const d = monthMap.get(i) || { income: 0, expense: 0 };
    return {
      month: new Date(Date.UTC(year, i, 1)),
      income: d.income,
      expense: d.expense,
    };
  });

  const byMonthPrev = Array.from({ length: 12 }, (_, i) => {
    const d = prevMonthMap.get(i) || { income: 0, expense: 0 };
    return {
      month: new Date(Date.UTC(year - 1, i, 1)),
      income: d.income,
      expense: d.expense,
    };
  });

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
    }))
    .sort((a, b) => b.total - a.total);

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
      total: c.total,
      count: c.count,
    })),
  });
}

