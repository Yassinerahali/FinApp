export function formatAmount(value) {
  const abs = Math.abs(value);
  return `${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2, numberingSystem: "latn" })} MAD`;
}

export function formatDate(iso, locale = "en-US") {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    numberingSystem: "latn",
  });
}

export function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}
