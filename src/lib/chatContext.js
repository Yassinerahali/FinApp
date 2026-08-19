import { todayISO } from "./format";

function round2(n) {
  return Math.round(n * 100) / 100;
}

function monthKeyOffset(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthSummary(transactions, key, catLabel) {
  const byCategory = {};
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (!tx.date.startsWith(key)) continue;
    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expense += tx.amount;
      const label = catLabel(tx.category);
      byCategory[label] = (byCategory[label] || 0) + tx.amount;
    }
  }
  const rounded = {};
  for (const [label, amount] of Object.entries(byCategory)) rounded[label] = round2(amount);
  return { income: round2(income), expense: round2(expense), byCategory: rounded };
}

/**
 * Builds a compact JSON snapshot of the user's live financial data to
 * ground the chat assistant's answers — this month and last month's
 * breakdown, budgets, goals, open loans, account balances, and
 * recurring bills. Deliberately excludes the raw transaction list
 * (keeps the payload small and avoids sending unnecessary detail).
 */
export function buildChatContext({ transactions, budgets, goals, loans, accounts, rules, catLabel }) {
  const thisMonthKey = monthKeyOffset(0);
  const lastMonthKey = monthKeyOffset(-1);
  const thisMonth = monthSummary(transactions, thisMonthKey, catLabel);
  const lastMonth = monthSummary(transactions, lastMonthKey, catLabel);

  const accountBalances = new Map(accounts.map((a) => [a.id, a.opening_balance || 0]));
  let netWorth = accounts.reduce((sum, a) => sum + (a.opening_balance || 0), 0);
  for (const tx of transactions) {
    const signed = tx.type === "income" ? tx.amount : -tx.amount;
    netWorth += signed;
    if (tx.account_id && accountBalances.has(tx.account_id)) {
      accountBalances.set(tx.account_id, accountBalances.get(tx.account_id) + signed);
    }
  }

  return {
    today: todayISO(),
    thisMonth,
    lastMonth,
    budgets: Object.entries(budgets)
      .filter(([, limit]) => limit > 0)
      .map(([id, limit]) => ({
        category: catLabel(id),
        limit,
        spentThisMonth: thisMonth.byCategory[catLabel(id)] || 0,
      })),
    goals: goals.map((g) => ({
      name: g.name,
      targetAmount: g.target_amount,
      savedAmount: g.saved_amount,
      targetDate: g.target_date,
    })),
    loans: loans
      .filter((l) => l.remaining_amount > 0)
      .map((l) => ({
        direction: l.type === "lent" ? "they owe you" : "you owe them",
        counterparty: l.counterparty_name,
        remaining: l.remaining_amount,
        dueDate: l.due_date,
      })),
    accounts: accounts.map((a) => ({ name: a.name, balance: round2(accountBalances.get(a.id) || 0) })),
    netWorth: round2(netWorth),
    recurringBills: rules.map((r) => ({
      name: r.note || catLabel(r.category),
      amount: r.amount,
      direction: r.type === "income" ? "income" : "expense",
      dayOfMonth: r.dayOfMonth,
    })),
  };
}
