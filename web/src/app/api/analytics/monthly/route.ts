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
  const tzOffsetStr = searchParams.get("tzOffset");
  const tzOffset = tzOffsetStr ? Number.parseInt(tzOffsetStr, 10) : 0;

  const parsed = querySchema.safeParse({
    month: searchParams.get("month"),
    year: searchParams.get("year"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { month, year } = parsed.data;
  
  // start/end in UTC based on the local month boundaries
  // Local `YYYY-MM-01T00:00:00` = `Date.UTC(...) + tzOffset * 60000`
  const localStart = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const localEnd = Date.UTC(year, month, 1, 0, 0, 0, 0);
  const start = new Date(localStart + tzOffset * 60000);
  const end = new Date(localEnd + tzOffset * 60000);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lt: end } },
    select: { amount: true, type: true, date: true, category: true },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const dayMap = new Map<string, { income: number; expense: number }>();
  const categoryMap = new Map<string, { total: number; count: number }>();

  for (const e of expenses) {
    // Determine the local calendar date for this expense
    const msOptionsOffset = e.date.getTime() - tzOffset * 60000;
    const localDate = new Date(msOptionsOffset);
    // Format YYYY-MM-DD
    const dateStr = localDate.toISOString().split("T")[0];

    if (e.type === "expense") {
      totalExpense += e.amount;
      const cat = categoryMap.get(e.category) || { total: 0, count: 0 };
      cat.total += e.amount;
      cat.count += 1;
      categoryMap.set(e.category, cat);
    } else {
      totalIncome += e.amount;
    }

    const d = dayMap.get(dateStr) || { income: 0, expense: 0 };
    if (e.type === "expense") d.expense += e.amount;
    else d.income += e.amount;
    dayMap.set(dateStr, d);
  }

  const byDay = Array.from(dayMap.entries())
    .map(([day, totals]) => ({
      day,
      income: totals.income,
      expense: totals.expense,
    }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      total: stats.total,
      count: stats.count,
    }))
    .sort((a, b) => b.total - a.total);

  const topCategories = byCategory.slice(0, 5).map((c) => ({
    category: c.category,
    total: c.total,
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
      total: c.total,
      count: c.count,
    })),
    topCategories,
  });
}

