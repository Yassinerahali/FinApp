import { todayISO } from "./format";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" -> "2026-12" (rolls over the year). */
export function nextMonthKey(key) {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthStatus(key, currentKey = currentMonthKey()) {
  if (key < currentKey) return "past";
  if (key > currentKey) return "upcoming";
  return "current";
}

export function monthLabel(key, locale) {
  const [year, month] = key.split("-").map(Number);
  const name = new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "long",
    numberingSystem: "latn",
  });
  return { name, year };
}

export function hasSubs(expense) {
  return Array.isArray(expense.subs) && expense.subs.length > 0;
}

/** An expense with sub-expenses is worth the sum of its parts. */
export function amountOf(expense) {
  if (hasSubs(expense)) {
    return round2(expense.subs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0));
  }
  return round2(expense.amount);
}

/** "done" (all paid), "partial" (some sub-expenses paid) or "none". */
export function stateOf(expense) {
  if (hasSubs(expense)) {
    const paid = expense.subs.filter((s) => s.done).length;
    if (paid === expense.subs.length) return "done";
    return paid > 0 ? "partial" : "none";
  }
  return expense.done ? "done" : "none";
}

export function planTotals(plan) {
  let total = 0;
  let paid = 0;
  let count = 0;
  let paidCount = 0;
  for (const e of plan.expenses) {
    const amount = amountOf(e);
    total += amount;
    if (amount > 0) {
      count += 1;
      if (stateOf(e) === "done") paidCount += 1;
    }
    if (hasSubs(e)) {
      paid += e.subs.reduce((sum, s) => sum + (s.done ? Number(s.amount) || 0 : 0), 0);
    } else if (e.done) {
      paid += amount;
    }
  }
  total = round2(total);
  paid = round2(paid);
  return {
    total,
    paid,
    remaining: round2(total - paid),
    count,
    paidCount,
    left: round2(plan.salary - total - plan.savings),
  };
}

/** Savings are set aside from salary and are never counted as expenses. */
export function planStatus(plan, totals) {
  if (totals.left < 0) return { kind: "short", amount: -totals.left };
  if (plan.savings < plan.objective) return { kind: "bring", amount: round2(plan.objective - plan.savings) };
  return { kind: "ok", amount: plan.objective };
}

export function dueInfo(due, done) {
  if (!due) return { kind: "none", days: 0 };
  const days = Math.round(
    (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${todayISO()}T00:00:00Z`)) / 86400000
  );
  if (done) return { kind: "paid", days };
  if (days < 0) return { kind: "overdue", days: -days };
  if (days === 0) return { kind: "today", days };
  return { kind: "later", days };
}

export function blankExpense(name = "") {
  return { id: newId(), name, amount: 0, done: false, due: "", subs: [] };
}

export function blankSub(name = "", amount = 0, done = false) {
  return { id: newId(), name, amount, done };
}

/** Next month's starting point: same lines, nothing paid yet, no due dates. */
export function planFrom(previous, month) {
  return {
    month,
    salary: previous?.salary ?? 0,
    savings: previous?.savings ?? 0,
    objective: previous?.objective ?? 0,
    debts: previous?.debts ?? 0,
    debtsLabel: previous?.debtsLabel ?? "",
    expenses: (previous?.expenses ?? []).map((e) => ({
      id: newId(),
      name: e.name,
      amount: e.amount,
      done: false,
      due: "",
      subs: (e.subs ?? []).map((s) => blankSub(s.name, s.amount, false)),
    })),
  };
}

export function rowToPlan(row) {
  return {
    month: row.month,
    salary: Number(row.salary) || 0,
    savings: Number(row.savings) || 0,
    objective: Number(row.savings_objective) || 0,
    debts: Number(row.debts) || 0,
    debtsLabel: row.debts_label || "",
    expenses: Array.isArray(row.expenses) ? row.expenses : [],
  };
}

export function planToRow(plan, userId) {
  return {
    user_id: userId,
    month: plan.month,
    salary: plan.salary,
    savings: plan.savings,
    savings_objective: plan.objective,
    debts: plan.debts,
    debts_label: plan.debtsLabel || null,
    expenses: plan.expenses,
    updated_at: new Date().toISOString(),
  };
}

/** Typed text -> a non-negative number ("12,5" and "12.5" both work). */
export function parseAmount(text) {
  const n = parseFloat(String(text).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
