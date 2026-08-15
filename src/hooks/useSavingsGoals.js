import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export function useSavingsGoals(userId) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const goalsRef = useRef([]);
  goalsRef.current = goals;

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setGoals(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addGoal = useCallback(
    async (entry) => {
      const { data, error } = await supabase
        .from("savings_goals")
        .insert({ ...entry, user_id: userId, saved_amount: 0 })
        .select()
        .single();
      if (!error && data) {
        setGoals((prev) => [...prev, data]);
      }
      return { data, error };
    },
    [userId]
  );

  const contribute = useCallback(async (id, amount) => {
    const goal = goalsRef.current.find((g) => g.id === id);
    if (!goal) return;
    const nextAmount = Math.max(0, goal.saved_amount + amount);
    const { data, error } = await supabase
      .from("savings_goals")
      .update({ saved_amount: nextAmount })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setGoals((prev) => prev.map((g) => (g.id === id ? data : g)));
    }
  }, []);

  const deleteGoal = useCallback(async (id) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (!error) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
    }
  }, []);

  return { goals, loading, addGoal, contribute, deleteGoal };
}
