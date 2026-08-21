import { useMemo, useRef, useState } from "react";
import { useTransactions } from "./hooks/useTransactions";
import { useBudgets } from "./hooks/useBudgets";
import { useRecurring } from "./hooks/useRecurring";
import { useAccounts } from "./hooks/useAccounts";
import { useSavingsGoals } from "./hooks/useSavingsGoals";
import { useCustomCategories } from "./hooks/useCustomCategories";
import { useLoans } from "./hooks/useLoans";
import { DEFAULT_CATEGORIES } from "./lib/categories";
import { computeNotifications } from "./lib/notifications";
import { exportTransactionsCSV, exportFullBackup, readBackupFile } from "./lib/export";
import { useLanguage } from "./lib/i18n/LanguageContext";
import EntryForm from "./components/EntryForm";
import LedgerTable from "./components/LedgerTable";
import TransactionFilters from "./components/TransactionFilters";
import BalanceSummary from "./components/BalanceSummary";
import CategoryBreakdown from "./components/CategoryBreakdown";
import BudgetPanel from "./components/BudgetPanel";
import RecurringPanel from "./components/RecurringPanel";
import TrendsChart from "./components/TrendsChart";
import AccountsPanel from "./components/AccountsPanel";
import NetWorthSummary from "./components/NetWorthSummary";
import GoalsPanel from "./components/GoalsPanel";
import CategoriesPanel from "./components/CategoriesPanel";
import LoansPanel from "./components/LoansPanel";
import SpendingInsight from "./components/SpendingInsight";
import AssistantChat from "./components/AssistantChat";
import ImportWizard from "./components/ImportWizard";
import DataMenu from "./components/DataMenu";
import ProfileMenu from "./components/ProfileMenu";
import NotificationBell from "./components/NotificationBell";

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const EMPTY_FILTERS = { search: "", type: "all", category: "all", from: "", to: "", accountId: "all" };

const TAB_IDS = ["ledger", "budgets", "recurring", "accounts", "goals", "loans", "categories", "trends"];
const TAB_KEYS = {
  ledger: "tabLedger",
  budgets: "tabBudgets",
  recurring: "tabRecurring",
  accounts: "tabAccounts",
  goals: "tabGoals",
  loans: "tabLoans",
  categories: "tabCategories",
  trends: "tabTrends",
};

