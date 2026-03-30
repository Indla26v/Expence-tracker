export const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#22c55e",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Bills: "#f97316",
  Health: "#ef4444",
  Entertainment: "#eab308",
  Other: "#94a3b8",
};

