import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const expenseBodySchema = z.object({
  amount: z.number().finite(),
  type: z.enum(["expense", "income"]),
  category: z.string().min(1),
  date: z.coerce.date(),
  note: z.string().trim().min(1).optional().nullable(),
});

function parseIntParam(value: string | null) {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);

  const month = parseIntParam(searchParams.get("month"));
  const year = parseIntParam(searchParams.get("year"));
  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim() ?? "";
  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));
  const limit = Math.min(parseIntParam(searchParams.get("limit")) ?? 50, 200);
  const offset = Math.max(parseIntParam(searchParams.get("offset")) ?? 0, 0);

  const dateFilter: { gte?: Date; lt?: Date } = {};

  if (year && month && month >= 1 && month <= 12) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    dateFilter.gte = start;
    dateFilter.lt = end;
  } else {
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lt = to;
  }

  const where = {
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    ...(type === "expense" || type === "income" ? { type } : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { note: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: offset,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ items, total, limit, offset });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const json = await req.json().catch(() => null);
  const parsed = expenseBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const data = parsed.data;

  const created = await prisma.expense.create({
    data: {
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: data.date,
      note: data.note ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

