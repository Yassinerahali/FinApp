const KEY = "ledger:transactions:v1";

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions) {
  try {
    localStorage.setItem(KEY, JSON.stringify(transactions));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, state still holds in memory
  }
}
