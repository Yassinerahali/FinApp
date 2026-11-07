import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useTransfers(userId) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransfers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("transfers")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setTransfers(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // One insert = one row = both sides of the move, so a transfer can
  // never be saved half-way. Local state only updates once the database
  // confirms, so the balances on screen always match what's stored.
  const addTransfer = useCallback(
    async (entry) => {
      const { data, error } = await supabase
        .from("transfers")
        .insert({ ...entry, user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setTransfers((prev) => [data, ...prev]);
      }
      return { data, error };
    },
    [userId]
  );

  const deleteTransfer = useCallback(async (id) => {
    const { error } = await supabase.from("transfers").delete().eq("id", id);
    if (!error) {
      setTransfers((prev) => prev.filter((t) => t.id !== id));
    }
    return { error };
  }, []);

  return { transfers, loading, addTransfer, deleteTransfer };
}
