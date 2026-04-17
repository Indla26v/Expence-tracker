import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

function parseIntParam(value: string | null) {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);

  const month = parseIntParam(searchParams.get("month"));
  const year = parseIntParam(searchParams.get("year"));
  if (!month || !year) {
    return NextResponse.json({ error: "Month and year required" }, { status: 400 });
  }

  const tzOffset = -330; // IST fallback offset
  const localStart = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
  const localEnd = Date.UTC(year, month, 1, 0, 0, 0, 0);

  const gte = new Date(localStart + tzOffset * 60000);
  const lt = new Date(localEnd + tzOffset * 60000);

  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte, lt },
    },
    orderBy: { date: "asc" },
  });

  // Create CSV String
  let csvContent = "ID,Date,Time,Type,Category,Amount,Note\n";
  for (const exp of expenses) {
    const d = new Date(exp.date);
    const dateStr = d.toLocaleDateString("en-IN");
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const noteStr = (exp.note || "").replace(/"/g, '""');
    csvContent += `"${exp.id}","${dateStr}","${timeStr}","${exp.type}","${exp.category}","${exp.amount}","${noteStr}"\n`;
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/csv");
  headers.set("Content-Disposition", `attachment; filename=expenses-${year}-${month.toString().padStart(2, "0")}.csv`);

  return new NextResponse(csvContent, {
    status: 200,
    headers,
  });
}
