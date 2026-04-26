import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabaseClient.js";

/** Live Supabase session + user (UUID at `user.id`) for wiring journal ownership and UI. */
export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (error) {
        console.error("Supabase Session Error:", error.message);
        // If refresh token is invalid (400), sign out to clear local storage
        if (error.message.includes("Refresh Token Not Found") || error.status === 400) {
          supabase.auth.signOut();
          setSession(null);
        }
      } else {
        setSession(s);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("Supabase Auth Event:", event);
      if (event === "TOKEN_REFRESHED") {
        console.log("Supabase Token Refreshed");
      }
      if (event === "SIGNED_OUT") {
        setSession(null);
      } else {
        setSession(s);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  return {
    session,
    user,
    /** Primary key in Supabase — use on journal entries */
    userId: user?.id ?? null,
    loading,
    isSignedIn: !!user?.id,
  };
}
