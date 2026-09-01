const CURRENCY_LABELS = { MAD: "MAD", EUR: "€", USD: "$" };

/**
 * Defaults to MAD so every existing call site across the app (budgets,
 * goals, recurring, loans, trends, category breakdown, cash flow
 * forecast) keeps working unchanged — those features aren't tied to a
 * specific account/currency and stay MAD-denominated. Only account
 * balances and the transactions linked to them pass a real currency.
 */
export function formatAmount(value, currency = "MAD") {
  const abs = Math.abs(value);
  const number = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    numberingSystem: "latn",
  });
  const label = CURRENCY_LABELS[currency] || currency;
  return `${number} ${label}`;
}

export function formatDate(iso, locale = "en-US") {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    numberingSystem: "latn",
  });
}

export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}
