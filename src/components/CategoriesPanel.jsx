import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";

export default function CategoriesPanel({ categories, addCategory, deleteCategory }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    const { error: addError } = await addCategory(trimmed, type);
    if (addError) {
      setError(addError.message || t("categoryErrorGeneric"));
      return;
    }
    setName("");
  }

  async function handleDelete(id) {
    if (window.confirm(t("categoryDeleteConfirm"))) {
      await deleteCategory(id);
    }
  }

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="border border-(--color-rule) bg-(--color-paper) p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-lg font-semibold tracking-tight">{t("categoriesTitle")}</h2>
          <span className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
            {t("categoriesSubtitle")}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setType("expense")}
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
            onClick={() => setType("income")}
            className={`py-2.5 font-mono text-sm uppercase tracking-wide border transition-colors ${
              type === "income"
                ? "bg-(--color-credit) border-(--color-credit) text-(--color-paper)"
                : "border-(--color-rule) text-(--color-ink-soft) hover:border-(--color-credit)"
            }`}
          >
            {t("credit")}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("categoryNamePlaceholder")}
            className="flex-1 border-b border-(--color-ink) bg-transparent py-1.5 text-sm outline-none placeholder:text-(--color-rule)"
          />
          <button
            type="submit"
            className="bg-(--color-ink) text-(--color-paper) px-5 py-2 font-mono text-sm uppercase tracking-widest hover:bg-(--color-brass-dark) transition-colors shrink-0"
          >
            {t("addCategory")}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-(--color-debit) font-medium">{error}</p>}
      </form>

      <div className="border border-(--color-rule) bg-(--color-paper)">
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-ink-soft)">{t("noCustomCategoriesYet")}</p>
          </div>
        ) : (
          <>
            {expenseCategories.length > 0 && (
              <CategoryGroup label={t("debit")} items={expenseCategories} onDelete={handleDelete} t={t} />
            )}
            {incomeCategories.length > 0 && (
              <CategoryGroup label={t("credit")} items={incomeCategories} onDelete={handleDelete} t={t} />
            )}
          </>
        )}
      </div>
      <p className="text-xs text-(--color-ink-soft)">{t("categoriesHint")}</p>
    </div>
  );
}

function CategoryGroup({ label, items, onDelete, t }) {
  return (
    <div>
      <p className="px-4 sm:px-5 pt-3 pb-1 font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft)">
        {label}
      </p>
      <ul>
        {items.map((c, index) => (
          <li
            key={c.id}
            className="stagger-row flex items-center justify-between gap-3 border-b border-(--color-rule) last:border-b-0 px-4 sm:px-5 py-2.5 group"
            style={{ "--i": Math.min(index, 14) }}
          >
            <span className="text-sm">{c.name}</span>
            <button
              onClick={() => onDelete(c.id)}
              aria-label={t("deleteCategoryAria")}
              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-(--color-ink-soft) hover:text-(--color-debit) text-xs transition-opacity shrink-0"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
