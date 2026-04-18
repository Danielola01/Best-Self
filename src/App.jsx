import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  BookOpen, 
  UserCircle, 
  Settings,
  LogOut,
  Package,
  ShieldCheck,
  Library,
  MapPin,
  MessageSquare,
  Target,
  Search,
  Bell,
  Mail,
  Phone,
  Users,
  Globe,
  Trash2
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar as RechartsBar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, PieChart, Pie } from "recharts";
import { C } from "./theme/colors.js";
import { Weekly } from "./pages/WeeklyJournal.jsx";
import { Logo, H, Lbl, Pill, Btn, Card, NumList } from "./components/ui/index.js";
import { Avatar } from "./components/app/AppPrimitive.jsx";
import { STORAGE_KEY, seed, storageKeyForUser } from "./lib/appData.js";
import { useDataSync } from "./hooks/useDataSync.js";
import { useViewportLayout } from "./hooks/useViewportLayout.js";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth.js";
import { SupabaseAuthForm } from "./components/auth/SupabaseAuthForm.jsx";
import { getSupabase } from "./lib/supabaseClient.js";
import { GlobalStyles } from "./components/app/GlobalStyles.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { AnnualGoals } from "./pages/AnnualGoals.jsx";
import { Goals90 } from "./pages/Goal90.jsx";
import { Identity } from "./pages/Identity.jsx";
import { Reading } from "./pages/Reading.jsx";
import { DashboardSkeleton } from "./components/dashboard/DashboardSkeleton.jsx";

/*
  BestSelf — Your 90-Day Personal Performance System
  v4 — Streaks + milestones, analytics charts, shareable week card,
       annual/monthly pricing toggle, AI goal suggestions via Claude API
*/

const GFONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

// ── Streak helpers ──
function computeStreak(weeks) {
  if (!weeks || weeks.length === 0) return 0;
  const done = weeks.filter(w => w.done).length;
  return done; // simplified: consecutive completed weeks
}
const MILESTONES = [
  { weeks: 4, label: "4-Week Warrior", color: "#60A5FA", msg: "One month of consistent action. You're building a habit." },
  { weeks: 8, label: "8-Week Champion", color: "#A78BFA", msg: "Two months in. Most people quit. You didn't." },
  { weeks: 12, label: "90-Day Legend", color: "#F4C542", msg: "You've completed a full 90-day cycle. Elite territory." },
];
function getMilestone(streak) {
  return [...MILESTONES].reverse().find(m => streak >= m.weeks) || null;
}

// ── AI suggestion helper ──
async function fetchAISuggestions(dim, existingGoals, userName) {
  try {
    const res = await fetch("/.netlify/functions/ai-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dim, existingGoals, userName })
    });
    if (!res.ok) throw new Error("AI request failed");
    return await res.json();
  } catch (err) {
    console.error("AI Fetch Error:", err);
    return [];
  }
}

// ── Quotes library — curated, no AI-generated platitudes ──
const QUOTES = [
  { q: "You are one decision away from a completely different life.", a: "Mel Robbins" },
  { q: "The secret of your future is hidden in your daily routine.", a: "Mike Murdock" },
  { q: "You don't rise to the level of your goals. You fall to the level of your systems.", a: "James Clear" },
  { q: "Your identity is not what you've done — it's what you believe you're capable of.", a: "Benjamin Hardy" },
  { q: "Stop managing your time. Start managing your energy.", a: "Tony Schwartz" },
  { q: "The biggest risk is not taking any risk.", a: "Mark Zuckerberg" },
  { q: "We are what we repeatedly do. Excellence is not an act but a habit.", a: "Aristotle" },
  { q: "Do not wait; the time will never be just right. Start where you stand.", a: "Napoleon Hill" },
  { q: "A goal without a plan is just a wish.", a: "Antoine de Saint-Exupéry" },
  { q: "The man who moves a mountain begins by carrying away small stones.", a: "Confucius" },
  { q: "Success is the sum of small efforts repeated day in and day out.", a: "Robert Collier" },
  { q: "Your future self is watching you right now through your memories.", a: "Aubrey de Grey" },
  { q: "It always seems impossible until it is done.", a: "Nelson Mandela" },
  { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
  { q: "Discipline is choosing between what you want now and what you want most.", a: "Abraham Lincoln" },
  { q: "You were born to win, but to be a winner you must plan to win.", a: "Zig Ziglar" },
  { q: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", a: "Ralph Waldo Emerson" },
  { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
  { q: "Act as if what you do makes a difference. It does.", a: "William James" },
  { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
  { q: "Twenty years from now you will be more disappointed by the things you didn't do.", a: "Mark Twain" },
  { q: "The only person you are destined to become is the person you decide to be.", a: "Ralph Waldo Emerson" },
  { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
  { q: "You miss 100% of the shots you don't take.", a: "Wayne Gretzky" },
  { q: "The harder I work, the luckier I get.", a: "Samuel Goldwyn" },
  { q: "Energy and persistence conquer all things.", a: "Benjamin Franklin" },
  { q: "Either you run the day or the day runs you.", a: "Jim Rohn" },
  { q: "The secret to getting ahead is getting started.", a: "Mark Twain" },
  { q: "I am not a product of my circumstances. I am a product of my decisions.", a: "Stephen Covey" },
  { q: "We may encounter many defeats but we must not be defeated.", a: "Maya Angelou" },
];

// ── Identity declaration library by category ──
const DECLARATIONS = {
  career: [
    "I am a world-class leader who inspires those around me.",
    "I deliver results that exceed every expectation.",
    "I am the kind of professional people trust with their biggest challenges.",
    "I operate at the highest level of my field.",
    "I bring clarity and conviction to every decision I make.",
    "I am building a legacy through my work.",
    "I attract opportunities that align with my purpose.",
    "I execute with precision and lead with courage.",
    "I am a strategic thinker who sees what others miss.",
    "I am constantly growing into the best version of my professional self.",
  ],
  faith: [
    "I am guided by purpose greater than myself.",
    "I walk in faith, not in fear.",
    "I am equipped for every challenge placed before me.",
    "I trust the process even when I cannot see the full picture.",
    "I am rooted in values that never waver.",
    "I carry peace into every room I enter.",
    "I am never alone — strength walks with me.",
    "I am called to greatness and I answer that call daily.",
    "I live with intention and gratitude.",
    "I am whole, complete, and worthy of every good thing.",
  ],
  relationships: [
    "I am a present, loving, and intentional partner.",
    "I build deep, meaningful connections with the people I love.",
    "I show up fully for my family every single day.",
    "I communicate with honesty, empathy, and courage.",
    "I am the kind of person others are better for knowing.",
    "I invest in my relationships the way I invest in my goals.",
    "I create a home filled with safety, joy, and purpose.",
    "I lead my family with love and consistency.",
    "I forgive quickly and love deeply.",
    "I am a source of strength for everyone in my circle.",
  ],
  health: [
    "I respect my body and fuel it with intention.",
    "I show up for my health even when motivation is absent.",
    "I am disciplined, strong, and physically capable.",
    "My body is a tool I sharpen daily.",
    "I prioritize rest and recovery without guilt.",
    "I am building a body that reflects my commitment to excellence.",
    "Every healthy choice I make is an act of self-respect.",
    "I am becoming stronger, leaner, and more energized every day.",
    "I honor my mental health as much as my physical health.",
    "I am the picture of vitality and strength.",
  ],
  abundance: [
    "I am a magnet for wealth, opportunity, and abundance.",
    "Money flows to me in expected and unexpected ways.",
    "I create immense value and I am richly rewarded for it.",
    "I manage my finances with wisdom and discipline.",
    "I am building generational wealth for my family.",
    "I deserve financial freedom and I am earning it.",
    "Every investment I make in myself returns multiplied.",
    "I think like an owner and I build like a visionary.",
    "Abundance is my natural state.",
    "I give generously because I live abundantly.",
  ],
};

const DECL_CATEGORIES = [
  { key: "career", label: "Career & Leadership", color: C.sunrise },
  { key: "faith", label: "Faith & Purpose", color: C.lavender },
  { key: "relationships", label: "Relationships", color: C.coral },
  { key: "health", label: "Health & Vitality", color: C.mint },
  { key: "abundance", label: "Wealth & Abundance", color: C.gold },
];

const DIMS = [
  { key: "spiritual", label: "Spiritual", color: C.lavender },
  { key: "family", label: "Family", color: C.coral },
  { key: "legacy", label: "Legacy", color: C.gold },
  { key: "health", label: "Health", color: C.mint },
  { key: "finances", label: "Finances", color: "#52D9A4" },
  { key: "career", label: "Career", color: "#60A5FA" },
  { key: "social", label: "Social Capital", color: C.flame },
  { key: "intellectual", label: "Intellectual", color: "#C4B5FD" },
  { key: "fun", label: "Fun & Adventure", color: C.gold },
];

const ONBOARD_SLIDES = [
  {
    title: "Crush Your Goals.\nEvery Single Week.",
    body: "BestSelf is a proven 90-day system that turns ambitious professionals into goal-crushing machines — one intentional week at a time.",
    cta: "Let's Go",
    accent: C.sunrise,
  },
  {
    title: "9 Dimensions.\nOne Life. Fully Aligned.",
    body: "Career, health, family, finances, spirituality — stop letting any dimension fall behind. BestSelf keeps every area of your life moving forward.",
    cta: "I'm In",
    accent: C.mint,
  },
  {
    title: "Become Who\nYou're Meant to Be.",
    body: "Your next-level identity is waiting. Rewire your beliefs, declare who you are, and show up as the highest version of yourself — starting today.",
    cta: "Build My BestSelf",
    accent: C.gold,
  },
];

// ── Trial / Subscription config ──
const TRIAL_DAYS = 14;
const PLAN_PRICE = "$59.99 / year";
const PLAN_MONTHLY = "Only $5/month";

// ── Data helpers ──
function blankGoals() { return Object.fromEntries(DIMS.map(d => [d.key, ["", ""]])); }
function trialDaysLeft(user) {
  if (user.subscribed) return Infinity;
  const start = new Date(user.trialStart);
  const elapsed = Math.floor((Date.now() - start) / 86400000);
  return Math.max(0, TRIAL_DAYS - elapsed);
}
function isLocked(user) { return trialDaysLeft(user) <= 0 && !user.subscribed; }

// GlobalStyles moved to `src/components/app/GlobalStyles.jsx`

/* ═══════════════════════════════════════════════════════════
   PRIMITIVES (Logo, H, Lbl, Pill, Btn, Card, NumList → ./components/ui)
═══════════════════════════════════════════════════════════ */
function Ring({ pct = 0, size = 80, stroke = 7, color = C.forest, children }) {
  const r = (size - stroke * 2) / 2, ci = size / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={ci} cy={ci} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        <circle cx={ci} cy={ci} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children || <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: size * .24, fontWeight: 800, color: "#111827" }}>{pct}%</span>}
      </div>
    </div>
  );
}
function Bar({ value = 0, max = 1, color = C.forest, h = 6 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return <div style={{ background: "#F3F4F6", borderRadius: 99, height: h, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.22,1,.36,1)" }} /></div>;
}
// ── SVG Icons — unique, purposeful, no emojis ──
const Icons = {
  // Home: abstract house / compass rose
  Home: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  // Annual: calendar with a star / year view
  Annual: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14l1.5 3 3-4.5-4.5 1.5L9 12l.75 3.75L12 14z" />
    </svg>
  ),
  // 90-Day: clock / arc suggesting a sprint
  Sprint: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 3.5" />
      <path d="M16.5 3.5l1 2M7.5 3.5l-1 2" />
    </svg>
  ),
  // Weekly: layered lines / journal pages
  Weekly: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
      <circle cx="17" cy="17" r="3" fill="none" />
      <path d="M16 17l.8.8 1.7-1.6" />
    </svg>
  ),
  // Identity: person silhouette with a spark / crown
  Identity: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M17 4l1-2 1 2-2-1 2-1z" strokeWidth="1.4" fill={color} opacity="0.7" />
    </svg>
  ),
  // Reading: open book
  Reading: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6s2-2 6-2 6 2 6 2v14s-2-1-6-1-6 1-6 1V6z" />
      <path d="M14 6s2-2 6-2v14s-2-1-6-1" />
      <path d="M12 6v14" />
    </svg>
  ),
  // Analytics: bar chart trend upward
  Analytics: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <rect x="4" y="12" width="3" height="8" rx="1" />
      <rect x="10.5" y="7" width="3" height="13" rx="1" />
      <rect x="17" y="3" width="3" height="17" rx="1" />
      <path d="M5.5 12l6-5 6-3" strokeDasharray="2 1" opacity="0.5" />
    </svg>
  ),
  // Checkmark for completed goals
  Check: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-5" />
    </svg>
  ),
  ArrowLeft: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
};

