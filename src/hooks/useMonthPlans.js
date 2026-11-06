import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { rowToPlan, planToRow, planFrom, nextMonthKey, currentMonthKey } from "../lib/monthPlans";

// Edits are applied on screen straight away and written to Supabase once
// typing pauses, so a keystroke in an amount field doesn't cost a request.
const SAVE_DELAY_MS = 700;

const byMonth = (a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0);

export function useMonthPlans(userId) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const plansRef = useRef([]);
  plansRef.current = plans;
  const timers = useRef({});

  useEffect(() => {
    if (!userId) {
      setPlans([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("month_plans")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setSaveError(true);
        else if (data) setPlans(data.map(rowToPlan));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (month) => {
      clearTimeout(timers.current[month]);
      delete timers.current[month];
      const plan = plansRef.current.find((p) => p.month === month);
      if (!plan || !userId) return;
      const { error } = await supabase
        .from("month_plans")
        .upsert(planToRow(plan, userId), { onConflict: "user_id,month" });
      setSaveError(Boolean(error));
    },
    [userId]
  );

  // Don't lose an edit made in the last moments before leaving the page.
  useEffect(() => {
    const flush = () => {
      for (const month of Object.keys(timers.current)) persist(month);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persist]);

  /** updater receives the current plan and returns the changed plan. */
  const updatePlan = useCallback(
    (month, updater) => {
      setPlans((prev) => prev.map((p) => (p.month === month ? updater(p) : p)));
      clearTimeout(timers.current[month]);
      timers.current[month] = setTimeout(() => persist(month), SAVE_DELAY_MS);
    },
    [persist]
  );

  /** Creates the month after the latest one (or this month if there are none). */
  const addMonth = useCallback(async () => {
    const list = plansRef.current;
    const last = list[list.length - 1];
    const month = last ? nextMonthKey(last.month) : currentMonthKey();
    if (list.some((p) => p.month === month)) return month;
    const next = [...list, planFrom(last, month)].sort(byMonth);
    // Update the ref too, since persist reads it before React re-renders.
    plansRef.current = next;
    setPlans(next);
    await persist(month);
    return month;
  }, [persist]);

  const deleteMonth = useCallback(
    async (month) => {
      clearTimeout(timers.current[month]);
      delete timers.current[month];
      const { error } = await supabase.from("month_plans").delete().eq("user_id", userId).eq("month", month);
      if (!error) setPlans((prev) => prev.filter((p) => p.month !== month));
      setSaveError(Boolean(error));
    },
    [userId]
  );

  return { plans, loading, saveError, updatePlan, addMonth, deleteMonth };
}
