// Category display names are translated via catLabel() from the language
// context (see lib/i18n/translations.js CATEGORY_LABELS). Only stable ids
// and types live here, since ids are used as keys in transactions/budgets.
export const DEFAULT_CATEGORIES = [
  { id: "salary", type: "income" },
  { id: "freelance", type: "income" },
  { id: "other-income", type: "income" },
  { id: "food", type: "expense" },
  { id: "transport", type: "expense" },
  { id: "housing", type: "expense" },
  { id: "utilities", type: "expense" },
  { id: "shopping", type: "expense" },
  { id: "health", type: "expense" },
  { id: "entertainment", type: "expense" },
  { id: "other-expense", type: "expense" },
];
