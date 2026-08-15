import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAccounts(userId, defaultName) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    async function load() {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (!error && data && data.length === 0) {
        // First time this user has visited the Ledger tab — give them a
        // default account so the rest of the UI has something to attach to.
        const { data: created } = await supabase
          .from("accounts")
          .insert({ user_id: userId, name: defaultName, kind: "cash" })
          .select()
          .single();
        if (!cancelled && created) {
          setAccounts([created]);
          setLoading(false);
          return;
        }
      }

      if (!error && data) setAccounts(data);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const addAccount = useCallback(
    async (name, kind) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({ user_id: userId, name, kind })
        .select()
        .single();
      if (!error && data) {
        setAccounts((prev) => [...prev, data]);
      }
      return { data, error };
    },
    [userId]
  );

  const renameAccount = useCallback(async (id, name) => {
    const { data, error } = await supabase
      .from("accounts")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setAccounts((prev) => prev.map((a) => (a.id === id ? data : a)));
    }
  }, []);

  const deleteAccount = useCallback(async (id) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (!error) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    }
    return { error };
  }, []);

  return { accounts, loading, addAccount, renameAccount, deleteAccount };
}
