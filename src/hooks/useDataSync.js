import { useState, useEffect, useRef, useCallback } from "react";
import { getSupabase, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { loadMergedFromLocalStorage, writeLocalStorage as writeLocal } from "../lib/appData.js";
import { stampWeeksWithUserId } from "../lib/weekModel.js";

/** Supabase table: one row per auth user; RLS restricts access to auth.uid() = id */
export const USER_APP_DATA_TABLE = "user_app_data";

const SAVE_DEBOUNCE_MS = 750;

function mergePayload(seedFn, payload) {
  if (!payload || typeof payload !== "object") return seedFn();
  return { ...seedFn(), ...payload };
}

/**
 * Keeps the existing localStorage document model, syncs to Supabase when the user
 * has a session (Row Level Security on `user_app_data`). Without Supabase env vars
 * or auth, behavior matches the previous sync localStorage-only flow.
 *
 * Firebase: mirror the same contract — store `payload` as a single JSON document
 * in Firestore `users/{uid}/appState` with security rules restricting to request.auth.uid.
 */
export function useDataSync({ storageKey, seed, userId: externalUserId = null }) {
  const seedFn = typeof seed === "function" ? seed : () => seed;

  const [data, setDataState] = useState(() => loadMergedFromLocalStorage(storageKey, seedFn));
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const saveTimer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const persistLocal = useCallback(
    (next) => {
      writeLocal(storageKey, next);
    },
    [storageKey]
  );

  const pushRemote = useCallback(
    async (payload) => {
      const supabase = getSupabase();
      if (!supabase) return;
      let uid = externalUserId;
      if (!uid) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        uid = session?.user?.id;
      }
      if (!uid) return;

      setSaving(true);
      setSyncError(null);
      try {
        const row = {
          id: uid,
          payload,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from(USER_APP_DATA_TABLE).upsert(row, { onConflict: "id" });
        if (error) {
          console.error("[useDataSync] upsert failed:", error);
          setSyncError(error.message);
        }
      } catch (err) {
        console.error("[useDataSync] push exception:", err);
        setSyncError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [externalUserId]
  );

  const scheduleRemoteSave = useCallback(
    (payload) => {
      const supabase = getSupabase();
      if (!supabase) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        pushRemote(payload);
      }, SAVE_DEBOUNCE_MS);
    },
    [pushRemote]
  );

  const pullRemoteForUser = useCallback(
    async (userId) => {
      const supabase = getSupabase();
      if (!supabase || !userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setSyncError(null);

      // Safeguard for slow/failing Supabase connections
      const timeout = setTimeout(() => {
        setLoading(false);
        setSyncError("Supabase connection timed out. Using local data fallback.");
      }, 7000);

      try {
        const { data: row, error } = await supabase
          .from(USER_APP_DATA_TABLE)
          .select("payload, updated_at")
          .eq("id", userId)
          .maybeSingle();

        clearTimeout(timeout);

        if (error) {
          console.error("[useDataSync] fetch failed:", error);
          setSyncError(error.message);
          setLoading(false);
          return;
        }

        if (row?.payload && Object.keys(row.payload).length > 0) {
          const merged = mergePayload(seedFn, row.payload);
          merged.weeks = stampWeeksWithUserId(merged.weeks || [], userId);
          merged.user = { ...merged.user, supabaseUid: userId };
          setDataState(merged);
          persistLocal(merged);
        } else {
          // No cloud row yet: never reuse another account's in-memory state — load this user's local slot or seed.
          const local = loadMergedFromLocalStorage(storageKey, seedFn);
          const weeks = stampWeeksWithUserId(local.weeks || [], userId);
          const next = {
            ...local,
            weeks,
            user: { ...local.user, supabaseUid: userId },
          };
          setDataState(next);
          persistLocal(next);
          scheduleRemoteSave(next);
        }
      } catch (err) {
        clearTimeout(timeout);
        console.error("[useDataSync] pull exception:", err);
        setSyncError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [persistLocal, seedFn, scheduleRemoteSave, storageKey]
  );

  // When the storage key changes (e.g. user signs in), load that user's local cache — not a shared bucket.
  useEffect(() => {
    setDataState(loadMergedFromLocalStorage(storageKey, seedFn));
    setSyncError(null);
  }, [storageKey, seedFn]);

  // Initial load driven by external user id (from useSupabaseAuth) to avoid duplicate auth listeners.
  useEffect(() => {
    const supabase = getSupabase();
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }
    if (!externalUserId) {
      // Not signed in yet; use local data only.
      setLoading(false);
      return;
    }
    pullRemoteForUser(externalUserId);
  }, [externalUserId, pullRemoteForUser]);

  const setData = useCallback(
    (fn) => {
      setDataState((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        persistLocal(next);
        scheduleRemoteSave(next);
        return next;
      });
    },
    [persistLocal, scheduleRemoteSave]
  );

  const resetToSeed = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const fresh = seedFn();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setDataState(fresh);
    writeLocal(storageKey, fresh);
    if (externalUserId) {
      pushRemote(fresh);
    }
    setSyncError(null);
  }, [seedFn, storageKey]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  return {
    data,
    setData,
    loading,
    saving,
    syncError,
    resetToSeed,
    /** Flush pending debounced save (e.g. before unload) */
    flushRemote: () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      return pushRemote(dataRef.current);
    },
  };
}
