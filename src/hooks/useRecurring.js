import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { dueOccurrences, ruleFromDb, ruleToDb } from "../lib/recurring";
import { todayISO } from "../lib/format";

export function useRecurring(userId, addTransaction) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasRunCatchUp = useRef(false);

  useEffect(() => {
    if (!userId) {
      setRules([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("recurring_rules")
      .select("*")
      .eq("user_id", userId)
      .then(async ({ data, error }) => {
        if (cancelled || error || !data) {
          setLoading(false);
          return;
        }
        const loadedRules = data.map(ruleFromDb);

        // Catch up on any occurrences due since we last checked.
        if (!hasRunCatchUp.current) {
          hasRunCatchUp.current = true;
          const today = todayISO();
          for (const rule of loadedRules) {
            const occurrences = dueOccurrences(rule, today);
            if (occurrences.length === 0) continue;
            for (const date of occurrences) {
              await addTransaction({
                type: rule.type,
                amount: rule.amount,
                category: rule.category,
                date,
                note: rule.note ? `${rule.note} (auto)` : "Recurring (auto)",
              });
            }
            const lastGenerated = occurrences[occurrences.length - 1];
            await supabase
              .from("recurring_rules")
              .update({ last_generated: lastGenerated })
              .eq("id", rule.id);
            rule.lastGenerated = lastGenerated;
          }
        }

        if (!cancelled) {
          setRules(loadedRules);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addRule = useCallback(
    async (entry) => {
      const { data, error } = await supabase
        .from("recurring_rules")
        .insert({ ...ruleToDb(entry), user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setRules((prev) => [ruleFromDb(data), ...prev]);
      }
    },
    [userId]
  );

  const deleteRule = useCallback(async (id) => {
    const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
    if (!error) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  const replaceAllRules = useCallback(
    async (next) => {
      await supabase.from("recurring_rules").delete().eq("user_id", userId);
      const list = Array.isArray(next) ? next : [];
      if (list.length > 0) {
        const rows = list.map((r) => ({ ...ruleToDb(r), user_id: userId }));
        const { data } = await supabase.from("recurring_rules").insert(rows).select();
        setRules((data || []).map(ruleFromDb));
      } else {
        setRules([]);
      }
    },
    [userId]
  );

  return { rules, loading, addRule, deleteRule, replaceAllRules };
}
