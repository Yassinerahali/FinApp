import { useEffect, useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { formatAmount, formatDate } from "../lib/format";
import {
  amountOf,
  blankExpense,
  blankSub,
  dueInfo,
  hasSubs,
  monthLabel,
  parseAmount,
  planStatus,
  planTotals,
  stateOf,
} from "../lib/monthPlans";

const LABEL = "font-mono text-[10px] uppercase tracking-widest text-(--color-ink-soft)";
const BOX = "flex items-center gap-1 border border-(--color-rule) bg-(--color-paper) px-2 py-1 focus-within:border-(--color-ink)";

/** Keeps what's being typed as text, and reports the parsed number as you go. */
function AmountInput({ id, value, onChange, label, readOnly = false }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (value > 0 ? String(value) : "");
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={shown}
      placeholder="0.00"
      readOnly={readOnly}
      aria-label={label}
      onFocus={() => {
        if (!readOnly) setDraft(shown);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(parseAmount(e.target.value));
      }}
      onBlur={() => setDraft(null)}
      className={`w-full min-w-0 bg-transparent text-end font-mono text-sm tabular outline-none placeholder:text-(--color-rule) ${
        readOnly ? "cursor-default" : ""
      }`}
    />
  );
}

function Chevron({ open }) {
  return (
    <span aria-hidden="true" className="inline-block rtl:-scale-x-100 text-sm leading-none opacity-70">
      {open ? "▾" : "▸"}
    </span>
  );
}

function stateTint(state) {
  if (state === "done") return "bg-(--color-credit)/15";
  if (state === "partial") return "bg-(--color-brass)/20";
  return "";
}

