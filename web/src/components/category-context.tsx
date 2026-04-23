"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { DynamicCategory } from "@/lib/categories";

type CategoryContextValue = {
  expenseCategories: DynamicCategory[];
  incomeCategories: DynamicCategory[];
  loading: boolean;
  addCategory: (
    name: string,
    type: "expense" | "income"
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
  updateCategoryOrder: (updates: { id: string; sortOrder: number }[]) => Promise<{ ok: boolean; error?: string }>;
  refreshCategories: () => Promise<void>;
};

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [expenseCategories, setExpenseCategories] = useState<DynamicCategory[]>(
    []
  );
  const [incomeCategories, setIncomeCategories] = useState<DynamicCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = (await res.json()) as {
        expense: DynamicCategory[];
        income: DynamicCategory[];
      };
      setExpenseCategories(data.expense);
      setIncomeCategories(data.income);
    } catch {
      // Keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(
    async (
      name: string,
      type: "expense" | "income"
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, type }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          return { ok: false, error: data?.error ?? "Failed to add category" };
        }

        await fetchCategories();
        return { ok: true };
      } catch {
        return { ok: false, error: "An error occurred" };
      }
    },
    [fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/categories?id=${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          return {
            ok: false,
            error: data?.error ?? "Failed to delete category",
          };
        }

        await fetchCategories();
        return { ok: true };
      } catch {
        return { ok: false, error: "An error occurred" };
      }
    },
    [fetchCategories]
  );

  const updateCategoryOrder = useCallback(
    async (updates: { id: string; sortOrder: number }[]): Promise<{ ok: boolean; error?: string }> => {
      // Optimistically update state so it feels instant
      const getOptimisticList = (list: DynamicCategory[]) => {
        const cloned = [...list];
        for (const update of updates) {
          const idx = cloned.findIndex((c) => c.id === update.id);
          if (idx !== -1) {
            cloned[idx] = { ...cloned[idx], sortOrder: update.sortOrder } as any; 
          }
        }
        return cloned.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      };

      setExpenseCategories((prev) => getOptimisticList(prev));
      setIncomeCategories((prev) => getOptimisticList(prev));

      try {
        const res = await fetch("/api/categories", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          // Revert optimistic update by refetching on failure
          await fetchCategories();
          return { ok: false, error: data?.error ?? "Failed to update category order" };
        }

        return { ok: true };
      } catch {
        await fetchCategories();
        return { ok: false, error: "An error occurred" };
      }
    },
    [fetchCategories]
  );

  return (
    <CategoryContext.Provider
      value={{
        expenseCategories,
        incomeCategories,
        loading,
        addCategory,
        deleteCategory,
        updateCategoryOrder,
        refreshCategories: fetchCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryContext() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategoryContext must be used within a CategoryProvider");
  }
  return ctx;
}
