import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

const settingsSchema = z.object({
  initialBalance: z.number().finite(),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const email = authResult.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { initialBalance: true },
  });

  return NextResponse.json({ initialBalance: user?.initialBalance ?? 0 });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const email = authResult.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });    
  }

  const { initialBalance } = parsed.data;

  const user = await prisma.user.update({
    where: { email },
    data: { initialBalance },
    select: { initialBalance: true },
  });

  return NextResponse.json({ initialBalance: user.initialBalance });
}
