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
  const header = ["date", "type", "category", "account", "amount", "note"];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    (t.account_id && accountsById[t.account_id]) || "",
    t.amount,
    t.note || "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(csv, `ledger-transactions-${today}.csv`, "text/csv;charset=utf-8;");
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
