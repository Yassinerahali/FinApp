const PLACEHOLDER_ID_PREFIX = "scan-";

function cents(amount) {
  return Math.round(Number(amount) * 100);
}

function matchKey(date, type, amount) {
  return `${date}|${type}|${cents(amount)}`;
}

/**
 * Flags extracted rows that look like transactions already in the ledger
 * (or already seen in an earlier screenshot of the same batch).
 *
 * Matching is one-for-one: if the pool holds one coffee for 25.00 on a given
 * day and the screenshot shows two, only the first is flagged — the second
 * is plausibly a real second purchase. Rows without a date are never
 * flagged, since there's nothing reliable to compare.
 *
 * `pool` is an array of { date, type, amount, account_id }. When
 * `accountId` is set, only pool entries from that account (or with no
 * account) count as matches, so the same amount in a different account
 * isn't treated as a duplicate.
 */
export function markDuplicates(rows, pool, accountId) {
  const counts = new Map();
  for (const tx of pool) {
    if (accountId && tx.account_id && tx.account_id !== accountId) continue;
    const key = matchKey(tx.date, tx.type, tx.amount);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return rows.map((row) => {
    if (!row.date) return { ...row, duplicate: false };
    const key = matchKey(row.date, row.type, row.amount);
    const remaining = counts.get(key) || 0;
    if (remaining > 0) {
      counts.set(key, remaining - 1);
      return { ...row, duplicate: true };
    }
    return { ...row, duplicate: false };
  });
}

/**
 * Turns freshly extracted rows into editable review rows: stable local ids,
 * a category that always exists in the user's list, and a sensible default
 * selection (duplicates and rows missing a date start unchecked).
 */
export function toReviewRows(extracted, categories, startIndex = 0) {
  const fallbackFor = (type) =>
    categories.find((c) => c.type === type && c.id === `other-${type}`)?.id ||
    categories.find((c) => c.type === type)?.id ||
    "";

  return extracted.map((row, i) => ({
    ...row,
    id: `${PLACEHOLDER_ID_PREFIX}${startIndex + i}`,
    category: row.category || fallbackFor(row.type),
    selected: !row.duplicate && Boolean(row.date),
  }));
}

/** Review rows -> the shape bulkAddTransactions expects. */
export function toTransactionInserts(reviewRows, accountId) {
  return reviewRows
    .filter((r) => r.selected && r.date && Number(r.amount) > 0)
    .map((r) => ({
      date: r.date,
      type: r.type,
      amount: Math.round(Number(r.amount) * 100) / 100,
      category: r.category,
      note: r.note || "",
      account_id: accountId || null,
    }));
}
