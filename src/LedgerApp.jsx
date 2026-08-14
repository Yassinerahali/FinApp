import { useMemo, useRef, useState } from "react";
import { useTransactions } from "./hooks/useTransactions";
import { useBudgets } from "./hooks/useBudgets";
import { useRecurring } from "./hooks/useRecurring";
import { exportTransactionsCSV, exportFullBackup, readBackupFile } from "./lib/export";
import { useLanguage } from "./lib/i18n/LanguageContext";
import EntryForm from "./components/EntryForm";
import LedgerTable from "./components/LedgerTable";
import BalanceSummary from "./components/BalanceSummary";
import CategoryBreakdown from "./components/CategoryBreakdown";
import BudgetPanel from "./components/BudgetPanel";
import RecurringPanel from "./components/RecurringPanel";
import TrendsChart from "./components/TrendsChart";
import LanguageSwitcher from "./components/LanguageSwitcher";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const TAB_IDS = ["ledger", "budgets", "recurring", "trends"];
const TAB_KEYS = {
  ledger: "tabLedger",
  budgets: "tabBudgets",
  recurring: "tabRecurring",
  trends: "tabTrends",
};

export default function LedgerApp({ user, signOut }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("ledger");
  const [editingId, setEditingId] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const fileInputRef = useRef(null);
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    replaceAllTransactions,
  } = useTransactions(user.id);
  const { budgets, setBudget, replaceAllBudgets } = useBudgets(user.id);
  const { rules, addRule, deleteRule, replaceAllRules } = useRecurring(user.id, addTransaction);

  const monthKey = currentMonthKey();
  const monthTransactions = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(monthKey)),
    [transactions, monthKey]
  );

  const { income, expense } = useMemo(() => {
    return monthTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [monthTransactions]);

  const editingTransaction = editingId ? transactions.find((tx) => tx.id === editingId) : null;

  function handleSaveEdit(id, entry) {
    updateTransaction(id, entry);
    setEditingId(null);
  }

  function handleDelete(id) {
    if (editingId === id) setEditingId(null);
    deleteTransaction(id);
  }

  function handleRestoreClick() {
    setRestoreError("");
    fileInputRef.current?.click();
  }

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const data = await readBackupFile(file);
      const confirmed = window.confirm(
        t("restoreConfirm", { count: data.transactions.length })
      );
      if (!confirmed) return;

      await replaceAllTransactions(data.transactions);
      await replaceAllBudgets(data.budgets);
      await replaceAllRules(data.recurringRules);
      setEditingId(null);
      setRestoreError("");
    } catch (err) {
      setRestoreError(err.message || t("restoreGenericError"));
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-(--color-ink) px-5 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
            {t("appName")}
          </h1>
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            <button
              onClick={() => exportTransactionsCSV(transactions)}
              className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("exportCsv")}
            </button>
            <button
              onClick={() => exportFullBackup({ transactions, budgets, recurringRules: rules })}
              className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("backupJson")}
            </button>
            <button
              onClick={handleRestoreClick}
              className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-ink) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("restoreBackup")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <span className="hidden sm:inline text-(--color-rule)">|</span>
            <span className="hidden sm:inline font-mono text-[11px] text-(--color-ink-soft) truncate max-w-[10rem]" dir="ltr">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="font-mono text-[11px] uppercase tracking-widest text-(--color-ink-soft) hover:text-(--color-debit) underline decoration-(--color-rule) underline-offset-4"
            >
              {t("signOut")}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
        {restoreError && (
          <div className="max-w-5xl mx-auto pt-3">
            <p className="text-xs text-(--color-debit)">{restoreError}</p>
          </div>
        )}
        <nav className="max-w-5xl mx-auto flex gap-1 mt-5 -mb-6 overflow-x-auto">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 font-mono text-xs uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${
                tab === id
                  ? "border-(--color-brass) text-(--color-ink)"
                  : "border-transparent text-(--color-ink-soft) hover:text-(--color-ink)"
              }`}
            >
              {t(TAB_KEYS[id])}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-8">
        {tab === "ledger" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
            <div className="space-y-6 lg:sticky lg:top-8">
              <EntryForm
                onAdd={addTransaction}
                editing={editingTransaction}
                onSave={handleSaveEdit}
                onCancelEdit={() => setEditingId(null)}
              />
              <BalanceSummary income={income} expense={expense} />
              <CategoryBreakdown transactions={monthTransactions} />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold tracking-tight mb-3">
                {t("allEntries")}
              </h2>
              <LedgerTable
                transactions={transactions}
                onDelete={handleDelete}
                onEdit={(tx) => setEditingId(tx.id)}
              />
            </div>
          </div>
        )}

        {tab === "budgets" && (
          <div className="max-w-xl">
            <BudgetPanel
              budgets={budgets}
              setBudget={setBudget}
              monthTransactions={monthTransactions}
            />
          </div>
        )}

        {tab === "recurring" && (
          <div className="max-w-xl">
            <RecurringPanel rules={rules} addRule={addRule} deleteRule={deleteRule} />
          </div>
        )}

        {tab === "trends" && (
          <div className="max-w-3xl">
            <TrendsChart transactions={transactions} months={6} />
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-xs text-(--color-ink-soft)">
        {t("signedInAs", { email: user.email })}
      </footer>
    </div>
  );
}
