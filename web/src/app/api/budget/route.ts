import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

function parseIntParam(value: string | null) {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

const setBudgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1970).max(3000),
  amount: z.number().finite().min(0),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = parseIntParam(searchParams.get("month")) ?? now.getUTCMonth() + 1;
  const year = parseIntParam(searchParams.get("year")) ?? now.getUTCFullYear();

  const budget = await prisma.budget.findUnique({
    where: { month_year: { month, year } },
  });

  return NextResponse.json({ month, year, budget });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const json = await req.json().catch(() => null);
  const parsed = setBudgetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { month, year, amount } = parsed.data;

  const budget = await prisma.budget.upsert({
    where: { month_year: { month, year } },
    update: { amount },
    create: { month, year, amount },
  });

  return NextResponse.json({ budget });
}

