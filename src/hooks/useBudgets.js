import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useBudgets(userId) {
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBudgets({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const map = {};
          for (const row of data) map[row.category] = row.monthly_limit;
          setBudgets(map);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const setBudget = useCallback(
    async (categoryId, limit) => {
      if (!limit || limit <= 0) {
        await supabase.from("budgets").delete().eq("user_id", userId).eq("category", categoryId);
        setBudgets((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          return next;
        });
        return;
      }
      const { error } = await supabase
        .from("budgets")
        .upsert({ user_id: userId, category: categoryId, monthly_limit: limit });
      if (!error) {
        setBudgets((prev) => ({ ...prev, [categoryId]: limit }));
      }
    },
    [userId]
  );

  const replaceAllBudgets = useCallback(
    async (next) => {
      await supabase.from("budgets").delete().eq("user_id", userId);
      const entries = Object.entries(typeof next === "object" && next ? next : {});
      if (entries.length > 0) {
        const rows = entries.map(([category, monthly_limit]) => ({
          user_id: userId,
          category,
          monthly_limit,
        }));
        await supabase.from("budgets").insert(rows);
      }
      setBudgets(typeof next === "object" && next ? next : {});
    },
    [userId]
  );

  return { budgets, loading, setBudget, replaceAllBudgets };
}
