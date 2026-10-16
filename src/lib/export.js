function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsCSV(transactions, accountsById = {}) {
  const header = ["date", "type", "category", "account", "currency", "amount", "note"];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    (t.account_id && accountsById[t.account_id]?.name) || "",
    (t.account_id && accountsById[t.account_id]?.currency) || "MAD",
    t.amount,
    t.note || "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `ledger-transactions-${today}.csv`, "text/csv;charset=utf-8;");
}

// For files an admin will open in Excel/Sheets: names and emails are typed
// by users, so a value like "=HYPERLINK(...)" must not be run as a
// formula. Text cells starting with = + - @ (or a tab/CR) get a leading
// apostrophe; real numbers are passed through untouched.
function csvSafeText(value) {
  const str = String(value ?? "");
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

export function usersToCSV(users) {
  const header = [
    "first_name",
    "last_name",
    "email",
    "joined",
    "last_sign_in",
    "balance_mad",
    "balance_eur",
    "balance_usd",
    "transactions",
    "accounts",
    "last_transaction",
  ];
  const day = (iso) => (iso ? String(iso).slice(0, 10) : "");
  const rows = users.map((u) => [
    csvSafeText(u.first_name),
    csvSafeText(u.last_name),
    csvSafeText(u.email),
    day(u.created_at),
    day(u.last_sign_in_at),
    Number(u.balance_mad) || 0,
    Number(u.balance_eur) || 0,
    Number(u.balance_usd) || 0,
    Number(u.tx_count) || 0,
    Number(u.account_count) || 0,
    day(u.last_tx_date),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell).replace(/\r/g, " ")).join(","))
    .join("\n");
}

export function exportUsersCSV(users) {
  const today = new Date().toISOString().slice(0, 10);
  // Leading BOM so Excel reads accents and Arabic names as UTF-8.
  downloadBlob("\uFEFF" + usersToCSV(users), `choumchoum-users-${today}.csv`, "text/csv;charset=utf-8;");
}

export function exportFullBackup({ transactions, budgets, recurringRules }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    transactions,
    budgets,
    recurringRules,
  };
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `ledger-backup-${today}.json`,
    "application/json;charset=utf-8;"
  );
}

export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !Array.isArray(data.transactions)) {
          reject(new Error("This doesn't look like a Ledger backup file."));
          return;
        }
        resolve({
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          budgets: typeof data.budgets === "object" && data.budgets ? data.budgets : {},
          recurringRules: Array.isArray(data.recurringRules) ? data.recurringRules : [],
        });
      } catch {
        reject(new Error("Couldn't read that file as valid JSON."));
      }
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsText(file);
  });
}
