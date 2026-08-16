import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, { firstName, lastName } = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || "",
          last_name: lastName || "",
        },
      },
    });
    if (error) throw error;
    // If email confirmation is off, signUp returns an active session
    // immediately — useful upstream to know whether an avatar can be
    // uploaded right away (needs a session for storage RLS) or only
    // after the user later confirms + signs in.
    return { hasSession: Boolean(data.session), userId: data.user?.id };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setRecoveryMode(false);
  }, []);

  const updateProfile = useCallback(async ({ firstName, lastName }) => {
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName || "", last_name: lastName || "" },
    });
    return { error };
  }, []);

  const uploadAvatar = useCallback(async (file, userId) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError };

    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
    // Cache-bust so a changed photo shows immediately instead of the old
    // cached image at the same URL.
    const avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });
    return { error: updateError, avatarUrl };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
    recoveryMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
  };
}