export default function LedgerApp({ user, signOut, updateProfile, uploadAvatar }) {
  const { t, catLabel } = useLanguage();
  const [tab, setTab] = useState("ledger");
  const [editingId, setEditingId] = useState(null);
  const [restoreError, setRestoreError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef(null);
  const {
    transactions,
    addTransaction,
    bulkAddTransactions,
    updateTransaction,
    deleteTransaction,
    replaceAllTransactions,
  } = useTransactions(user.id);
  const { budgets, setBudget, replaceAllBudgets } = useBudgets(user.id);
  const { rules, addRule, updateRule, deleteRule, replaceAllRules } = useRecurring(user.id, addTransaction);
  const { accounts, addAccount, renameAccount, updateOpeningBalance, deleteAccount } = useAccounts(
    user.id,
    t("defaultAccountName")
  );
  const { goals, addGoal, contribute, deleteGoal } = useSavingsGoals(user.id);
  const { categories: customCategories, addCategory, deleteCategory } = useCustomCategories(user.id);
  const { loans, addLoan, recordPayment, deleteLoan } = useLoans(user.id);

  const allCategories = useMemo(
    () => [
      ...DEFAULT_CATEGORIES,
      ...customCategories.map((c) => ({ id: c.name, type: c.type })),
    ],
    [customCategories]
  );

  const accountsById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

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

  const notifications = useMemo(
    () =>
      computeNotifications({
        budgets,
        monthTransactions,
        rules,
        loans,
        catLabel,
      }),
    [budgets, monthTransactions, rules, loans, catLabel]
  );

  const filtersActive =
    Boolean(filters.search) ||
    filters.type !== "all" ||
    filters.category !== "all" ||
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    filters.accountId !== "all";

  const filteredTransactions = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filters.type !== "all" && tx.type !== filters.type) return false;
      if (filters.category !== "all" && tx.category !== filters.category) return false;
      if (filters.accountId !== "all" && tx.account_id !== filters.accountId) return false;
      if (filters.from && tx.date < filters.from) return false;
      if (filters.to && tx.date > filters.to) return false;
      if (search) {
        const haystack = `${tx.note || ""} ${catLabel(tx.category)}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [transactions, filters, catLabel]);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight truncate">
            {t("appName")}
          </h1>
          <div className="flex items-center gap-2.5 shrink-0">
            <DataMenu
              onImport={() => setShowImport(true)}
              onExportCsv={() => exportTransactionsCSV(transactions, accountsById)}
              onBackupJson={() => exportFullBackup({ transactions, budgets, recurringRules: rules })}
              onRestoreClick={handleRestoreClick}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <NotificationBell notifications={notifications} onNavigate={setTab} />
            <ProfileMenu
              user={user}
              updateProfile={updateProfile}
              uploadAvatar={uploadAvatar}
              signOut={signOut}
            />
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

      <main key={tab} className="max-w-5xl mx-auto px-5 sm:px-8 py-8 animate-fade-in-up">
        {tab === "ledger" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start">
            <div className="space-y-6 lg:sticky lg:top-8">
              <EntryForm
                onAdd={addTransaction}
                editing={editingTransaction}
                onSave={handleSaveEdit}
                onCancelEdit={() => setEditingId(null)}
                accounts={accounts}
                defaultAccountId={accounts[0]?.id}
                categories={allCategories}
              />
              <BalanceSummary income={income} expense={expense} />
              <CategoryBreakdown transactions={monthTransactions} />
            </div>

            <div>
              <h2 className="font-serif text-lg font-semibold tracking-tight mb-3">
                {t("allEntries")}
              </h2>
              <TransactionFilters
                filters={filters}
                setFilters={setFilters}
                accounts={accounts}
                showAccountFilter={accounts.length > 1}
                categories={allCategories}
              />
              <LedgerTable
                transactions={filteredTransactions}
                onDelete={handleDelete}
                onEdit={(tx) => setEditingId(tx.id)}
                accountsById={accountsById}
                filtersActive={filtersActive}
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
              categories={allCategories}
            />
          </div>
        )}

        {tab === "recurring" && (
          <div className="max-w-xl">
            <RecurringPanel
              rules={rules}
              addRule={addRule}
              updateRule={updateRule}
              deleteRule={deleteRule}
              categories={allCategories}
            />
          </div>
        )}

        {tab === "accounts" && (
          <div className="max-w-xl space-y-6">
            <NetWorthSummary transactions={transactions} accounts={accounts} />
            <AccountsPanel
              accounts={accounts}
              addAccount={addAccount}
              renameAccount={renameAccount}
              updateOpeningBalance={updateOpeningBalance}
              deleteAccount={deleteAccount}
            />
          </div>
        )}

        {tab === "goals" && (
          <div className="max-w-xl">
            <GoalsPanel goals={goals} addGoal={addGoal} contribute={contribute} deleteGoal={deleteGoal} />
          </div>
        )}

        {tab === "loans" && (
          <div className="max-w-xl">
            <LoansPanel
              loans={loans}
              addLoan={addLoan}
              recordPayment={recordPayment}
              deleteLoan={deleteLoan}
            />
          </div>
        )}

        {tab === "categories" && (
          <div className="max-w-xl">
            <CategoriesPanel
              categories={customCategories}
              addCategory={addCategory}
              deleteCategory={deleteCategory}
            />
          </div>
        )}

        {tab === "trends" && (
          <div className="max-w-3xl space-y-6">
            <SpendingInsight transactions={transactions} months={6} />
            <TrendsChart transactions={transactions} months={6} />
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-xs text-(--color-ink-soft)">
        {t("signedInAs", { email: user.email })}
      </footer>

      {showImport && (
        <ImportWizard
          categories={allCategories}
          accounts={accounts}
          bulkAddTransactions={bulkAddTransactions}
          onClose={() => setShowImport(false)}
        />
      )}

      <AssistantChat
        transactions={transactions}
        budgets={budgets}
        goals={goals}
        loans={loans}
        accounts={accounts}
        rules={rules}
        catLabel={catLabel}
        onCreateGoal={addGoal}
      />
    </div>
  );
}
