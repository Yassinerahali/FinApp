import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount } from "../lib/format";

export default function GoalsPanel({ goals, addGoal, contribute, deleteGoal }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const numeric = parseFloat(targetAmount);
    if (!name.trim()) {
      setError(t("goalErrorName"));
      return;
    }
    if (!targetAmount || Number.isNaN(numeric) || numeric <= 0) {
      setError(t("goalErrorAmount"));
      return;
    }
    await addGoal({
      name: name.trim(),
      target_amount: numeric,
      target_date: targetDate || null,
    });
    setName("");
    setTargetAmount("");
    setTargetDate("");
    setError("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("newGoal")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("goalsSubtitle")}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="goal-name" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("goalsTitle")}
            </label>
            <input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("goalNamePlaceholder")}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-amount" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("targetAmount")}
              </label>
              <div className="flex items-center border-b border-(--color-ink)">
                <input
                  id="goal-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-transparent py-1.5 font-mono text-lg tabular outline-none placeholder:text-(--color-rule)"
                />
                <span className="font-mono text-xs text-(--color-ink-soft) ps-1">MAD</span>
              </div>
            </div>
            <div>
              <label htmlFor="goal-date" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
                {t("targetDateOptional")}
              </label>
              <input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none"
              />
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>}

        <button
          type="submit"
          className="mt-6 w-full bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
        >
          {t("addGoal")}
        </button>
      </form>

      {goals.length === 0 ? (
        <div className="border border-(--color-rule) bg-(--color-paper) p-8 text-center">
          <p className="text-sm text-(--color-ink-soft)">{t("noGoalsYet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onContribute={contribute} onDelete={deleteGoal} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, onContribute, onDelete }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");

  const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
  const reached = goal.saved_amount >= goal.target_amount;

  async function handleContribute(e) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!amount || Number.isNaN(numeric) || numeric === 0) return;
    await onContribute(goal.id, numeric);
    setAmount("");
  }

  return (
    <div className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-serif text-lg font-semibold tracking-tight">{goal.name}</h3>
        <button
          onClick={() => onDelete(goal.id)}
          aria-label={t("goalDeleteAria")}
          className="text-(--color-ink-soft) hover:text-(--color-debit) text-xs"
        >
          ✕
        </button>
      </div>

      <p className="font-mono tabular text-sm text-(--color-ink-soft) mb-2">
        {t("savedOfTarget", {
          saved: formatAmount(goal.saved_amount),
          target: formatAmount(goal.target_amount),
        })}
      </p>

      <div className="h-1.5 bg-(--color-paper-bar) overflow-hidden mb-4">
        <div
          className={`h-full transition-all ${reached ? "bg-(--color-credit)" : "bg-(--color-brass)"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>

      {reached ? (
        <p className="text-sm text-(--color-credit) font-medium">{t("goalReached")}</p>
      ) : (
        <form onSubmit={handleContribute} className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("contributeAmountPlaceholder")}
            className="flex-1 border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none placeholder:text-(--color-rule)"
          />
          <button
            type="submit"
            className="shrink-0 border border-(--color-rule) px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink) transition-colors"
          >
            {t("contribute")}
          </button>
        </form>
      )}
    </div>
  );
}
