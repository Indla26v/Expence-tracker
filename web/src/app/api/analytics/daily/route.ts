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
  const tzOffsetStr = searchParams.get("tzOffset");
  const tzOffset = tzOffsetStr ? Number.parseInt(tzOffsetStr, 10) : -330;

  const parsed = querySchema.safeParse({ date: searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const d = new Date(parsed.data.date);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  // d is e.g. "2026-04-17" in UTC (from the frontend's string).
  // The local boundaries for this given day
  const localDayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
  const localDayEnd = localDayStart + 86400000;
  const start = new Date(localDayStart + tzOffset * 60000);
  const end = new Date(localDayEnd + tzOffset * 60000);

  // find start of week (Monday)
  const jsDow = d.getUTCDay();
  const diffToMonday = (jsDow + 6) % 7;
  const localWeekStart = localDayStart - diffToMonday * 86400000;
  const localWeekEnd = localWeekStart + 7 * 86400000;
  const weekStart = new Date(localWeekStart + tzOffset * 60000);
  const weekEnd = new Date(localWeekEnd + tzOffset * 60000);

  const [expenses, weekExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
      select: { amount: true, type: true, date: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      select: { amount: true, type: true, date: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpense = 0;
  const hourMap = new Map<number, { income: number; expense: number }>();
  const dowMap = new Map<number, { income: number; expense: number }>();

  for (const e of expenses) {
    const localDate = new Date(e.date.getTime() - tzOffset * 60000);
    const hour = localDate.getUTCHours();
    
    if (e.type === "expense") totalExpense += e.amount;
    else totalIncome += e.amount;

    const h = hourMap.get(hour) || { income: 0, expense: 0 };
    if (e.type === "expense") h.expense += e.amount;
    else h.income += e.amount;
    hourMap.set(hour, h);
  }

  for (const e of weekExpenses) {
    const localDate = new Date(e.date.getTime() - tzOffset * 60000);
    const dow = localDate.getUTCDay(); // 0=Sun..6=Sat
    
    const d = dowMap.get(dow) || { income: 0, expense: 0 };
    if (e.type === "expense") d.expense += e.amount;
    else d.income += e.amount;
    dowMap.set(dow, d);
  }

  const byHour = Array.from(hourMap.entries())
    .map(([hour, totals]) => ({ hour, ...totals }))
    .sort((a, b) => a.hour - b.hour);

  const byDayOfWeek = Array.from({ length: 7 }, (_, i) => {
    const dow = i;
    const totals = dowMap.get(dow) || { income: 0, expense: 0 };
    return { dow, ...totals };
  });

  return NextResponse.json({
    date: start,
    range: { start, end },
    totals: {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense,
    },
    byHour,
    week: {
      range: { start: weekStart, end: weekEnd },
      byDayOfWeek,
    },
  });
}

