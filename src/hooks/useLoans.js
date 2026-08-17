import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export function useLoans(userId) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const loansRef = useRef([]);
  loansRef.current = loans;

  useEffect(() => {
    if (!userId) {
      setLoans([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("loans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setLoans(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addLoan = useCallback(
    async (entry) => {
      const { data, error } = await supabase
        .from("loans")
        .insert({ ...entry, user_id: userId, remaining_amount: entry.principal_amount })
        .select()
        .single();
      if (!error && data) {
        setLoans((prev) => [...prev, data]);
      }
      return { data, error };
    },
    [userId]
  );

  const recordPayment = useCallback(async (id, amount) => {
    const loan = loansRef.current.find((l) => l.id === id);
    if (!loan) return;
    const nextAmount = Math.max(0, loan.remaining_amount - amount);
    const { data, error } = await supabase
      .from("loans")
      .update({ remaining_amount: nextAmount })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setLoans((prev) => prev.map((l) => (l.id === id ? data : l)));
    }
  }, []);

  const deleteLoan = useCallback(async (id) => {
    const { error } = await supabase.from("loans").delete().eq("id", id);
    if (!error) {
      setLoans((prev) => prev.filter((l) => l.id !== id));
    }
  }, []);

  return { loans, loading, addLoan, recordPayment, deleteLoan };
}
