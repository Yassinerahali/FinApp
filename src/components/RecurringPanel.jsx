import { useState } from "react";
import { DEFAULT_CATEGORIES } from "../lib/categories";
import { formatAmount, todayISO } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function RecurringPanel({ rules, addRule, deleteRule }) {
  const { t, catLabel } = useLanguage();
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("housing");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const categories = DEFAULT_CATEGORIES.filter((c) => c.type === type);

  function handleTypeChange(nextType) {
    setType(nextType);
    const first = DEFAULT_CATEGORIES.find((c) => c.type === nextType);
    if (first) setCategory(first.id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    const numericDay = parseInt(dayOfMonth, 10);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError(t("errorAmount"));
      return;
    }
    if (Number.isNaN(numericDay) || numericDay < 1 || numericDay > 31) {
      setError(t("errorDay"));
      return;
    }
    addRule({
      type,
      amount: numericAmount,
      category,
      dayOfMonth: numericDay,
      note: note.trim(),
      startDate: todayISO(),
    });
    setAmount("");
    setNote("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("newRecurringEntry")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("monthly")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
              type === "expense"
                ? "bg-(--color-debit) border-(--color-debit) text-(--color-paper)"
                : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-debit)"
            }`}
          >
            {t("debit")}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
              type === "income"
                ? "bg-(--color-credit) border-(--color-credit) text-(--color-paper)"
                : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-credit)"
            }`}
          >
            {t("credit")}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="r-amount" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("amount")}
            </label>
            <div className="flex items-center border-b border-(--color-ink)">
              <input
                id="r-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent py-1.5 font-mono text-xl tabular outline-none placeholder:text-(--color-rule)"
              />
              <span className="font-mono text-xs text-(--color-ink-soft) ps-1">MAD</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="r-category" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("category")}
              </label>
              <select
                id="r-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {catLabel(c.id)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="r-day" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("dayOfMonth")}
              </label>
              <input
                id="r-day"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="r-note" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("label")}
            </label>
            <input
              id="r-note"
              type="text"
              placeholder={t("recurringLabelPlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}

        <button
          type="submit"
          className="mt-6 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
        >
          {t("addRecurringEntry")}
        </button>
        <p className="mt-3 text-xs text-(--color-ink-soft)">{t("recurringHint")}</p>
      </form>

      <div className="border border-(--color-rule) bg-(--color-paper)">
        {rules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-ink-soft)">{t("noRecurringEntries")}</p>
          </div>
        ) : (
          <ul>
            {rules.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 border-b border-(--color-rule) last:border-b-0 px-4 sm:px-5 py-3 group"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{r.note || catLabel(r.category)}</p>
                  <p className="text-xs text-(--color-ink-soft) font-mono">
                    {catLabel(r.category)} · {t("dayOfMonthLabel", { day: r.dayOfMonth })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`font-mono tabular text-sm ${
                      r.type === "income" ? "text-(--color-credit)" : "text-(--color-debit)"
                    }`}
                  >
                    {r.type === "income" ? "+" : "−"}{formatAmount(r.amount)}
                  </span>
                  <button
                    onClick={() => deleteRule(r.id)}
                    aria-label={t("deleteRecurringAria")}
                    className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-(--color-ink-soft) hover:text-(--color-debit) text-xs transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
