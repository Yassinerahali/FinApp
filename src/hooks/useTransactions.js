import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setTransactions(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addTransaction = useCallback(
    async (entry) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...entry, user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setTransactions((prev) => [data, ...prev]);
      }
    },
    [userId]
  );

  const updateTransaction = useCallback(async (id, patch) => {
    const { data, error } = await supabase
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
    }
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const replaceAllTransactions = useCallback(
    async (next) => {
      await supabase.from("transactions").delete().eq("user_id", userId);
      const rows = (Array.isArray(next) ? next : []).map(
        ({ id, ...rest }) => ({ ...rest, user_id: userId })
      );
      if (rows.length > 0) {
        const { data } = await supabase.from("transactions").insert(rows).select();
        setTransactions(data || []);
      } else {
        setTransactions([]);
      }
    },
    [userId]
  );

  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) =>
        b.date === a.date ? 0 : b.date > a.date ? 1 : -1
      ),
    [transactions]
  );

  return {
    transactions: sorted,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    replaceAllTransactions,
  };
}
