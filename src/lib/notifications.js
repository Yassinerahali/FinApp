import { nextDueDate } from "./recurring";
import { todayISO, formatAmount } from "./format";

const DUE_SOON_DAYS = 3;

function daysBetween(fromISO, toISO) {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  return Math.round((to - from) / 86400000);
}

/**
 * Computes the current set of notifications from live app data. Nothing
 * here is persisted — an alert naturally disappears once its underlying
 * condition is no longer true (budget fixed, bill logged, loan paid off),
 * which is more correct for financial data than a stateful read/unread
 * flag would be.
 */
export function computeNotifications({ budgets, monthTransactions, rules, loans, catLabel }) {
  const notifications = [];
  const today = todayISO();

  // Over-budget categories this month.
  const spentByCategory = {};
  for (const tx of monthTransactions) {
    if (tx.type !== "expense") continue;
    spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + tx.amount;
  }
  for (const [categoryId, limit] of Object.entries(budgets)) {
    if (!limit || limit <= 0) continue;
    const spent = spentByCategory[categoryId] || 0;
    if (spent > limit) {
      notifications.push({
        id: `budget-${categoryId}`,
        severity: "debit",
        key: "notifyOverBudget",
        params: { category: catLabel(categoryId), amount: formatAmount(spent - limit) },
        tab: "budgets",
      });
    }
  }

  // Recurring entries due soon.
  for (const rule of rules) {
    const due = nextDueDate(rule, today);
    const daysUntil = daysBetween(today, due);
    if (daysUntil >= 0 && daysUntil <= DUE_SOON_DAYS) {
      notifications.push({
        id: `recurring-${rule.id}`,
        severity: daysUntil === 0 ? "debit" : "brass",
        key: daysUntil === 0 ? "notifyRecurringToday" : "notifyRecurringSoon",
        params: {
          name: rule.note || catLabel(rule.category),
          days: daysUntil,
        },
        tab: "recurring",
      });
    }
  }

  // Loans/debts due soon or overdue.
  for (const loan of loans) {
    if (loan.remaining_amount <= 0 || !loan.due_date) continue;
    const daysUntil = daysBetween(today, loan.due_date);
    if (daysUntil < 0) {
      notifications.push({
        id: `loan-${loan.id}`,
        severity: "debit",
        key: "notifyLoanOverdue",
        params: { name: loan.counterparty_name, days: Math.abs(daysUntil) },
        tab: "loans",
      });
    } else if (daysUntil <= DUE_SOON_DAYS) {
      notifications.push({
        id: `loan-${loan.id}`,
        severity: daysUntil === 0 ? "debit" : "brass",
        key: daysUntil === 0 ? "notifyLoanToday" : "notifyLoanSoon",
        params: { name: loan.counterparty_name, days: daysUntil },
        tab: "loans",
      });
    }
  }

  return notifications;
}
