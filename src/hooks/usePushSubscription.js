import { useState, useEffect, useCallback } from "react";
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from "../lib/push";

export function usePushSubscription(userId) {
  const supported = isPushSupported();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supported) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getExistingSubscription()
      .then((sub) => {
        if (!cancelled) setSubscribed(Boolean(sub));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    try {
      await subscribeToPush(userId);
      setSubscribed(true);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, subscribed, loading, subscribe, unsubscribe };
}
