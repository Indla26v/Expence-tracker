// Default categories used for initial seeding
export const DEFAULT_EXPENSE_CATEGORIES = [
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
  "Other",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Budget Allowance",
  "Others",
] as const;

// Combined list for backward compatibility
export const CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
] as const;

export type Category = (typeof CATEGORIES)[number];

// Static color map — used as fallback for known categories
export const CATEGORY_COLORS: Record<string, string> = {
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
  "Budget Allowance": "#3b82f6",
  Others: "#8b5cf6",
  Other: "#94a3b8",
};

// Dynamic category type from the database
export type DynamicCategory = {
  id: string;
  name: string;
  type: "expense" | "income";
  color: string;
};

/**
 * Resolve a category's display color.
 * Priority: custom DB color → static fallback map → default gray
 */
export function getCategoryColor(name: string, customColor?: string): string {
  if (customColor && customColor !== "#94a3b8") return customColor;
  return CATEGORY_COLORS[name] ?? customColor ?? "#94a3b8";
}
