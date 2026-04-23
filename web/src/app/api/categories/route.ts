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
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
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
    // Get the highest sortOrder to put new categories at the bottom
    const maxSortOrderResult = await prisma.category.aggregate({
      where: { type },
      _max: { sortOrder: true },
    });
    
    const nextSortOrder = (maxSortOrderResult._max.sortOrder ?? 0) + 1;

    const category = await prisma.category.create({
      data: {
        name,
        type,
        color: CATEGORY_COLORS[name] ?? "#94a3b8",
        sortOrder: nextSortOrder,
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

const updateSortOrderSchema = z.array(
  z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })
);

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const json = await req.json().catch(() => null);
  const parsed = updateSortOrderSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
  }

  const updates = parsed.data;

  try {
    // Perform bulk update of sort orders using completely separate queries inside a transaction
    await prisma.$transaction(
      updates.map((update) =>
        prisma.category.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("Error updating category sorts: ", error);
    return NextResponse.json({ error: "Could not update category sort orders." }, { status: 500 });
  }
}
