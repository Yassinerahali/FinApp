/**
 * Shared balance maths for account-to-account transfers.
 *
 * A transfer debits `amount` from its source account and credits
 * `to_amount` (falling back to `amount`) to its destination. Because
 * each side is applied in its own account's currency, per-currency
 * totals stay correct for cross-currency transfers, and for
 * same-currency transfers the net effect on the total is exactly zero.
 *
 * Money is summed in JS floats, so every result is rounded to cents to
 * stop errors like 0.1 + 0.2 from drifting into the displayed balance.
 */

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Map of accountId -> net effect of all transfers on that account.
 * Transfers whose account was deleted (null side) are skipped for that
 * side; the surviving side keeps its effect.
 */
export function transferDeltas(accounts, transfers = []) {
  const deltas = new Map(accounts.map((a) => [a.id, 0]));
  for (const tr of transfers) {
    const sent = Number(tr.amount) || 0;
    const received = Number(tr.to_amount ?? tr.amount) || 0;
    if (tr.from_account_id && deltas.has(tr.from_account_id)) {
      deltas.set(tr.from_account_id, deltas.get(tr.from_account_id) - sent);
    }
    if (tr.to_account_id && deltas.has(tr.to_account_id)) {
      deltas.set(tr.to_account_id, deltas.get(tr.to_account_id) + received);
    }
  }
  for (const [id, value] of deltas) deltas.set(id, round2(value));
  return deltas;
}

/**
 * Map of accountId -> current balance:
 * opening balance + income - expenses + transfers in - transfers out.
 */
export function accountBalances(accounts, transactions = [], transfers = []) {
  const balances = new Map(accounts.map((a) => [a.id, a.opening_balance || 0]));
  for (const tx of transactions) {
    if (!tx.account_id || !balances.has(tx.account_id)) continue;
    const signed = tx.type === "income" ? tx.amount : -tx.amount;
    balances.set(tx.account_id, balances.get(tx.account_id) + signed);
  }
  for (const [id, delta] of transferDeltas(accounts, transfers)) {
    balances.set(id, balances.get(id) + delta);
  }
  for (const [id, value] of balances) balances.set(id, round2(value));
  return balances;
}
