const KEY = "ledger:budgets:v1";

export function loadBudgets() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function saveBudgets(budgets) {
  try {
    localStorage.setItem(KEY, JSON.stringify(budgets));
  } catch {
    // storage unavailable — fail silently
  }
}