function ExpenseItem({ expense: e, baseId, isOpen, onOpen, onToggleOpen, patch }) {
  const { t, locale } = useLanguage();
  const state = stateOf(e);
  const subs = e.subs || [];
  const due = dueInfo(e.due, state === "done");
  const paidParts = subs.filter((s) => s.done).length;

  const chipText =
    due.kind === "none"
      ? t("mcAddDueDate")
      : due.kind === "overdue"
        ? t("mcOverdue", { date: formatDate(e.due, locale) })
        : t("mcDue", { date: formatDate(e.due, locale) });
  const chipClass =
    due.kind === "overdue"
      ? "text-(--color-debit) font-medium"
      : due.kind === "none"
        ? "text-(--color-ink-soft)"
        : "text-(--color-ink) font-medium";

  const hint =
    due.kind === "none"
      ? t("mcNoDueDate")
      : due.kind === "paid"
        ? t("mcPaid")
        : due.kind === "overdue"
          ? t("mcOverdueBy", { days: due.days })
          : due.kind === "today"
            ? t("mcDueToday")
            : t("mcDueIn", { days: due.days });
  const hintClass =
    due.kind === "overdue" || due.kind === "today"
      ? "text-(--color-debit) font-medium"
      : due.kind === "paid"
        ? "text-(--color-credit) font-medium"
        : "text-(--color-ink-soft)";

  function togglePaid(checked) {
    patch(e.id, (x) => ({
      ...x,
      done: checked,
      subs: (x.subs || []).map((s) => ({ ...s, done: checked })),
    }));
  }

  function patchSub(subId, change) {
    patch(e.id, (x) => {
      const nextSubs = (x.subs || []).map((s) => (s.id === subId ? { ...s, ...change } : s));
      return { ...x, subs: nextSubs, done: nextSubs.length > 0 && nextSubs.every((s) => s.done) };
    });
  }

  function addSub() {
    patch(e.id, (x) => {
      const current = x.subs || [];
      // Splitting an expense that already has an amount keeps that amount as part 1.
      const start =
        current.length === 0 && x.amount > 0 ? [blankSub(t("mcPart1"), x.amount, Boolean(x.done))] : current;
      return { ...x, subs: [...start, blankSub(t("mcNewSub"))], done: false };
    });
  }

  function removeSub(subId) {
    patch(e.id, (x) => {
      const nextSubs = (x.subs || []).filter((s) => s.id !== subId);
      if (nextSubs.length === 0) return { ...x, subs: [], amount: 0 };
      return { ...x, subs: nextSubs, done: nextSubs.every((s) => s.done) };
    });
  }

  return (
    <li className={`border-b border-(--color-rule) last:border-b-0 ${stateTint(state)}`} data-state={state}>
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_7.5rem_1.75rem] items-center gap-2 px-1.5 py-1.5">
        <input
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = state === "partial";
          }}
          checked={state === "done"}
          onChange={(ev) => togglePaid(ev.target.checked)}
          aria-label={t("mcMarkPaid", { name: e.name })}
          className="size-4 cursor-pointer accent-(--color-credit)"
        />
        <div className="min-w-0">
          <input
            type="text"
            value={e.name}
            onChange={(ev) => patch(e.id, (x) => ({ ...x, name: ev.target.value }))}
            onFocus={onOpen}
            aria-label={t("mcExpenseName")}
            className={`w-full bg-transparent text-sm outline-none border-b border-transparent hover:border-(--color-rule) focus:border-(--color-ink) ${
              state === "done" ? "line-through text-(--color-credit)" : ""
            }`}
          />
          <div className="flex flex-wrap gap-x-3">
            <button type="button" onClick={onToggleOpen} className={`text-[11px] hover:underline ${chipClass}`}>
              {chipText}
            </button>
            <button
              type="button"
              onClick={onToggleOpen}
              className={`text-[11px] hover:underline ${
                state === "partial" ? "text-(--color-brass-dark) font-semibold" : "text-(--color-ink-soft)"
              }`}
            >
              {subs.length > 0
                ? t("mcSplitProgress", { done: paidParts, count: subs.length })
                : t("mcSplit")}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AmountInput
            id={`${baseId}-amount`}
            value={amountOf(e)}
            readOnly={hasSubs(e)}
            onChange={(n) => patch(e.id, (x) => ({ ...x, amount: n }))}
            label={t("mcAmountAria", { name: e.name })}
          />
          <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
        </div>
        <button
          type="button"
          onClick={() => patch(e.id, null)}
          aria-label={t("mcRemoveExpense", { name: e.name })}
          className="size-7 text-(--color-ink-soft) hover:text-(--color-debit)"
        >
          ×
        </button>
      </div>

      {isOpen && (
        <div className="ps-8 pe-2 pb-3 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label htmlFor={`${baseId}-due`} className={LABEL}>
              {t("mcDueDate")}
            </label>
            <input
              id={`${baseId}-due`}
              type="date"
              value={e.due || ""}
              onChange={(ev) => patch(e.id, (x) => ({ ...x, due: ev.target.value }))}
              className="border border-(--color-rule) bg-(--color-paper) px-2 py-1 font-mono text-sm tabular outline-none focus:border-(--color-ink)"
            />
            {e.due && (
              <button
                type="button"
                onClick={() => patch(e.id, (x) => ({ ...x, due: "" }))}
                className="text-xs underline text-(--color-ink-soft) hover:text-(--color-ink)"
              >
                {t("mcClear")}
              </button>
            )}
            <span className={`text-xs ${hintClass}`}>{hint}</span>
          </div>

          <div className="border-s-2 border-(--color-rule) ps-3 space-y-1.5">
            <p className={LABEL}>{t("mcSubExpenses")}</p>
            {subs.map((s) => (
              <div
                key={s.id}
                className={`grid grid-cols-[1.25rem_minmax(0,1fr)_7rem_1.75rem] items-center gap-2 ${
                  s.done ? "text-(--color-credit)" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(s.done)}
                  onChange={(ev) => patchSub(s.id, { done: ev.target.checked })}
                  aria-label={t("mcMarkPaid", { name: s.name })}
                  className="size-4 cursor-pointer accent-(--color-credit)"
                />
                <input
                  type="text"
                  value={s.name}
                  onChange={(ev) => patchSub(s.id, { name: ev.target.value })}
                  aria-label={t("mcSubName")}
                  className={`w-full min-w-0 bg-transparent text-sm outline-none border-b border-(--color-rule) focus:border-(--color-ink) py-0.5 ${
                    s.done ? "line-through" : ""
                  }`}
                />
                <div className="flex items-center gap-1">
                  <AmountInput
                    id={`${baseId}-${s.id}-amount`}
                    value={s.amount}
                    onChange={(n) => patchSub(s.id, { amount: n })}
                    label={t("mcAmountAria", { name: s.name })}
                  />
                  <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSub(s.id)}
                  aria-label={t("mcRemoveExpense", { name: s.name })}
                  className="size-7 text-(--color-ink-soft) hover:text-(--color-debit)"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addSub}
              className="text-xs underline text-(--color-ink-soft) hover:text-(--color-ink)"
            >
              {t("mcAddSub")}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function MonthCard({ plan, phase, defaultOpen = false, onChange, onDelete }) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);
  const [openExpenseId, setOpenExpenseId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!confirmingDelete) return undefined;
    const id = setTimeout(() => setConfirmingDelete(false), 3000);
    return () => clearTimeout(id);
  }, [confirmingDelete]);

  const { name, year } = monthLabel(plan.month, locale);
  const totals = planTotals(plan);
  const status = planStatus(plan, totals);
  const baseId = `mc-${plan.month}`;

  const phaseLabel = { past: t("mcPast"), current: t("mcCurrent"), upcoming: t("mcUpcoming") }[phase];
  const frame =
    phase === "current"
      ? "border-2 border-(--color-brass)"
      : phase === "upcoming"
        ? "border border-dashed border-(--color-ink-soft)"
        : "border border-(--color-rule)";
  const headBg =
    phase === "current"
      ? "bg-(--color-brass) text-(--color-paper)"
      : phase === "past"
        ? "bg-(--color-paper-bar)"
        : "";
  const statusText =
    status.kind === "short"
      ? t("mcStatusShort", { amount: formatAmount(status.amount) })
      : status.kind === "bring"
        ? t("mcStatusBring", { amount: formatAmount(status.amount) })
        : status.amount > 0
          ? t("mcStatusOkObjective", { amount: formatAmount(status.amount) })
          : t("mcStatusOk");
  const statusClass =
    status.kind === "ok"
      ? "bg-(--color-credit)/15 text-(--color-credit)"
      : "bg-(--color-debit)/15 text-(--color-debit)";
  const leftClass = totals.left < 0 ? "text-(--color-debit)" : "text-(--color-credit)";

  const set = (change) => onChange((p) => ({ ...p, ...change }));

  // patch(id, fn) changes one expense; patch(id, null) removes it.
  function patchExpense(id, fn) {
    onChange((p) => ({
      ...p,
      expenses: fn === null ? p.expenses.filter((x) => x.id !== id) : p.expenses.map((x) => (x.id === id ? fn(x) : x)),
    }));
  }

  function addExpense() {
    const created = blankExpense(t("mcNewExpense"));
    onChange((p) => ({ ...p, expenses: [...p.expenses, created] }));
    setOpenExpenseId(created.id);
  }

  return (
    <article className={`bg-(--color-paper) ${frame} ${phase === "past" ? "opacity-95" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? `${baseId}-body` : undefined}
        className="block w-full text-start"
      >
        <span className={`flex items-center justify-between gap-3 px-4 py-3 ${headBg}`}>
          <span className="font-serif text-xl font-bold tracking-tight">
            {name}
            <span className="font-mono text-xs font-normal opacity-70 ms-2">{year}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest border border-current rounded-full px-2 py-0.5 whitespace-nowrap">
              {phaseLabel}
            </span>
            <Chevron open={open} />
          </span>
        </span>
        {!open && (
          <>
            <span className="grid grid-cols-3 border-y border-(--color-rule)">
              <span className="block px-4 py-3 min-w-0">
                <span className={`block ${LABEL}`}>{t("mcExpenses")}</span>
                <span className="block font-mono text-sm tabular truncate">{formatAmount(totals.total)}</span>
              </span>
              <span className="block px-4 py-3 min-w-0 border-s border-(--color-rule)">
                <span className={`block ${LABEL}`}>{t("mcSalary")}</span>
                <span className="block font-mono text-sm tabular truncate">{formatAmount(plan.salary)}</span>
              </span>
              <span className="block px-4 py-3 min-w-0 border-s border-(--color-rule)">
                <span className={`block ${LABEL}`}>{t("mcLeftOver")}</span>
                <span className={`block font-mono text-sm tabular truncate ${leftClass}`}>
                  {formatAmount(totals.left)}
                </span>
              </span>
            </span>
            <span className={`block mx-4 my-3 px-3 py-2 text-sm font-semibold ${statusClass}`}>{statusText}</span>
          </>
        )}
      </button>

      {open && (
        <div id={`${baseId}-body`}>
          <div className="grid grid-cols-3 border-y border-(--color-rule)">
            <div className="px-4 py-3 min-w-0">
              <span className={`block ${LABEL}`}>{t("mcExpenses")}</span>
              <span className="block font-mono text-sm tabular truncate">{formatAmount(totals.total)}</span>
            </div>
            <div className="px-4 py-3 min-w-0 border-s border-(--color-rule)">
              <label htmlFor={`${baseId}-salary`} className={`block ${LABEL}`}>
                {t("mcSalary")}
              </label>
              <div className={BOX}>
                <AmountInput id={`${baseId}-salary`} value={plan.salary} onChange={(n) => set({ salary: n })} />
                <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
              </div>
            </div>
            <div className="px-4 py-3 min-w-0 border-s border-(--color-rule)">
              <span className={`block ${LABEL}`}>{t("mcLeftOver")}</span>
              <span className={`block font-mono text-sm tabular truncate ${leftClass}`}>
                {formatAmount(totals.left)}
              </span>
            </div>
          </div>

          <p className={`mx-4 my-3 px-3 py-2 text-sm font-semibold ${statusClass}`}>{statusText}</p>

          <div className="px-4 pb-3 space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-xs text-(--color-ink-soft)">
              <span>{t("mcPaidOf", { paid: totals.paidCount, count: totals.count })}</span>
              <span className="font-mono tabular">{t("mcStillToPay", { amount: formatAmount(totals.remaining) })}</span>
            </div>
            <div className="h-1.5 bg-(--color-paper-bar) overflow-hidden">
              <div
                className="h-full bg-(--color-credit) transition-all duration-500 ease-out"
                style={{ width: `${totals.total > 0 ? Math.min(100, (totals.paid / totals.total) * 100) : 0}%` }}
              />
            </div>
          </div>

          <ul className="px-2.5">
            {plan.expenses.map((e) => (
              <ExpenseItem
                key={e.id}
                expense={e}
                baseId={`${baseId}-${e.id}`}
                isOpen={openExpenseId === e.id}
                onOpen={() => setOpenExpenseId(e.id)}
                onToggleOpen={() => setOpenExpenseId((cur) => (cur === e.id ? null : e.id))}
                patch={patchExpense}
              />
            ))}
          </ul>

          <button
            type="button"
            onClick={addExpense}
            className="mx-4 mt-2 mb-3 w-[calc(100%-2rem)] border border-dashed border-(--color-rule) py-2 text-sm text-(--color-ink-soft) hover:border-(--color-ink) hover:text-(--color-ink)"
          >
            + {t("mcAddExpense")}
          </button>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-(--color-rule) px-4 py-3">
            <div className="col-span-2 space-y-1">
              <label htmlFor={`${baseId}-savings`} className={`block ${LABEL}`}>
                {t("mcSavings")}
              </label>
              <div className={BOX}>
                <AmountInput id={`${baseId}-savings`} value={plan.savings} onChange={(n) => set({ savings: n })} />
                <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
              </div>
              <p className="text-xs text-(--color-ink-soft)">{t("mcSavingsHint")}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <label htmlFor={`${baseId}-objective`} className={`block ${LABEL}`}>
                {t("mcSavingsObjective")}
              </label>
              <div className={BOX}>
                <AmountInput
                  id={`${baseId}-objective`}
                  value={plan.objective}
                  onChange={(n) => set({ objective: n })}
                />
                <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <input
                id={`${baseId}-debts-label`}
                type="text"
                value={plan.debtsLabel}
                onChange={(ev) => set({ debtsLabel: ev.target.value })}
                placeholder={t("mcMasterDebts")}
                aria-label={t("mcDebtsTitleAria")}
                className={`block w-full min-w-0 bg-transparent outline-none border-b border-dashed border-(--color-rule) focus:border-(--color-ink) placeholder:text-(--color-ink-soft) ${LABEL}`}
              />
              <div className={BOX}>
                <AmountInput
                  id={`${baseId}-debts`}
                  value={plan.debts}
                  onChange={(n) => set({ debts: n })}
                  label={plan.debtsLabel || t("mcMasterDebts")}
                />
                <span className="font-mono text-[10px] text-(--color-ink-soft)">MAD</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end px-4 pb-3">
            <button
              type="button"
              onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
              className={`text-xs underline ${
                confirmingDelete ? "text-(--color-debit) font-semibold" : "text-(--color-ink-soft) hover:text-(--color-ink)"
              }`}
            >
              {confirmingDelete ? t("mcRemoveMonthConfirm") : t("mcRemoveMonth")}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
