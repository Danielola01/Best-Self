import { useState, useEffect, useCallback, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { C } from "../../theme/colors.js";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabaseClient.js";
import { Logo } from "../ui/Primitives.jsx";

const GOLD = "#D1AF33";
const CREAM = "#FDFBF7";
const DARK_INDIGO = "#0B0E1C";

/**
 * Social Login component.
 */
function SocialLogins({ mode = "signin", onGoogle, loading }) {
  const btnStyle = {
    width: "100%",
    background: "white",
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
    fontWeight: 600,
    transition: "all 0.2s"
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
        Or
      </p>
      <button 
        className="tap" 
        style={btnStyle} 
        onClick={onGoogle}
        disabled={!!loading}
      >
        <svg width={20} height={20} viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {mode === "signin" ? "Log in with Google" : "Sign up with Google"}
      </button>
    </div>
  );
}

/**
 * Email/password sign-up & sign-in plus Google OAuth.
 */
export function SupabaseAuthForm({ onAuthSuccess, onDevBypass }) {
  const [tab, setTab] = useState("login"); // signup | login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const googleTimerRef = useRef(null);

  const supabase = getSupabase();
  const configured = isSupabaseConfigured() && supabase;

  const emitSuccess = useCallback(
    (session, isSignUp = false) => {
      const u = session.user;
      onAuthSuccess({
        userId: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.user_metadata?.name || fullName || "",
        method: u.app_metadata?.provider === "google" ? "google" : u.email ? "email" : "oauth",
        isSignUp,
      });
    },
    [onAuthSuccess, fullName]
  );

  useEffect(() => {
    return () => {
      if (googleTimerRef.current) clearInterval(googleTimerRef.current);
    };
  }, []);

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
            data: { 
              full_name: fullName || email.split("@")[0],
              name: fullName || email.split("@")[0] 
            },
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: "offline", prompt: "consent" },
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        const authWindow = window.open(data.url, "google_auth", "width=600,height=700");
        
        if (!authWindow) {
          setErr("Popup blocked. Please allow popups for this site.");
          setLoading(null);
          return;
        }

        googleTimerRef.current = setInterval(async () => {
          if (authWindow.closed) {
            clearInterval(googleTimerRef.current);
            setLoading(null);
          }
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            clearInterval(googleTimerRef.current);
            authWindow.close();
            emitSuccess(session);
          }
        }, 1000);
      }
    } catch (e) {
      setErr(e.message || "Google sign-in failed.");
      setLoading(null);
    }
  }

  const inputGroupStyle = { marginBottom: 20 };
  const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, color: "black", marginBottom: 6, textAlign: "left" };
  const inputStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    color: "#000",
    fontSize: 15,
    padding: "20px 24px",
    outline: "none",
    fontWeight: 500
  };

  const primaryBtnStyle = {
    width: "100%",
    background: C.forest,
    color: "white",
    border: "none",
    borderRadius: 4, // Sharp corners as requested "sharp corners"
    padding: "20px",
    fontSize: 16,
    fontWeight: 800,
    cursor: loading ? "wait" : "pointer",
    marginBottom: 32,
    transition: "all 0.2s"
  };

  if (!configured) {
    return (
      <div className="fadein" style={{ minHeight: "100vh", background: "#F9F9F7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <h2 style={{ fontSize: 24, marginBottom: 12, fontFamily: "Inter, serif" }}>
            Supabase not configured
          </h2>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.
          </p>
          {onDevBypass && (
            <button className="tap" onClick={onDevBypass} style={{ ...primaryBtnStyle, borderRadius: 12 }}>
              Continue offline (local data only)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      width: "100%", 
      position: "relative", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      fontFamily: "Inter, sans-serif",
      overflow: "hidden"
    }}>
      {/* Background Image - Yoga meditative pose */}
      <img 
        src="https://www.image2url.com/r2/default/images/1776473654196-30271d68-7489-4b2c-ba7a-1a36835fa8c6.png"
        alt="Background"
        referrerPolicy="no-referrer"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
          filter: "brightness(0.95)"
        }}
      />

      <div className="rise" style={{ width: "100%", maxWidth: 480, padding: 32, textAlign: "center" }}>
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <Logo size={24} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 500, color: "black", letterSpacing: "-0.01em" }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
        </div>

        {tab === "signup" && (
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Joe Doe" 
              style={inputStyle} 
            />
          </div>
        )}

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Email</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="jamesjoe@mail.com" 
            type="email" 
            style={inputStyle} 
            autoComplete="email" 
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: "relative" }}>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"} 
              style={inputStyle} 
              autoComplete={tab === "signup" ? "new-password" : "current-password"} 
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()} 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showPassword ? <EyeOff size={18} color="#888" /> : <Eye size={18} color="#888" />}
            </button>
          </div>
        </div>

        {tab === "signup" && (
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Confirm Password</label>
            <input 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              placeholder="••••••••" 
              type={showPassword ? "text" : "password"} 
              style={inputStyle} 
              autoComplete="new-password" 
            />
          </div>
        )}

        {tab === "login" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "black", fontWeight: 600, cursor: "pointer" }}>
              <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} style={{ accentColor: DARK_INDIGO, width: 16, height: 16 }} />
              Remember me
            </label>
            <button type="button" style={{ background: "none", border: "none", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Forget password?
            </button>
          </div>
        )}

        {err && <p style={{ color: "#EF4444", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{err}</p>}
        {info && <p style={{ color: "#10B981", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{info}</p>}

        <button 
          type="button" 
          onClick={handleEmailSubmit} 
          disabled={!!loading}
          className="tap"
          style={primaryBtnStyle}
        >
          {loading === "email" ? "Loading..." : (tab === "login" ? "Log In" : "Create Account")}
        </button>

        <SocialLogins 
          mode={tab === "login" ? "signin" : "signup"} 
          onGoogle={handleGoogle}
          loading={loading === "google"}
        />

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ color: "black", fontSize: 14, fontWeight: 500 }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => {
                setTab(tab === "login" ? "signup" : "login");
                setErr("");
                setInfo("");
              }}
              style={{ background: "none", border: "none", color: GOLD, fontWeight: 900, cursor: "pointer", padding: 0, fontSize: 14 }}
            >
              {tab === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
