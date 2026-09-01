import { todayISO } from "./format";

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mapValues(obj, fn) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = fn(v);
  return out;
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
  const accountCurrency = new Map(accounts.map((a) => [a.id, a.currency || "MAD"]));
  const totalsByCurrency = {};
  for (const a of accounts) {
    const curr = a.currency || "MAD";
    totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + (a.opening_balance || 0);
  }
  for (const tx of transactions) {
    const signed = tx.type === "income" ? tx.amount : -tx.amount;
    if (tx.account_id && accountBalances.has(tx.account_id)) {
      accountBalances.set(tx.account_id, accountBalances.get(tx.account_id) + signed);
      const curr = accountCurrency.get(tx.account_id) || "MAD";
      totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + signed;
    } else {
      // Unassigned transactions fold into MAD, same as everywhere else
      // in the app.
      totalsByCurrency.MAD = (totalsByCurrency.MAD || 0) + signed;
    }
  }
  const currencyKeys = Object.keys(totalsByCurrency);
  // A single netWorth figure only makes sense if everything's in one
  // currency (the common case) — summing different currencies together
  // would just produce a meaningless number. With more than one
  // currency in play, give RICO the breakdown instead and let it
  // reason from the per-account currencies already included below.
  const netWorth = currencyKeys.length <= 1 ? round2(totalsByCurrency[currencyKeys[0]] || 0) : null;
  const netWorthByCurrency = currencyKeys.length > 1 ? mapValues(totalsByCurrency, round2) : null;

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
    accounts: accounts.map((a) => ({
      name: a.name,
      balance: round2(accountBalances.get(a.id) || 0),
      currency: a.currency || "MAD",
    })),
    netWorth,
    netWorthByCurrency,
    recurringBills: rules.map((r) => ({
      name: r.note || catLabel(r.category),
      amount: r.amount,
      direction: r.type === "income" ? "income" : "expense",
      dayOfMonth: r.dayOfMonth,
    })),
  };
}
