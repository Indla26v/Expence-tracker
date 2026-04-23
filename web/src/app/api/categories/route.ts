import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  CATEGORY_COLORS,
} from "@/lib/categories";

const addCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.enum(["expense", "income"]),
});

/**
 * Seed default categories if the table is empty.
 * Called lazily on the first GET request.
 */
async function seedDefaultsIfEmpty() {
  const count = await prisma.category.count();
  if (count > 0) return;

  const rows = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      name,
      type: "expense" as const,
      color: CATEGORY_COLORS[name] ?? "#94a3b8",
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name) => ({
      name,
      type: "income" as const,
      color: CATEGORY_COLORS[name] ?? "#94a3b8",
    })),
  ];

  await prisma.category.createMany({ data: rows, skipDuplicates: true });
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  await seedDefaultsIfEmpty();

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  const expense = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  return NextResponse.json({ expense, income });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const json = await req.json().catch(() => null);
  const parsed = addCategorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, type } = parsed.data;

  try {
    const category = await prisma.category.create({
      data: {
        name,
        type,
        color: CATEGORY_COLORS[name] ?? "#94a3b8",
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: `Category "${name}" already exists for ${type}` },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  // Look up the category
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  // Check if any transactions reference this category name + type
  const usageCount = await prisma.expense.count({
    where: {
      category: category.name,
      type: category.type,
    },
  });

  if (usageCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete "${category.name}" — it is used by ${usageCount} transaction${usageCount > 1 ? "s" : ""}. Remove or re-categorize those transactions first.`,
      },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
