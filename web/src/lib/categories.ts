export const CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Drinks",
  "Snacks",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Salary",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<Category, string> = {
  Breakfast: "#22c55e",
  Lunch: "#84cc16",
  Dinner: "#10b981",
  Drinks: "#14b8a6",
  Snacks: "#84cc16",
  Transport: "#3b82f6",
  Shopping: "#a855f7",
  Bills: "#f97316",
  Health: "#ef4444",
  Entertainment: "#eab308",
  Salary: "#10b981",
  Other: "#94a3b8",
};

