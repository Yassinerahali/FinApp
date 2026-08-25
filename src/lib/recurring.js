const KEY = "ledger:recurring:v1";

export function loadRecurringRules() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecurringRules(rules) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rules));
  } catch {
    // storage unavailable — fail silently
  }
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isoFor(year, monthIndex, day) {
  const clampedDay = Math.min(day, daysInMonth(year, monthIndex));
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(clampedDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Given a monthly recurring rule, return every occurrence date (ISO) that
 * is due (on or before todayISO) and hasn't been generated yet.
 */
export function dueOccurrences(rule, todayISO) {
  const today = new Date(todayISO + "T00:00:00");
  const start = new Date(rule.startDate + "T00:00:00");

  let cursorYear = start.getFullYear();
  let cursorMonth = start.getMonth();

  if (rule.lastGenerated) {
    const last = new Date(rule.lastGenerated + "T00:00:00");
    cursorYear = last.getFullYear();
    cursorMonth = last.getMonth() + 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
  }

  const occurrences = [];
  // Safety cap so a bad date can't loop forever.
  for (let i = 0; i < 240; i++) {
    const candidateDate = isoFor(cursorYear, cursorMonth, rule.dayOfMonth);
    const candidate = new Date(candidateDate + "T00:00:00");
    if (candidate > today) break;
    if (candidate >= start) occurrences.push(candidateDate);

    cursorMonth += 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
  }

  return occurrences;
}

/**
 * The next upcoming due date (ISO) for a monthly rule from today —
 * independent of what's already been generated. Used for "due soon"
 * notifications, not for catch-up generation.
 */
export function nextDueDate(rule, todayISO) {
  const today = new Date(todayISO + "T00:00:00");
  let year = today.getFullYear();
  let month = today.getMonth();
  let candidateISO = isoFor(year, month, rule.dayOfMonth);
  let candidate = new Date(candidateISO + "T00:00:00");

  if (candidate < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidateISO = isoFor(year, month, rule.dayOfMonth);
  }
  return candidateISO;
}

/**
 * Every occurrence date (ISO) for a monthly rule from today through
 * toISO (inclusive) — for a forward-looking forecast, unlike
 * dueOccurrences (catch-up generation) or nextDueDate (just the single
 * next one). Reuses the same nextDueDate/isoFor logic already verified
 * elsewhere, just repeated forward until past the window.
 */
export function projectFutureOccurrences(rule, fromISO, toISO) {
  const occurrences = [];
  let cursorISO = nextDueDate(rule, fromISO);

  // Safety cap so a bad rule can't loop forever.
  for (let i = 0; i < 36; i++) {
    if (cursorISO > toISO) break;
    occurrences.push(cursorISO);

    const d = new Date(cursorISO + "T00:00:00");
    let year = d.getFullYear();
    let month = d.getMonth() + 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    cursorISO = isoFor(year, month, rule.dayOfMonth);
  }

  return occurrences;
}

/** Convert a Supabase row (snake_case) into the app's rule shape (camelCase). */
export function ruleFromDb(row) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    dayOfMonth: row.day_of_month,
    note: row.note || "",
    startDate: row.start_date,
    lastGenerated: row.last_generated,
  };
}

/** Convert an app rule (camelCase) into Supabase row columns (snake_case), without id/user_id. */
export function ruleToDb(rule) {
  return {
    type: rule.type,
    amount: rule.amount,
    category: rule.category,
    day_of_month: rule.dayOfMonth,
    note: rule.note || "",
    start_date: rule.startDate,
    last_generated: rule.lastGenerated ?? null,
  };
}
