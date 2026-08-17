import * as XLSX from "xlsx";

/**
 * Reads a spreadsheet-ish file (real .xlsx/.xls/.csv, or the common bank
 * export trick of an HTML table saved with an .xls extension) and returns
 * a uniform { headers, rows } shape — rows as arrays of raw cell strings.
 */
export async function parseSpreadsheetFile(file) {
  const text = await peekAsText(file);
  const looksLikeHtml = /^\s*<(!doctype|html|table|div|style)/i.test(text);

  if (looksLikeHtml) {
    return parseHtmlTable(text);
  }
  return parseWithSheetJS(file);
}

async function peekAsText(file) {
  // Only need the first chunk to sniff HTML vs. binary — reading the
  // whole file as text would corrupt real binary .xlsx content.
  const slice = file.slice(0, 2000);
  return slice.text();
}

function parseHtmlTable(text) {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const table = doc.querySelector("table");
  if (!table) {
    throw new Error("No table found in this file.");
  }
  const trs = Array.from(table.querySelectorAll("tr"));
  if (trs.length === 0) {
    throw new Error("This file's table has no rows.");
  }
  const allRows = trs.map((tr) =>
    Array.from(tr.querySelectorAll("th,td")).map((cell) => cell.textContent.trim())
  );
  const headers = allRows[0];
  const rows = allRows.slice(1).filter((r) => r.some((cell) => cell !== ""));
  return { headers, rows };
}

async function parseWithSheetJS(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("This file has no sheets.");
  }
  const sheet = workbook.Sheets[firstSheetName];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
  if (grid.length === 0) {
    throw new Error("This sheet is empty.");
  }
  const headers = grid[0].map((h) => String(h).trim());
  const rows = grid.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ""));
  return { headers, rows };
}

/**
 * Parses a date string in one of a few common export formats into an ISO
 * yyyy-mm-dd string, or null if it can't be parsed.
 */
export function parseDateFlexible(raw, format = "DMY") {
  if (!raw) return null;
  const str = String(raw).trim();

  // ISO already, possibly with a time component.
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // dd/mm/yyyy, mm/dd/yyyy, or with '.' / '-' separators, optionally with
  // a trailing time (" 00:00:00") which we ignore.
  const partsMatch = str.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})/);
  if (!partsMatch) return null;
  let [, a, b, c] = partsMatch;

  let year, month, day;
  if (a.length === 4) {
    // yyyy/mm/dd
    year = a;
    month = b;
    day = c;
  } else if (format === "MDY") {
    month = a;
    day = b;
    year = c;
  } else {
    day = a;
    month = b;
    year = c;
  }
  if (year.length === 2) year = `20${year}`;
  month = month.padStart(2, "0");
  day = day.padStart(2, "0");
  if (Number(month) > 12 || Number(day) > 31) return null;
  return `${year}-${month}-${day}`;
}

/**
 * Parses an amount string that may use a comma decimal separator, a space
 * or comma thousands separator, a leading currency symbol, or parentheses
 * for negatives. Returns a number, or null if it isn't parseable.
 */
export function parseAmountFlexible(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  let str = String(raw).trim();
  if (str === "") return null;

  const isParenNegative = /^\(.*\)$/.test(str);
  str = str.replace(/[()]/g, "");
  str = str.replace(/[^\d,.\-]/g, ""); // strip currency symbols/spaces/letters
  if (str === "") return null;

  // If both , and . appear, assume the last one is the decimal separator
  // and the other is a thousands separator.
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Only a comma: treat as decimal separator (European style).
    str = str.replace(",", ".");
  }

  const value = parseFloat(str);
  if (Number.isNaN(value)) return null;
  return isParenNegative ? -value : value;
}

/**
 * Guesses sensible default column indices from header names, so most
 * bank exports need little or no manual remapping.
 */
export function guessMapping(headers) {
  const lower = headers.map((h) => h.toLowerCase());
  const find = (...needles) => lower.findIndex((h) => needles.some((n) => h.includes(n)));

  const dateCol = find("date");
  const debitCol = find("debit", "débit");
  const creditCol = find("credit", "crédit");
  const noteCol = find("label", "libell", "description", "note", "detail", "détail");
  const amountCol = find("amount", "montant");

  const hasSeparateColumns = debitCol !== -1 && creditCol !== -1;

  return {
    dateCol: dateCol !== -1 ? dateCol : 0,
    dateFormat: "DMY",
    noteCol: noteCol !== -1 ? noteCol : Math.min(headers.length - 1, 2),
    amountMode: hasSeparateColumns ? "separate" : "single",
    debitCol: debitCol !== -1 ? debitCol : 0,
    creditCol: creditCol !== -1 ? creditCol : Math.min(headers.length - 1, 1),
    amountCol: amountCol !== -1 ? amountCol : headers.length - 1,
    negativeIsExpense: true,
  };
}

/**
 * Turns raw parsed rows into transaction objects ready to insert, using
 * the column mapping chosen (or auto-guessed) in the import wizard.
 * Rows with an unparseable date, or a zero/blank amount, are skipped.
 */
export function buildImportedTransactions(rows, mapping) {
  const results = [];

  for (const row of rows) {
    const date = parseDateFlexible(row[mapping.dateCol], mapping.dateFormat);
    if (!date) continue;

    const note = mapping.noteCol !== "" && mapping.noteCol != null ? String(row[mapping.noteCol] || "").trim() : "";

    let type, amount;
    if (mapping.amountMode === "separate") {
      const debit = parseAmountFlexible(row[mapping.debitCol]) || 0;
      const credit = parseAmountFlexible(row[mapping.creditCol]) || 0;
      if (debit > 0 && credit === 0) {
        type = "expense";
        amount = debit;
      } else if (credit > 0 && debit === 0) {
        type = "income";
        amount = credit;
      } else {
        continue; // both zero, or both nonzero (unusual) — skip rather than guess
      }
    } else {
      const raw = parseAmountFlexible(row[mapping.amountCol]);
      if (raw === null || raw === 0) continue;
      const isNegative = raw < 0;
      const isExpense = mapping.negativeIsExpense ? isNegative : !isNegative;
      type = isExpense ? "expense" : "income";
      amount = Math.abs(raw);
    }

    results.push({
      date,
      type,
      amount,
      category: type === "expense" ? mapping.defaultExpenseCategory : mapping.defaultIncomeCategory,
      note,
      account_id: mapping.accountId || null,
    });
  }

  return results;
}
