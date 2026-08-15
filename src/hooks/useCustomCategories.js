import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCustomCategories(userId) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setCategories(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addCategory = useCallback(
    async (name, type) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ user_id: userId, name, type })
        .select()
        .single();
      if (!error && data) {
        setCategories((prev) => [...prev, data]);
      }
      return { data, error };
    },
    [userId]
  );

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return { error };
  }, []);

  return { categories, loading, addCategory, deleteCategory };
}
