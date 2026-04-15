import { useState, useEffect, useCallback } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { C } from "../../theme/colors.js";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabaseClient.js";
import { Logo, H, Btn } from "../ui/Primitives.jsx";

/**
 * Email/password sign-up & sign-in plus Google OAuth.
 * On success calls `onAuthSuccess` with stable user id (UUID) for linking app data.
 */
export function SupabaseAuthForm({ onAuthSuccess, onDevBypass }) {
  const [mode, setMode] = useState("options"); // options | email
  const [tab, setTab] = useState("login"); // signup | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const supabase = getSupabase();
  const configured = isSupabaseConfigured() && supabase;

  const emitSuccess = useCallback(
    (session, isSignUp = false) => {
      const u = session.user;
      onAuthSuccess({
        userId: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        method: u.app_metadata?.provider === "google" ? "google" : u.email ? "email" : "oauth",
        isSignUp,
      });
    },
    [onAuthSuccess]
  );

  useEffect(() => {
    if (!configured || !supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) emitSuccess(session);
    });
  }, [configured, supabase, emitSuccess]);

  async function handleEmailSubmit() {
    setErr("");
    setInfo("");
    if (!email.trim() || !password) {
      setErr("Please enter email and password.");
      return;
    }
    if (tab === "signup" && password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading("email");
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          emitSuccess(data.session, true);
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) emitSuccess(data.session, false);
      }
    } catch (e) {
      setErr(e.message || "Authentication failed.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setErr("");
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (e) {
      setErr(e.message || "Google sign-in failed.");
      setLoading(null);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "transparent",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    color: "#111827",
    fontSize: 15,
    padding: "12px 16px 12px 44px",
    outline: "none",
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    transition: "all 0.2s ease",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "#6B7280",
    letterSpacing: "0.05em",
    marginBottom: 8,
    display: "block",
    textTransform: "uppercase",
  };

  if (!configured) {
    return (
      <div className="fadein" style={{ minHeight: "100vh", background: "#F9F9F7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <H size={24} style={{ marginBottom: 12, fontFamily: "'Cormorant Garamond', serif" }}>
            Supabase not configured
          </H>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Add <code style={{ color: C.sunrise }}>VITE_SUPABASE_URL</code> and <code style={{ color: C.sunrise }}>VITE_SUPABASE_ANON_KEY</code> to your <code style={{ color: C.gold }}>.env</code> file, then restart the dev server.
          </p>
          {onDevBypass && (
            <Btn full onClick={onDevBypass} style={{ padding: "14px" }}>
              Continue offline (local data only)
            </Btn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fadein" style={{ height: "100vh", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 540 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ 
            fontFamily: "'Cormorant Garamond', serif", 
            fontSize: 42, 
            fontWeight: 700, 
            color: "#0F172A", 
            marginBottom: 8,
            letterSpacing: "-0.02em"
          }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color: "#6B7280", fontSize: 16, fontWeight: 500 }}>
            {tab === "login" ? "Sign in to continue your journey" : "Join us to start your journey"}
          </p>
        </div>

        <div className="rise">
          {/* Email Field */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>EMAIL ADDRESS</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} color="#9CA3AF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                type="email" 
                style={inputStyle} 
                autoComplete="email" 
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={labelStyle}>PASSWORD</label>
              {tab === "login" && (
                <button type="button" style={{ background: "none", border: "none", color: "#14532D", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#9CA3AF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"} 
                style={{ ...inputStyle, paddingRight: 44 }} 
                autoComplete={tab === "signup" ? "new-password" : "current-password"} 
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
              >
                {showPassword ? <EyeOff size={18} color="#9CA3AF" /> : <Eye size={18} color="#9CA3AF" />}
              </button>
            </div>
          </div>

          {tab === "signup" && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={{ position: "relative" }}>
                <Lock size={18} color="#9CA3AF" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  value={confirm} 
                  onChange={(e) => setConfirm(e.target.value)} 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                  style={inputStyle} 
                  autoComplete="new-password" 
                />
              </div>
            </div>
          )}

          {err ? <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 16, textAlign: "center", fontWeight: 500 }}>{err}</p> : null}
          {info ? <p style={{ color: "#10B981", fontSize: 13, marginBottom: 16, textAlign: "center", fontWeight: 500 }}>{info}</p> : null}

          <button 
            type="button" 
            onClick={handleEmailSubmit} 
            disabled={!!loading}
            className="tap"
            style={{ 
              width: "100%", 
              background: "#14532D", 
              color: "#fff", 
              border: "none", 
              borderRadius: 12, 
              padding: "14px", 
              fontSize: 16, 
              fontWeight: 700, 
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(20, 83, 45, 0.15)",
              marginBottom: 24
            }}
          >
            {loading === "email" ? (
              <span style={{ width: 20, height: 20, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            ) : (
              <>
                {tab === "signup" ? "Create account" : "Sign in"}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          {/* Social Login Option (Google) */}
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <button 
              type="button" 
              onClick={handleGoogle} 
              disabled={!!loading} 
              className="tap" 
              style={{ 
                width: "100%", 
                background: "transparent", 
                border: "1px solid #E5E7EB", 
                borderRadius: 12, 
                padding: "12px 20px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: 12, 
                cursor: loading ? "wait" : "pointer",
                color: "#374151",
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <svg width={18} height={18} viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6B7280", fontSize: 14, fontWeight: 500 }}>
              {tab === "login" ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => {
                  setTab(tab === "login" ? "signup" : "login");
                  setErr("");
                  setInfo("");
                }}
                style={{ background: "none", border: "none", color: "#14532D", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 14 }}
              >
                {tab === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
