import { useEffect, useState } from "react";
import { todayISO } from "../lib/format";
import { useLanguage } from "../lib/i18n/LanguageContext";

const EMPTY = { type: "expense", amount: "", category: "food", date: todayISO(), note: "" };

export default function EntryForm({
  onAdd,
  editing,
  onSave,
  onCancelEdit,
  accounts = [],
  defaultAccountId,
  categories: allCategories,
}) {
  const { t, catLabel } = useLanguage();
  const [type, setType] = useState(EMPTY.type);
  const [amount, setAmount] = useState(EMPTY.amount);
  const [category, setCategory] = useState(EMPTY.category);
  const [date, setDate] = useState(EMPTY.date);
  const [note, setNote] = useState(EMPTY.note);
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [error, setError] = useState("");

  const isEditing = Boolean(editing);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date);
      setNote(editing.note || "");
      setAccountId(editing.account_id || "");
      setError("");
    } else {
      setType(EMPTY.type);
      setAmount(EMPTY.amount);
      setCategory(EMPTY.category);
      setDate(todayISO());
      setNote(EMPTY.note);
      setAccountId(defaultAccountId ?? "");
      setError("");
    }
  }, [editing, defaultAccountId]);

  const categories = allCategories.filter((c) => c.type === type);

  function handleTypeChange(nextType) {
    setType(nextType);
    if (!isEditing || allCategories.find((c) => c.id === category)?.type !== nextType) {
      const first = allCategories.find((c) => c.type === nextType);
      if (first) setCategory(first.id);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      setError(t("errorAmount"));
      return;
    }
    if (!date) {
      setError(t("errorDate"));
      return;
    }
    const entry = {
      type,
      amount: numeric,
      category,
      date,
      note: note.trim(),
      account_id: accountId || null,
    };

    if (isEditing) {
      onSave(editing.id, entry);
    } else {
      onAdd(entry);
      setAmount("");
      setNote("");
    }
    setError("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="font-serif text-lg font-semibold tracking-tight">
          {isEditing ? t("editEntry") : t("newEntry")}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
          {t("ledgerSlip")}
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
          <label htmlFor="amount" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
            {t("amount")}
          </label>
          <div className="flex items-center border-b border-(--color-ink)">
            <input
              id="amount"
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
            <label htmlFor="category" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("category")}
            </label>
            <select
              id="category"
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
            <label htmlFor="date" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("date")}
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 font-mono text-sm tabular outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="note" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
            {t("note")} <span className="normal-case text-(--color-rule)">{t("optional")}</span>
          </label>
          <input
            id="note"
            type="text"
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
          />
        </div>

        {accounts.length > 0 && (
          <div>
            <label htmlFor="account" className="block text-xs uppercase tracking-wide text-(--color-ink-soft) mb-1.5">
              {t("account")}
            </label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-(--color-debit) font-medium">{error}</p>
      )}

      <div className="mt-6 flex gap-2">
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 border border-(--color-rule) text-(--color-ink-soft) py-3 font-mono text-sm uppercase tracking-widest hover:border-(--color-ink) hover:text-(--color-ink) transition-colors"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          className="flex-1 bg-(--color-ink) text-(--color-paper) py-3 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors"
        >
          {isEditing ? t("saveChanges") : t("recordEntry")}
        </button>
      </div>
    </form>
  );
}
