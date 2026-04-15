import { createClient } from "@supabase/supabase-js";

let client;

/**
 * Singleton Supabase client (anon key only — never put the service role key in the frontend).
 * Returns null when env vars are missing so the app runs in local-only mode.
 */
export function getSupabase() {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
  
  // Basic URL validation to prevent "Failed to fetch" on malformed strings
  const isValidUrl = (str) => {
    try {
      const u = new URL(str);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (!url || !anon || !isValidUrl(url)) {
    client = null;
    return client;
  }
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}

export function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;
  
  const isValidUrl = (str) => {
    try {
      const u = new URL(str);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  return !!(url && anon && isValidUrl(url));
}