// ── Goal list with completion checkboxes ──
function GoalList({ items, checked, onChange, onToggle, placeholder, accentColor }) {
  const accent = accentColor || C.sunrise;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Subtle hint — shown once at top */}
      <p style={{ color: C.faint, fontSize: 10, letterSpacing: 1, marginBottom: 10, fontStyle: "italic" }}>
        Only tick a goal when it is fully complete
      </p>
      {items.map((v, i) => {
        const done = checked?.[i] || false;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}22`, transition: "opacity .2s", opacity: done ? 0.55 : 1 }}>
            {/* Number badge */}
            <div style={{ width: 22, height: 22, borderRadius: 6, background: `${accent}18`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
            </div>
            {/* Text input */}
            <input className="il"
              value={v}
              onChange={e => { const a = [...items]; a[i] = e.target.value; onChange(a); }}
              placeholder={placeholder}
              style={{ textDecoration: done ? "line-through" : "none", color: done ? C.faint : C.cream, flex: 1 }}
            />
            {/* Completion checkbox */}
            <button
              onClick={() => onToggle(i)}
              title={done ? "Mark incomplete" : "Mark as complete — only when done!"}
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0, cursor: "pointer",
                border: `1.8px solid ${done ? accent : C.faint}`,
                background: done ? accent : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .2s ease",
                boxShadow: done ? `0 0 10px ${accent}55` : "none",
              }}>
              {done && <Icons.Check size={12} color="#fff" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Divider({ style = {} }) {
  return <div style={{ height: 1, background: C.border, margin: "16px 0", ...style }} />;
}

/* ═══════════════════════════════════════════════════════════
   STREAK SHARE MODAL
═══════════════════════════════════════════════════════════ */
const STREAK_QUOTES = [
  "Small daily wins lead to giant results.",
  "Consistency is what transforms average into excellence.",
  "Focus on progress, not perfection.",
  "The best way to predict the future is to create it.",
  "You are what you repeatedly do.",
  "Discipline is the bridge between goals and accomplishment.",
  "Don't stop when you're tired, stop when you're done.",
  "Your only limit is you.",
  "Action is the foundational key to all success.",
  "Success is the sum of small efforts repeated daily."
];

function StreakShareModal({ streak, userName, milestone, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const milColor = milestone?.color || C.gold;
  const milLabel = milestone?.label || `${streak}-Week Streak`;
  
  // Pick a random quote on mount
  const quote = useMemo(() => STREAK_QUOTES[Math.floor(Math.random() * STREAK_QUOTES.length)], []);

  // Draw the share card onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;

    const draw = (bgImg = null) => {
      // Background
      ctx.fillStyle = "#080A0F";
      ctx.fillRect(0, 0, W, H);

      if (bgImg) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.drawImage(bgImg, 0, 0, W, H);
        ctx.restore();
      }

      // Radial glow top-right
      const g1 = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 600);
      g1.addColorStop(0, `${milColor}22`); g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

      // Central Glow behind number
      const g3 = ctx.createRadialGradient(W / 2, H / 2 - 40, 0, W / 2, H / 2 - 40, 500);
      g3.addColorStop(0, `${milColor}33`); g3.addColorStop(1, "transparent");
      ctx.fillStyle = g3; ctx.fillRect(0, 0, W, H);

      // Border
      ctx.strokeStyle = `${milColor}60`;
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 50, W - 100, H - 100);

      // BestSelf wordmark
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 56px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Best", 100, 140);
      ctx.fillStyle = "#22C55E";
      ctx.fillText("Self", 100 + ctx.measureText("Best").width + 4, 140);

      // Streak number
      ctx.shadowColor = milColor;
      ctx.shadowBlur = 30;
      ctx.fillStyle = milColor;
      ctx.font = "bold 340px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(streak, W / 2, H / 2 - 20);
      ctx.shadowBlur = 0;

      // WEEK STREAK label
      ctx.fillStyle = "#94A3B8";
      ctx.font = "800 48px 'Plus Jakarta Sans', sans-serif";
      ctx.letterSpacing = "16px";
      ctx.fillText("WEEK STREAK", W / 2, H / 2 + 100);

      // Milestone badge
      if (milestone) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(W / 2 - 260, H / 2 + 160, 520, 100, 50);
        ctx.fill();
        ctx.strokeStyle = `${milColor}`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = milColor;
        ctx.font = "800 40px 'Plus Jakarta Sans', sans-serif";
        ctx.letterSpacing = "4px";
        ctx.fillText(milLabel.toUpperCase(), W / 2, H / 2 + 222);
      }

      // Quote centered
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "italic 500 42px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      
      // Wrap text
      const maxWidth = 800;
      const words = quote.split(" ");
      let line = "";
      let lines = [];
      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + " ";
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      lines.forEach((l, i) => {
        ctx.fillText(l.trim(), W / 2, H - 350 + (i * 54));
      });

      // Name
      ctx.fillStyle = "#F8FAF9";
      ctx.font = "600 48px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(userName || "BestSelf User", W / 2, H - 180);

      // Tagline
      ctx.fillStyle = "#64748B";
      ctx.font = "500 32px 'Plus Jakarta Sans', sans-serif";
      ctx.letterSpacing = "1px";
      ctx.fillText("Building my best self — one day at a time", W / 2, H - 120);

      ctx.textAlign = "left";
      ctx.letterSpacing = "0px";
    };

    // Load blur image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `https://picsum.photos/seed/${streak + (new Date().getDate())}/1080/1080?blur=3`;
    img.onload = () => draw(img);
    img.onerror = () => draw();
    
    // Initial draw
    draw();
  }, [streak, milestone, userName, milColor, milLabel, quote]);

  const downloadCard = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `bestself-streak-${streak}.png`;
    a.click();
  };

  const shareText = `🔥 ${streak}-week streak on BestSelf! ${milestone ? `"${milestone.label}" unlocked.` : ""} Building my best self — 90 days at a time. #BestSelf #90DayChallenge #PersonalGrowth`;

  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://bestself.app")}&summary=${encodeURIComponent(shareText)}`, "_blank");
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  const shareInstagram = () => window.open("https://www.instagram.com", "_blank");
  const copyClipboard = () => { navigator.clipboard.writeText(shareText).catch(() => { }); setCopied(true); setTimeout(() => setCopied(false), 2200); };

  const ShareBtn = ({ onClick, label, color, icon }) => (
    <button onClick={onClick} className="tap"
      style={{ flex: 1, background: `${color}14`, border: `1px solid ${color}33`, borderRadius: 10, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", minWidth: 60 }}>
      <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
      <span style={{ color, fontSize: 9, fontWeight: 700, letterSpacing: .5 }}>{label}</span>
    </button>
  );

  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 420, background: "#000000DD", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="popin" style={{ width: "100%", maxWidth: 380, background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: "hidden" }}>

        {/* Preview card */}
        <div style={{ background: "#080A0F", position: "relative", padding: "40px 24px", textAlign: "center", borderBottom: `1px solid ${C.border}`, overflow: "hidden" }}>
          
          {/* Blur background image */}
          <div style={{ 
            position: "absolute", inset: 0, opacity: 0.4, 
            backgroundImage: `url(https://picsum.photos/seed/${streak + (new Date().getDate())}/600/600?blur=3)`,
            backgroundSize: "cover", backgroundPosition: "center"
          }} />

          <div style={{ position: "absolute", top: -20, right: -20, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle,${milColor}33,transparent 70%)` }} />
          <div style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${C.gold}22,transparent 70%)` }} />
          
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
            <Logo size={14} light />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ 
              fontFamily: "'Plus Jakarta Sans',sans-serif", 
              fontSize: 96, 
              fontWeight: 800, 
              color: milColor, 
              lineHeight: 1, 
              margin: "24px 0 8px",
              textShadow: `0 0 20px ${milColor}44`
            }}>
              {streak}
            </div>
            <p style={{ color: "#94A3B8", fontSize: 11, letterSpacing: 4, fontWeight: 800, marginBottom: 16 }}>WEEK STREAK</p>
            {milestone && (
              <div style={{ 
                display: "inline-block", 
                background: "rgba(255,255,255,0.05)", 
                border: `1px solid ${milColor}66`, 
                borderRadius: 99, 
                padding: "8px 20px" 
              }}>
                <span style={{ color: milColor, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>{milestone.label.toUpperCase()}</span>
              </div>
            )}

            {/* Dynamic Quote */}
            <p style={{ color: "#FFFFFF", fontSize: 13, fontStyle: "italic", marginTop: 24, padding: "0 20px", lineHeight: 1.5, opacity: 0.9 }}>
              "{quote}"
            </p>

            <p style={{ color: "#F8FAF9", fontSize: 12, fontWeight: 600, marginTop: 24 }}>{userName || "BestSelf User"}</p>
            <p style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Building my best self</p>
          </div>
        </div>

        {/* Share actions */}
        <div style={{ padding: "20px 18px 24px" }}>
          <p style={{ color: C.muted, fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>SHARE YOUR STREAK</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <ShareBtn onClick={shareTwitter} label="X / Twitter" color="#1DA1F2" icon="𝕏" />
            <ShareBtn onClick={shareLinkedIn} label="LinkedIn" color="#0A66C2" icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="#0A66C2"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>} />
            <ShareBtn onClick={shareWhatsApp} label="WhatsApp" color="#25D366" icon="💬" />
            <ShareBtn onClick={shareInstagram} label="Instagram" color={C.lavender} icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.lavender} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill={C.lavender} stroke="none" /></svg>} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={downloadCard} className="tap"
              style={{ width: "100%", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px", color: C.text, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download Share Card
            </button>

            <button onClick={copyClipboard} className="tap"
              style={{ width: "100%", background: copied ? `${C.mint}20` : C.card, border: `1px solid ${copied ? C.mint : C.border}`, borderRadius: 10, padding: "12px", color: copied ? C.mint : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .25s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {copied
                ? <><Icons.Check size={14} color={C.mint} /> Copied to clipboard!</>
                : <>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  Copy text to clipboard
                </>
              }
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <button onClick={onClose} style={{ width: "100%", background: "transparent", border: "none", borderTop: `1px solid ${C.border}`, color: C.muted, padding: "14px", fontSize: 13, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MILESTONE CELEBRATION MODAL
═══════════════════════════════════════════════════════════ */
function MilestoneCelebration({ milestone, onClose }) {
  if (!milestone) return null;
  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 400, background: "#000000DD", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="popin" style={{ background: `linear-gradient(135deg,${C.surface},${C.card})`, border: `2px solid ${milestone.color}55`, borderRadius: 20, padding: "40px 28px", maxWidth: 340, width: "100%", textAlign: "center", boxShadow: `0 0 60px ${milestone.color}33` }}>
        {/* Burst ring */}
        <div style={{ width: 90, height: 90, borderRadius: "50%", border: `3px solid ${milestone.color}`, background: `${milestone.color}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 0 30px ${milestone.color}44` }}>
          <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <path d="M20 5l3.5 10h10.5l-8.5 6.5 3.5 10L20 26l-9 6 3.5-10L6 16h10.5z" fill={milestone.color} opacity={0.9} />
          </svg>
        </div>
        <p style={{ color: milestone.color, fontSize: 10, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>MILESTONE UNLOCKED</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: C.cream, fontSize: 28, fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>{milestone.label}</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{milestone.msg}</p>
        <button onClick={onClose} style={{ background: `linear-gradient(135deg,${milestone.color},${C.sunrise})`, border: "none", color: "#fff", borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
          Keep Going
        </button>
      </div>
    </div>
  );
}

// Analytics moved to `src/pages/Analytics.jsx`

/* ═══════════════════════════════════════════════════════════
   PAYWALL  — annual / monthly toggle
═══════════════════════════════════════════════════════════ */
function Paywall({ user, supabaseUser, setData, onClose, authUserId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [annual, setAnnual] = useState(true);

  const ANNUAL_PRICE = "$59.99 / year";
  const ANNUAL_MONTHLY = "Only $5/month";
  const MONTHLY_PRICE = "$9.99 / month";
  const MONTHLY_NOTE = "Billed monthly · Cancel anytime";

  const subscribe = async () => {
    if (!authUserId) {
      setError("Please sign in to your account to start your subscription.");
      return;
    }
    setLoading(true);
    setError(null);
    
    // Set a safeguard timeout
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("The request is taking longer than expected. Please check your internet connection and try again.");
    }, 15000);

    try {
      const annualPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL;
      const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY;

      if (annual && (!annualPriceId || annualPriceId.trim() === "")) {
        throw new Error("Annual Price ID is not configured. Please add VITE_STRIPE_PRICE_ID_ANNUAL to your AI Studio settings.");
      }
      if (!annual && (!monthlyPriceId || monthlyPriceId.trim() === "")) {
        throw new Error("Monthly Price ID is not configured. Please add VITE_STRIPE_PRICE_ID_MONTHLY to your AI Studio settings.");
      }

      const priceId = (annual ? annualPriceId : monthlyPriceId).trim();
      const email = user.email || supabaseUser?.email || "";

      console.log("Initiating checkout session:", { priceId, userId: authUserId, email });

      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          userId: authUserId,
          userEmail: email,
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseErr) {
          // Fallback if not JSON
        }
        throw new Error(errorMsg);
      }

      const session = await response.json();
      if (session.url) {
        console.log("Redirecting to Stripe Checkout:", session.url);
        // Stripe blocks iframe embedding. Opening in a new tab is the most reliable way 
        // to escape the AI Studio sandbox.
        const win = window.open(session.url, "_blank");
        if (!win || win.closed || typeof win.closed === "undefined") {
          console.warn("Popup blocked, falling back to window.location.href");
          window.location.href = session.url;
        }
      } else {
        throw new Error("The payment server returned a successful response but no checkout URL was found.");
      }
    } catch (e) {
      clearTimeout(timeout);
      console.error("Subscription Flow Error:", e);
      setError(e.message || "An unexpected error occurred during checkout initialization.");
      setLoading(false);
    }
  };

  if (done) return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000000CC", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Card style={{ maxWidth: 360, width: "100%", textAlign: "center", padding: "40px 28px" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${C.mint}20`, border: `2px solid ${C.mint}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Icons.Check size={22} color={C.mint} />
        </div>
        <H size={24} style={{ marginBottom: 10 }}>Welcome to BestSelf Pro</H>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Your journey has no limits. All features unlocked.</p>
        <Btn full onClick={onClose}>Continue My Journey</Btn>
      </Card>
    </div>
  );

  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 300, background: "#000000DD", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="rise app-modal-sheet" style={{ background: C.surface, borderRadius: "20px 20px 0 0", border: `1px solid ${C.border}`, width: "100%", padding: "32px 24px 48px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${C.sunrise},${C.gold},${C.mint})`, borderRadius: 99, marginBottom: 28 }} />

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Logo size={20} />
          <H size={26} style={{ marginTop: 16, marginBottom: 8 }}>Unlock Your <span className="grad-text">Full Potential</span></H>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65 }}>Your free trial has ended. Continue your transformation.</p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 99, padding: 4, marginBottom: 24, position: "relative" }}>
          <button onClick={() => setAnnual(true)} className="tap"
            style={{ flex: 1, padding: "9px", borderRadius: 99, background: annual ? `linear-gradient(135deg,${C.sunrise},${C.flame})` : "transparent", border: "none", color: annual ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s", position: "relative" }}>
            Annual
            {annual && <span style={{ position: "absolute", top: -8, right: 10, background: C.mint, color: "#000", fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 99, letterSpacing: .5 }}>BEST VALUE</span>}
          </button>
          <button onClick={() => setAnnual(false)} className="tap"
            style={{ flex: 1, padding: "9px", borderRadius: 99, background: !annual ? `linear-gradient(135deg,${C.sunrise},${C.flame})` : "transparent", border: "none", color: !annual ? "#fff" : C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
            Monthly
          </button>
        </div>

        {/* Price display */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ color: C.gold, fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{annual ? ANNUAL_PRICE : MONTHLY_PRICE}</p>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{annual ? ANNUAL_MONTHLY : MONTHLY_NOTE}</p>
          {annual && <p style={{ color: C.mint, fontSize: 11, marginTop: 4, fontWeight: 600 }}>Save 40% vs monthly</p>}
        </div>

        {[
          "Unlimited weekly planning cycles",
          "Unlimited 90-day goal sets",
          "Full identity declaration library",
          "Multi-year goal tracking",
          "AI-powered goal suggestions",
          "Progress analytics & charts",
          "Priority access to new features",
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${C.mint}20`, border: `1px solid ${C.mint}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icons.Check size={10} color={C.mint} />
            </div>
            <span style={{ color: C.text, fontSize: 13 }}>{f}</span>
          </div>
        ))}

        <Divider />
        {error && (
          <div style={{ background: `${C.coral}15`, border: `1px solid ${C.coral}30`, padding: "12px 16px", borderRadius: 12, marginBottom: 16 }}>
            <p style={{ color: C.coral, fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>{error}</p>
          </div>
        )}
        <Btn full onClick={subscribe} disabled={loading} style={{ padding: "16px", fontSize: 15, marginBottom: 12 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              Connecting to Stripe...
            </div>
          ) : (annual ? "Subscribe Annual — Start Today" : "Subscribe Monthly — Start Today")}
        </Btn>
        {onClose && <button onClick={onClose} style={{ width: "100%", background: "transparent", border: "none", color: C.muted, fontSize: 12, padding: "10px", cursor: "pointer" }}>Maybe later</button>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ONBOARDING SLIDES
   Introductory quotes/slides before the form.
═══════════════════════════════════════════════════════════ */
function OnboardingSlides({ onDone }) {
  const [step, setStep] = useState(0);
  const s = ONBOARD_SLIDES[step];
  const last = step === ONBOARD_SLIDES.length - 1;

  return (
    <div key={step} style={{ height: "100vh", background: "#F8FAF9", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Logo + progress dots */}
      <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size={16} />
        <div style={{ display: "flex", gap: 6 }}>
          {ONBOARD_SLIDES.map((_, i) => (
            <div key={i} style={{ height: 3, width: i === step ? 28 : 7, borderRadius: 99, background: i <= step ? s.accent : C.faint, transition: "all .4s" }} />
          ))}
        </div>
      </div>

      {/* Decorative accent line */}
      <div style={{ margin: "20px 24px 0", height: 1, background: `linear-gradient(90deg,${s.accent}66,transparent)` }} />

      <div className="rise" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 28px 24px" }}>
        <H size={40} style={{ marginBottom: 20, whiteSpace: "pre-line", lineHeight: 1.1 }}>
          {s.title.split("\n").map((line, i) =>
            i === 1 ? <span key={i} style={{ color: s.accent }}>{line}<br /></span>
              : <span key={i}>{line}<br /></span>
          )}
        </H>
        <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.75, maxWidth: 320 }}>{s.body}</p>
      </div>

      <div style={{ padding: "0 28px 52px" }}>
        <Btn full onClick={() => { if (last) onDone(); else setStep(s => s + 1); }} style={{ padding: "17px", fontSize: 15 }}>{s.cta}</Btn>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ width: "100%", background: "transparent", border: "none", color: C.muted, padding: "12px", fontSize: 13, cursor: "pointer", marginTop: 4 }}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UNIFIED ONBOARDING FORM
   Combines demographics and role/tagline into one step.
═══════════════════════════════════════════════════════════ */
function UnifiedOnboardingForm({ authData, onDone, onBack }) {
  const [name, setName] = useState(authData?.name || "");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [err, setErr] = useState("");

  const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Nigeria", "Ghana", "Kenya", "South Africa", "India", "Germany", "France", "Brazil", "Jamaica", "Trinidad & Tobago", "Other"];
  const GENDERS = ["Man", "Woman", "Non-binary", "Prefer not to say"];

  const inp = (label, child) => (
    <div style={{ marginBottom: 20 }}>
      <p style={{ color: C.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8, fontWeight: 600 }}>{label}</p>
      {child}
    </div>
  );
  const styl = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, padding: "14px 16px", outline: "none", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "border-color 0.2s" };

  const proceed = () => {
    if (!name.trim() || !role.trim() || !phone.trim() || !gender || !dob || !country) {
      setErr("Please complete all fields to personalize your experience.");
      return;
    }
    onDone({
      name: name.trim(),
      role: role.trim(),
      email: authData?.email || "",
      phone,
      gender,
      dob,
      country,
      authMethod: authData?.method || "email",
    });
  };

  return (
    <div className="fadein" style={{ minHeight: "100vh", background: "#F8FAF9", display: "flex", flexDirection: "column", padding: "40px 20px", overflowY: "auto", position: "relative" }}>
      {onBack && (
        <button 
          onClick={onBack}
          style={{ position: "absolute", top: 24, left: 24, background: "transparent", border: "none", color: C.muted, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          className="tap"
        >
          <Icons.ArrowLeft size={16} />
          Back
        </button>
      )}
      <div style={{ maxWidth: 540, width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Logo size={20} />
          <div style={{ height: 24 }} />
          <H size={32} style={{ marginBottom: 12, lineHeight: 1.15, color: C.text }}>Tell us a little<br /><span className="grad-text">about yourself</span></H>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6 }}>Complete all fields to personalize your experience.</p>
        </div>

        <Card style={{ padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)" }}>
          {inp("YOUR NAME *", (
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={styl}
              onFocus={e => e.target.style.borderColor = C.sunrise} onBlur={e => e.target.style.borderColor = C.border} />
          ))}
          
          {inp("ROLE OR TAGLINE *", (
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Marketing Leader · Entrepreneur" style={styl}
              onFocus={e => e.target.style.borderColor = C.sunrise} onBlur={e => e.target.style.borderColor = C.border} />
          ))}

          {inp("PHONE NUMBER *", (
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" style={styl}
              onFocus={e => e.target.style.borderColor = C.sunrise} onBlur={e => e.target.style.borderColor = C.border} />
          ))}

          {inp("GENDER *", (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GENDERS.map(g => (
                <button key={g} onClick={() => setGender(gender === g ? "" : g)} className="tap"
                  style={{ padding: "10px 18px", borderRadius: 99, background: gender === g ? `${C.sunrise}15` : "transparent", border: `1px solid ${gender === g ? C.sunrise : C.border}`, color: gender === g ? C.sunrise : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
                  {g}
                </button>
              ))}
            </div>
          ))}

          {inp("DATE OF BIRTH *", (
            <input value={dob} onChange={e => setDob(e.target.value)} type="date" style={{ ...styl, colorScheme: "light" }} />
          ))}

          {inp("COUNTRY *", (
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ ...styl, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237A8099' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}>
              <option value="">Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ))}

          <div style={{ marginTop: 12 }}>
            <div style={{ background: `${C.mint}10`, border: `1px solid ${C.mint}20`, borderRadius: 10, padding: "16px", marginBottom: 24 }}>
              <p style={{ color: C.forest, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Free {TRIAL_DAYS}-Day Trial Included</p>
              <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>Full access for {TRIAL_DAYS} days. No credit card required to start.</p>
            </div>

            {err && <p style={{ color: C.coral, fontSize: 13, marginBottom: 16, fontWeight: 600, textAlign: "center" }}>{err}</p>}
            
            <Btn full onClick={proceed} style={{ padding: "18px", fontSize: 16 }}>
              Complete My Profile
            </Btn>
          </div>
        </Card>
        
        <p style={{ textAlign: "center", color: C.muted, fontSize: 12, marginTop: 32 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

// Dashboard moved to `src/pages/Dashboard.jsx`

/* ═══════════════════════════════════════════════════════════
   ANNUAL GOALS  — multi-year support
═══════════════════════════════════════════════════════════ */
// AnnualGoals moved to `src/pages/AnnualGoals.jsx`

/* ═══════════════════════════════════════════════════════════
   90-DAY GOALS  — multi-cycle support
═══════════════════════════════════════════════════════════ */
// Goals90 moved to `src/pages/Goals90.jsx`

/* ═══════════════════════════════════════════════════════════
   IDENTITY — layered declaration experience
═══════════════════════════════════════════════════════════ */
// Identity moved to `src/pages/Identity.jsx`

/* ═══════════════════════════════════════════════════════════
   READING PLAN
═══════════════════════════════════════════════════════════ */
// Reading moved to `src/pages/Reading.jsx`

/* ═══════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "home", label: "Home", Icon: LayoutDashboard },
  { id: "90day", label: "90-Day", Icon: Target },
  { id: "weekly", label: "Weekly", Icon: Calendar },
  { id: "analytics", label: "Stats", Icon: BarChart3 },
];
const ALL_PAGES = [
  { id: "home", label: "Dashboard", Icon: LayoutDashboard },
  { id: "90day", label: "90-Day Goals", Icon: Target },
  { id: "weekly", label: "Weekly Planner", Icon: Calendar },
  { id: "identity", label: "I Am Statements", Icon: UserCircle },
  { id: "reading", label: "Reading Plan", Icon: Library },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
];

function SyncSpinner({ label }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#080A0FEE", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${C.faint}`, borderTopColor: C.sunrise, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <p style={{ color: C.muted, fontSize: 13, letterSpacing: 1 }}>{label}</p>
    </div>
  );
}

export default function App() {
  const { userId: authUserId, isSignedIn, loading: authLoading, user: supabaseUser } = useSupabaseAuth();
  const requiresAuth = true; 
  const dataStorageKey = storageKeyForUser(requiresAuth && authUserId ? authUserId : null);
  const { data, setData, loading: dataLoading, saving: dataSaving, syncError, resetToSeed } = useDataSync({
    storageKey: dataStorageKey,
    seed,
    userId: authUserId,
  });
  const [authStep, setAuthStep] = useState(requiresAuth ? "auth" : "demo"); // "auth"|"demo"|"slides"|"onboard"|"done"
  const [authData, setAuthData] = useState(null);
  const [tab, setTab] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [milestone, setMilestone] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [streakShare, setStreakShare] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const prevStreakRef = useRef(null);
  const layout = useViewportLayout();

  // Keep app access tied to live auth state.
  useEffect(() => {
    if (requiresAuth && !authLoading && !isSignedIn) {
      setAuthStep(requiresAuth ? "auth" : "demo");
      setAuthData(null);
      setData((d) => ({
        ...d,
        user: {
          ...d.user,
          validated: false,
        },
      }));
    }
  }, [requiresAuth, authLoading, isSignedIn, setData]);

  // Handle OAuth popup close
  useEffect(() => {
    if (window.opener && isSignedIn) {
      // Small delay to ensure session is fully established and storage updated
      const timer = setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.error("Failed to close popup:", e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  // Check if already onboarded (re-check when data/auth load)
  useEffect(() => {
    if (requiresAuth && (!isSignedIn || authLoading || dataLoading)) return;
    
    const hasName = data.user.name && data.user.name.trim() !== "";
    
    if (hasName) {
      // Existing user with a profile -> go to dashboard if not already there
      if (authStep === "auth" || authStep === "onboard" || authStep === "slides") {
        setAuthStep("done");
      }
    } else {
      // New user or incomplete profile -> start onboarding if at auth or done
      if (authStep === "auth" || authStep === "done") {
        setAuthStep("slides");
      }
    }
  }, [data.user.name, requiresAuth, isSignedIn, authLoading, dataLoading, authStep]);

  // Mark authenticated users as validated and keep auth metadata fresh.
  useEffect(() => {
    if (!isSignedIn || !authUserId) return;
    setData((d) => ({
      ...d,
      user: {
        ...d.user,
        supabaseUid: authUserId,
        validated: true,
      },
    }));
  }, [isSignedIn, authUserId, setData]);

  // Notification generation logic
  useEffect(() => {
    if (dataLoading || !data.user.name) return;

    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday

    setData(d => {
      const existing = d.notifications || [];
      const newNotifs = [];

      // 1. Weekly Review Reminder (Sunday/Monday)
      const hasRecentWeek = (d.weeks || []).some(w => {
        const weekDate = new Date(w.date);
        const diff = (now - weekDate) / (1000 * 60 * 60 * 24);
        return diff < 7;
      });

      if ((day === 0 || day === 1) && !hasRecentWeek) {
        if (!existing.some(n => n.id === "weekly-review")) {
          newNotifs.push({
            id: "weekly-review",
            title: "Weekly Review Time",
            body: "It's time to reflect on your progress and plan your next elite week.",
            date: now.toISOString(),
            read: false
          });
        }
      }

      // 2. Identity Reminder
      if ((d.iAmCustom || []).length === 0 && !existing.some(n => n.id === "identity-reminder")) {
        newNotifs.push({
          id: "identity-reminder",
          title: "Declare Your Identity",
          body: "Elite performance starts with who you believe you are. Set your 'I Am' statements.",
          date: now.toISOString(),
          read: false
        });
      }

      // 3. Trial Ending Reminder
      const daysLeft = trialDaysLeft(d.user);
      if (daysLeft > 0 && daysLeft <= 3 && !d.user.subscribed && !existing.some(n => n.id === "trial-ending")) {
        newNotifs.push({
          id: "trial-ending",
          title: "Trial Ending Soon",
          body: `Your free trial ends in ${daysLeft} days. Upgrade to Pro to keep your momentum going!`,
          date: now.toISOString(),
          read: false
        });
      }

      if (newNotifs.length === 0) return d;
      return { ...d, notifications: [...existing, ...newNotifs] };
    });
  }, [dataLoading, data.user.name, setData]);

  // Frontend-only Stripe flow: on successful return, persist subscribed status via Supabase directly.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (!checkoutStatus) return;

    if (checkoutStatus === "cancel") {
      const next = new URL(window.location.href);
      next.searchParams.delete("checkout");
      window.history.replaceState({}, "", next.toString());
      return;
    }

    if (checkoutStatus === "success" && isSignedIn && authUserId) {
      const supabase = getSupabase();
      if (!supabase) return;

      let cancelled = false;
      const markSubscribed = async () => {
        const nowIso = new Date().toISOString();
        try {
          await supabase.from("user_profiles").upsert(
            { user_id: authUserId, subscribed: true, subscription_updated_at: nowIso },
            { onConflict: "user_id" }
          );
          await supabase.rpc("set_user_subscription_status", {
            p_user_id: authUserId,
            p_subscribed: true,
          });
          if (cancelled) return;
          setData((d) => ({ ...d, user: { ...d.user, subscribed: true } }));
          
          // Clear URL
          const next = new URL(window.location.href);
          next.searchParams.delete("checkout");
          window.history.replaceState({}, "", next.toString());
          
          // Show success message
          setSubscriptionSuccess(true);
        } catch (err) {
          console.error("Error updating subscription status:", err);
        }
      };

      markSubscribed();
      return () => { cancelled = true; };
    }
  }, [isSignedIn, authUserId, setData]);

  useEffect(() => {
    if (authStep === "done" && isLocked(data.user)) setPaywallOpen(true);
  }, [authStep]);

  useEffect(() => {
    const streak = computeStreak(data.weeks);
    const prev = prevStreakRef.current;
    if (prev !== null && streak > prev) {
      const hit = MILESTONES.find(m => m.weeks === streak);
      if (hit) setMilestone(hit);
    }
    prevStreakRef.current = streak;
  }, [data.weeks]);

  const handleAuth = useCallback((authInfo) => {
    setAuthData(authInfo);
    if (authInfo.isSignUp) {
      setAuthStep("slides");
    }
  }, []);

  // Unified onboarding complete
  const handleOnboarding = (onboardingInfo) => {
    setData(d => ({
      ...d, user: {
        ...d.user,
        name: onboardingInfo.name,
        role: onboardingInfo.role,
        email: onboardingInfo.email || d.user.email || "",
        phone: onboardingInfo.phone || "",
        gender: onboardingInfo.gender || "",
        dob: onboardingInfo.dob || "",
        country: onboardingInfo.country || "",
        authMethod: onboardingInfo.authMethod || "",
        joinDate: new Date().toISOString().slice(0, 10),
        trialStart: new Date().toISOString().slice(0, 10),
        validated: true,
      }
    }));
    setAuthStep("done");
  };

  const showPaywall = () => setPaywallOpen(true);

  // ── Render auth flow steps ──
  if (requiresAuth && authLoading) {
    return (
      <div className="app-root app-font">
        <GlobalStyles />
        <SyncSpinner label="Checking your login…" />
      </div>
    );
  }

  if (requiresAuth && !isSignedIn) {
    return (
      <div className="app-root app-font app-auth-wrap">
        <GlobalStyles />
        <SupabaseAuthForm
          onAuthSuccess={handleAuth}
          onDevBypass={() => handleAuth({ method: "offline", email: "", name: "", userId: "" })}
        />
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="app-root app-font">
        <GlobalStyles />
        {tab === "home" ? <DashboardSkeleton /> : <SyncSpinner label="Loading your data…" />}
      </div>
    );
  }

  if (authStep === "slides") {
    return (
      <div className="app-root app-font app-auth-wrap">
        <GlobalStyles />
        <OnboardingSlides onDone={() => setAuthStep("onboard")} />
      </div>
    );
  }

  if (authStep === "onboard") {
    return (
      <div className="app-root app-font app-auth-wrap">
        <GlobalStyles />
        <UnifiedOnboardingForm authData={authData} onDone={handleOnboarding} onBack={() => setAuthStep("auth")} />
      </div>
    );
  }

  if (authStep === "auth") {
    // Fallback if somehow stuck in auth step but signed in and data loaded
    return <SyncSpinner label="Finalizing..." />;
  }

  const streak = computeStreak(data.weeks);

  const pages = {
    home: <Dashboard data={data} setData={setData} showMilestone={() => setMilestone(getMilestone(streak))} onShareStreak={() => setStreakShare(true)} onNewProject={() => setConfirmReset(true)} />,
    "90day": <Goals90 data={data} setData={setData} showPaywall={showPaywall} />,
    weekly: <Weekly data={data} setData={setData} authUserId={authUserId} />,
    identity: <Identity data={data} setData={setData} />,
    reading: <Reading data={data} setData={setData} layout={layout} />,
    analytics: <Analytics data={data} onShareStreak={() => setStreakShare(true)} />,
  };

  const wideSidebarFooter = (
    <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {!data.user.subscribed && (
        <button type="button" onClick={showPaywall} className="tap"
          style={{
            width: "100%",
            background: `linear-gradient(135deg,${C.sunrise},${C.flame})`,
            border: "none",
            color: "#fff",
            padding: layout === "tablet" ? "10px 6px" : "10px 12px",
            borderRadius: 8,
            fontSize: layout === "tablet" ? 9 : 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: layout === "tablet" ? 0.3 : 0.5,
          }}>
          {layout === "tablet" ? "PRO" : "Upgrade to Pro"}
        </button>
      )}
      <button type="button" title="Start New Cycle" onClick={() => setConfirmReset(true)}
        style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, padding: layout === "tablet" ? "8px 4px" : "8px", fontSize: layout === "tablet" ? 9 : 11, cursor: "pointer", borderRadius: 6, letterSpacing: 1 }}>
        {layout === "tablet" ? "Reset" : "Start New Cycle"}
      </button>
      {isSignedIn && requiresAuth && (
        <button type="button" title="Sign out" onClick={async () => { await getSupabase().auth.signOut(); }}
          style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, color: C.coral, padding: layout === "tablet" ? "8px 4px" : "8px", fontSize: layout === "tablet" ? 9 : 11, cursor: "pointer", borderRadius: 6, letterSpacing: 1 }}>
          {layout === "tablet" ? "Logout" : "Sign out"}
        </button>
      )}
    </div>
  );

  const headerPage = ALL_PAGES.find((p) => p.id === tab) || ALL_PAGES[0];

  const ProfileModal = ({ user, onClose }) => {
    if (!user) return null;
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [editedUser, setEditedUser] = useState({ ...user });

    const handleSave = () => {
      setData(d => ({ ...d, user: { ...d.user, ...editedUser } }));
      setIsEditing(false);
    };

    const handleDeleteAccount = async () => {
      const supabase = getSupabase();
      setShowConfirmDelete(false);
      setIsDeleting(true);
      try {
        if (supabase && authUserId) {
          // Online Mode: Delete from Supabase
          console.log("Deleting data for user:", authUserId);
          
          // 1. Delete app data
          const { error: dataError } = await supabase.from("user_app_data").delete().eq("id", authUserId);
          if (dataError) {
            console.error("Error deleting user_app_data:", dataError);
          }
          
          // 2. Delete profile
          const { error: profileError } = await supabase.from("user_profiles").delete().eq("user_id", authUserId);
          if (profileError) {
            console.error("Error deleting user_profiles:", profileError);
          }
          
          // 3. Sign out
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) console.error("Error signing out:", signOutError);
        }

        // 4. Reset local state
        resetToSeed();
        setAuthData(null);
        setAuthStep("auth");
        setTab("home");
        
        // Clear any specific user storage keys
        if (authUserId) {
          localStorage.removeItem(storageKeyForUser(authUserId));
        }
        localStorage.removeItem(STORAGE_KEY);
        
        // Close modal
        onClose();
        
        alert("Your account data has been successfully deleted and you have been signed out.");
      } catch (err) {
        console.error("Critical error during account deletion:", err);
        alert("An error occurred. We've reset your local data and signed you out, but some cloud data might remain. Please contact support if you need a full data wipe.");
        
        // Force reset anyway
        resetToSeed();
        setAuthData(null);
        setAuthStep("auth");
        onClose();
      } finally {
        setIsDeleting(false);
      }
    };

    const details = [
      { key: "name", label: "Full Name", value: editedUser.name || "", icon: <UserCircle size={18} />, editable: true },
      { key: "role", label: "Role", value: editedUser.role || "Member", icon: <UserCircle size={18} />, editable: true },
      { key: "email", label: "Email", value: editedUser.email || "Not provided", icon: <Mail size={18} />, editable: true },
      { key: "phone", label: "Phone", value: editedUser.phone || "Not provided", icon: <Phone size={18} />, editable: true },
      { key: "gender", label: "Gender", value: editedUser.gender || "Not provided", icon: <Users size={18} />, editable: true },
      { key: "dob", label: "Birthday", value: editedUser.dob || "Not provided", icon: <Calendar size={18} />, editable: true },
      { key: "country", label: "Country", value: editedUser.country || "Not provided", icon: <Globe size={18} />, editable: true },
    ];

    return (
      <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 450, width: "100%", padding: 0, overflow: "hidden", border: "none", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.3)" }}>
          <div style={{ background: `linear-gradient(135deg, ${C.forest}, #064E3B)`, padding: "40px 32px", textAlign: "center", position: "relative" }}>
            <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="tap">×</button>
            <Avatar name={editedUser.name} size={80} style={{ margin: "0 auto 16px", border: "4px solid rgba(255,255,255,0.2)" }} />
            {isEditing ? (
              <input 
                value={editedUser.name} 
                onChange={e => setEditedUser({ ...editedUser, name: e.target.value })}
                style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 24, fontWeight: 800, textAlign: "center", width: "100%", borderRadius: 8, padding: "8px 12px", outline: "none" }}
              />
            ) : (
              <H size={24} style={{ color: "#fff", marginBottom: 4 }}>{editedUser.name || "User Profile"}</H>
            )}
            <div style={{ marginTop: 8 }}>
              <Pill color="#fff">{editedUser.role || "Member"}</Pill>
            </div>
          </div>
          
          <div style={{ padding: 32, maxHeight: "60vh", overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
              {details.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F8FAF9", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.forest }}>
                    {d.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{d.label}</p>
                    {isEditing && d.editable ? (
                      <input 
                        value={d.value === "Not provided" ? "" : d.value} 
                        onChange={e => setEditedUser({ ...editedUser, [d.key]: e.target.value })}
                        placeholder={`Enter ${d.label.toLowerCase()}`}
                        style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
                      />
                    ) : (
                      <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
              {isEditing ? (
                <div style={{ display: "flex", gap: 12 }}>
                  <Btn full onClick={handleSave}>Save Changes</Btn>
                  <Btn ghost full onClick={() => { setIsEditing(false); setEditedUser({ ...user }); }}>Cancel</Btn>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Btn full onClick={() => setIsEditing(true)}>Edit Profile</Btn>
                    <Btn ghost full onClick={onClose}>Close</Btn>
                  </div>
                  
                  <div style={{ marginTop: 12, paddingTop: 24, borderTop: `1px dashed ${C.border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: C.coral, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>Danger Zone</p>
                    <button 
                      onClick={() => setShowConfirmDelete(true)}
                      disabled={isDeleting}
                      className="tap"
                      style={{ 
                        width: "100%", 
                        background: "rgba(239, 68, 68, 0.08)", 
                        border: "1px solid rgba(239, 68, 68, 0.2)", 
                        color: "#EF4444", 
                        borderRadius: 12, 
                        padding: "12px", 
                        fontSize: 13, 
                        fontWeight: 700, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        gap: 8,
                        cursor: isDeleting ? "wait" : "pointer"
                      }}
                    >
                      {isDeleting ? (
                        <span style={{ width: 16, height: 16, border: "2px solid #EF4444", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete My Account
                    </button>
                  </div>
                </>
              )}
            </div>
            {showConfirmDelete && (
              <ConfirmModal 
                title="Delete Account?"
                message="Are you absolutely sure? This will permanently delete all your goals, journals, and profile data from our servers. This action cannot be undone."
                confirmLabel="Yes, Delete Everything"
                cancelLabel="No, Keep My Data"
                danger
                onConfirm={handleDeleteAccount}
                onCancel={() => setShowConfirmDelete(false)}
              />
            )}
          </div>
        </Card>
      </div>
    );
  };

  const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) => {
    return (
      <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Card style={{ maxWidth: 400, width: "100%", padding: 32, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: danger ? "rgba(239, 68, 68, 0.1)" : "rgba(5, 150, 105, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Trash2 size={32} color={danger ? "#EF4444" : C.forest} />
          </div>
          <H size={20} style={{ marginBottom: 12 }}>{title}</H>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>{message}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn ghost full onClick={onCancel}>{cancelLabel}</Btn>
            <Btn full onClick={onConfirm} style={{ background: danger ? "#EF4444" : C.forest, boxShadow: danger ? "0 4px 14px rgba(239, 68, 68, 0.25)" : undefined }}>{confirmLabel}</Btn>
          </div>
        </Card>
      </div>
    );
  };

  const NotificationPopup = ({ notifications, onClose, onMarkRead }) => {
    return (
      <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "80px 32px" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />
        <Card style={{ width: 360, padding: 0, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "none", position: "relative" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F9FAFB" }}>
            <H size={18}>Notifications</H>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 20 }}>×</button>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>All caught up!</p>
              </div>
            ) : (
              [...notifications].reverse().map((n, i) => (
                <div key={i} onClick={() => onMarkRead(n.id)} style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: n.read ? "transparent" : `${C.forest}05`, cursor: "pointer", transition: "background 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{n.title}</p>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.forest }} />}
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 8 }}>{n.body}</p>
                  <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>{new Date(n.date).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
          {notifications.some(n => !n.read) && (
            <div style={{ padding: 12, textAlign: "center", borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => onMarkRead("all")} style={{ background: "transparent", border: "none", color: C.forest, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark all as read</button>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const appHeader = (
    <header className="app-header" style={{ 
      height: 80, 
      padding: "0 32px", 
      background: "transparent", 
      borderBottom: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24
    }}>
      {layout === "mobile" ? (
        <Logo size={18} />
      ) : (
        <div style={{ minWidth: 150 }}>
          <h1 style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontSize: 24, 
            fontWeight: 800, 
            color: C.text, 
            margin: 0, 
            letterSpacing: -0.5 
          }}>
            {headerPage.label}
          </h1>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
        {layout !== "mobile" && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div 
              onClick={() => setNotificationsOpen(true)}
              style={{ position: "relative", cursor: "pointer", width: 40, height: 40, borderRadius: 12, background: "#fff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              className="tap"
            >
              <Bell size={20} color={C.muted} />
              {(data.notifications || []).some(n => !n.read) && (
                <div style={{ 
                  position: "absolute", 
                  top: 10, 
                  right: 10, 
                  width: 8, 
                  height: 8, 
                  background: "#EF4444", 
                  borderRadius: "50%", 
                  border: "2px solid #fff" 
                }} />
              )}
            </div>
            
            <div style={{ width: 1, height: 24, background: C.border }} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {!data.user.subscribed && (
            <button type="button" onClick={showPaywall} className="tap"
              style={{ 
                background: "linear-gradient(135deg, #14532D, #064E3B)", 
                border: "none", 
                color: "#fff", 
                padding: "8px 14px", 
                borderRadius: 10, 
                fontSize: 11, 
                fontWeight: 800, 
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(20, 83, 45, 0.15)",
                textTransform: "uppercase",
                letterSpacing: 0.5
              }}>
              Upgrade
            </button>
          )}
          {data.user.subscribed && <Pill color={C.mint}>Pro</Pill>}
          
          {layout !== "mobile" && (
            <div 
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              onClick={() => setProfileOpen(true)}
              className="tap"
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1 }}>{data.user.name || "User"}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginTop: 4 }}>{data.user.role || "Member"}</div>
              </div>
              <Avatar 
                name={data.user.name} 
                size={40} 
              />
            </div>
          )}
        </div>

        {layout === "mobile" && (
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              background: "#fff",
              border: `1px solid ${C.border}`,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "block",
                  width: 18,
                  height: 2,
                  borderRadius: 99,
                  background: "#111827",
                  opacity: i === 1 ? 0.75 : 1,
                }}
              />
            ))}
          </button>
        )}
      </div>
    </header>
  );

  return (
    <div className={`app-root app-font${layout === "mobile" ? " app-root--mobile-shell" : ""}${layout !== "mobile" ? " app-root--wide" : ""}`} style={{ position: "relative" }}>
      <GlobalStyles />

      {dataSaving && (
        <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 400, display: "flex", alignItems: "center", gap: 8, background: `${C.surface}F0`, border: `1px solid ${C.border}`, borderRadius: 99, padding: "6px 14px", backdropFilter: "blur(8px)" }}>
          <div style={{ width: 14, height: 14, border: `2px solid ${C.faint}`, borderTopColor: C.sunrise, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>Saving…</span>
        </div>
      )}

      {syncError && (
        <div style={{ position: "fixed", top: dataSaving ? 52 : 12, left: "50%", transform: "translateX(-50%)", zIndex: 400, maxWidth: 420, padding: "8px 14px", background: `${C.coral}18`, border: `1px solid ${C.coral}44`, borderRadius: 8, fontSize: 11, color: C.coral, textAlign: "center" }}>
          Cloud sync issue — working offline. ({syncError})
        </div>
      )}

      {paywallOpen && <Paywall user={data.user} supabaseUser={supabaseUser} setData={setData} authUserId={authUserId} onClose={() => setPaywallOpen(false)} />}

      {confirmReset && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 400, padding: "32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Target size={24} color="#EF4444" />
            </div>
            <H size={22} style={{ marginBottom: 12 }}>Start New Cycle?</H>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
              This will reset all your current data and start a fresh 90-day performance cycle. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={() => { resetToSeed(); setConfirmReset(false); }} style={{ background: "#EF4444", borderColor: "#EF4444" }} full>Yes, Reset Everything</Btn>
              <Btn ghost onClick={() => setConfirmReset(false)} full>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {subscriptionSuccess && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 400, padding: "32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F9F1", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShieldCheck size={24} color={C.forest} />
            </div>
            <H size={22} style={{ marginBottom: 12 }}>Pro Active!</H>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
              Welcome to BestSelf Pro! Your subscription is now active. You have full access to all premium features.
            </p>
            <Btn onClick={() => setSubscriptionSuccess(false)} full>Get Started</Btn>
          </Card>
        </div>
      )}

      {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}

      {streakShare && <StreakShareModal streak={streak} userName={data.user.name} milestone={getMilestone(streak)} onClose={() => setStreakShare(false)} />}
      {profileOpen && <ProfileModal user={data.user} onClose={() => setProfileOpen(false)} />}
      {notificationsOpen && (
        <NotificationPopup 
          notifications={data.notifications || []} 
          onClose={() => setNotificationsOpen(false)} 
          onMarkRead={(id) => {
            setData(d => ({
              ...d,
              notifications: d.notifications.map(n => (id === "all" || n.id === id) ? { ...n, read: true } : n)
            }));
          }}
        />
      )}

      {layout === "mobile" ? (
        <div className="app-frame">
          {appHeader}

          {drawer && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setDrawer(false)}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)", backdropFilter: "blur(4px)" }} />
              <div
                className="slR"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 270,
                  maxWidth: "86vw",
                  background: "linear-gradient(180deg,#14532D 0%, #0F2A1A 100%)",
                  borderRight: "1px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "12px 0 40px rgba(15,23,42,0.18)",
                  borderRadius: "0 26px 26px 0",
                  overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: "20px 18px 12px" }}>
                  <Logo size={20} light />
                  <div style={{ marginTop: 14, height: 1, background: "rgba(255,255,255,0.12)" }} />
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 20px" }}>
                  <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      { id: "home", label: "Dashboard", Icon: LayoutDashboard },
                      { id: "90day", label: "90-Day Goals", Icon: Target },
                      { id: "weekly", label: "Weekly Journal", Icon: Calendar, badge: data.weeks?.length ? `${data.weeks.length}+` : null },
                      { id: "notifications", label: "Notifications", Icon: Bell, badge: (data.notifications || []).filter(n => !n.read).length || null, isAction: true },
                      { id: "analytics", label: "Analytics", Icon: BarChart3 },
                      { id: "reading", label: "Reading List", Icon: Library },
                      { id: "identity", label: "I Am Statements", Icon: UserCircle },
                    ].map((p) => {
                      const active = tab === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (p.isAction) {
                              if (p.id === "notifications") setNotificationsOpen(true);
                            } else {
                              setTab(p.id);
                            }
                            setDrawer(false);
                          }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          background: active ? "rgba(255,255,255,0.14)" : "transparent",
                          border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                          borderRadius: 16,
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontWeight: active ? 700 : 600,
                          position: "relative",
                          transition: "background .15s ease, border-color .15s ease",
                        }}
                      >
                        {active && <span style={{ position: "absolute", left: -2, top: "50%", transform: "translateY(-50%)", width: 4, height: 24, borderRadius: "0 4px 4px 0", background: "#22C55E" }} />}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: active ? "#22C55E" : "rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all .2s ease"
                          }}
                        >
                          <p.Icon size={18} color={active ? "#fff" : "rgba(255,255,255,0.7)"} />
                        </div>
                        <span style={{ flex: 1, fontSize: 14, color: active ? "#fff" : "rgba(255,255,255,0.85)" }}>{p.label}</span>
                        {p.badge && (
                          <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 99, background: "#fff", color: "#14532D" }}>
                            {p.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </nav>

                  {[
                    { id: "logout", label: "Logout", Icon: LogOut, danger: true },
                  ].map((p) => {
                    const active = tab === p.id;
                    return null; // Moved to bottom
                  })}
                </div>

                <div style={{ padding: "24px 16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "auto" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setDrawer(false);
                      if (getSupabase()) {
                        await getSupabase().auth.signOut();
                      }
                      setAuthStep(requiresAuth ? "auth" : "demo");
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 12px",
                      background: "transparent",
                      border: "none",
                      borderRadius: 16,
                      color: "#FCA5A5",
                      cursor: "pointer",
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontWeight: 600,
                      marginBottom: 20
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "#EF4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <LogOut size={18} color="#fff" />
                    </div>
                    <span style={{ flex: 1, color: "#fff" }}>Logout</span>
                  </button>

                  <div 
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 4px", cursor: "pointer" }}
                    onClick={() => {
                      setDrawer(false);
                      setProfileOpen(true);
                    }}
                    className="tap"
                  >
                    <Avatar 
                      name={data.user.name} 
                      size={42} 
                      style={{ border: "2px solid rgba(255,255,255,0.15)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{data.user.name || "User"}</div>
                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>{data.user.role || "Member"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <main key={tab} className="rise app-scroll">
            {pages[tab] || pages.home}
          </main>

          <nav className="app-nav-dock" aria-label="Primary">
            <div className="app-nav-dock__inner">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`app-nav-dock__btn${active ? " app-nav-dock__btn--active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    <t.Icon size={22} color={active ? C.agroGreen : C.faint} />
                    <span className="app-nav-dock__lbl">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      ) : (
        <div className={`app-wide app-wide--${layout}`}>
          <aside
            className="app-wide-sidebar"
            style={{
              background: "#14532D",
              borderRight: "none",
              padding: 0,
            }}
          >
            <div 
              className="sidebar-container"
              style={{
                background: "linear-gradient(180deg,#14532D 0%, #0F2A1A 100%)",
                height: "100%",
                borderRadius: 0,
                display: "flex",
                flexDirection: "column",
                padding: layout === "tablet" ? "24px 8px" : "32px 16px",
                color: "white",
                boxShadow: "12px 0 40px rgba(15,23,42,0.18)",
                position: "relative",
                overflow: "hidden",
                borderRight: "1px solid rgba(255,255,255,0.10)"
              }}
            >
              {/* Logo Section */}
              <div style={{ 
                marginBottom: 24, 
                paddingLeft: layout === "tablet" ? 0 : 12,
                display: "flex",
                flexDirection: "column",
                justifyContent: layout === "tablet" ? "center" : "flex-start",
                alignItems: layout === "tablet" ? "center" : "flex-start",
              }}>
                <Logo size={20} light />
                {layout !== "tablet" && <div style={{ marginTop: 24, height: 1, width: "100%", background: "rgba(255,255,255,0.12)" }} />}
              </div>

              {/* Main Nav */}
              <div style={{ flex: 1, overflowY: "hidden", padding: "10px 0 20px" }}>
                <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {ALL_PAGES.map((p) => {
                    const active = tab === p.id;
                    const compact = layout === "tablet";
                    return (
                      <button
                        key={p.id}
                        type="button"
                        title={p.label}
                        onClick={() => setTab(p.id)}
                        className="tap"
                        style={{
                          width: "100%",
                          justifyContent: compact ? "center" : "flex-start",
                          padding: compact ? "12px 0" : "10px 12px",
                          background: active ? "rgba(255,255,255,0.14)" : "transparent",
                          border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                          borderRadius: 16,
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          transition: "all 0.2s ease",
                          outline: "none",
                          position: "relative"
                        }}
                      >
                        {active && !compact && <span style={{ position: "absolute", left: -2, top: "50%", transform: "translateY(-50%)", width: 4, height: 24, borderRadius: "0 4px 4px 0", background: "#22C55E" }} />}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: active ? "#22C55E" : "rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all .2s ease"
                          }}
                        >
                          <p.Icon size={18} color={active ? "#fff" : "rgba(255,255,255,0.7)"} />
                        </div>
                        {!compact && (
                          <span style={{ 
                            fontSize: 14, 
                            fontWeight: active ? 700 : 600,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            flex: 1,
                            color: active ? "#fff" : "rgba(255,255,255,0.85)"
                          }}>
                            {p.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Actions */}
              <div style={{ 
                marginTop: "auto", 
                display: "flex", 
                flexDirection: "column", 
                gap: 20,
                padding: "80px 12px 24px",
                borderTop: "none"
              }}>
                <button 
                  type="button" 
                  onClick={async () => { 
                    if (getSupabase()) {
                      await getSupabase().auth.signOut();
                    }
                    setAuthStep(requiresAuth ? "auth" : "demo");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: layout === "tablet" ? "12px 0" : "12px 12px",
                    background: "transparent",
                    border: "none",
                    color: "#FCA5A5",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: layout === "tablet" ? "center" : "flex-start",
                    gap: 12,
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LogOut size={18} color="#fff" />
                  </div>
                  {layout !== "tablet" && <span style={{ flex: 1, color: "#fff" }}>Logout</span>}
                </button>

                {layout !== "tablet" && (
                  <div 
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 4px", cursor: "pointer" }}
                    onClick={() => setProfileOpen(true)}
                    className="tap"
                  >
                    <Avatar 
                      name={data.user.name} 
                      size={42} 
                      style={{ border: "2px solid rgba(255,255,255,0.15)" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{data.user.name || "User"}</div>
                      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>{data.user.role || "Member"}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="app-wide-body">
            {appHeader}
            <main key={tab} className="rise app-scroll">
              {pages[tab] || pages.home}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
