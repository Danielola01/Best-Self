import { useState, useEffect, useRef, useCallback } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

/*
  BestSelf — Your 90-Day Personal Performance System
  v4 — Streaks + milestones, analytics charts, shareable week card,
       annual/monthly pricing toggle, AI goal suggestions via Claude API
*/

const GFONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";

const C = {
  void:     "#080A0F",
  deep:     "#0E1118",
  surface:  "#141820",
  card:     "#1A1F2B",
  border:   "#252D3D",
  faint:    "#3A4155",
  sunrise:  "#FF6B35",
  flame:    "#FF8C42",
  gold:     "#F4C542",
  mint:     "#4ECDC4",
  lavender: "#A78BFA",
  coral:    "#FF6B6B",
  white:    "#FFFFFF",
  cream:    "#F0ECE3",
  text:     "#D8D4CC",
  muted:    "#7A8099",
};

const STORAGE = "bestself_v4";

// ── Streak helpers ──
function computeStreak(weeks) {
  if (!weeks || weeks.length === 0) return 0;
  const done = weeks.filter(w => w.done).length;
  return done; // simplified: consecutive completed weeks
}
const MILESTONES = [
  { weeks: 4,  label: "4-Week Warrior",   color: "#60A5FA", msg: "One month of consistent action. You're building a habit." },
  { weeks: 8,  label: "8-Week Champion",  color: "#A78BFA", msg: "Two months in. Most people quit. You didn't." },
  { weeks: 12, label: "90-Day Legend",    color: "#F4C542", msg: "You've completed a full 90-day cycle. Elite territory." },
];
function getMilestone(streak) {
  return [...MILESTONES].reverse().find(m => streak >= m.weeks) || null;
}

// ── AI suggestion helper ──
async function fetchAISuggestions(dim, existingGoals, userName) {
  const existing = existingGoals.filter(Boolean).join(", ") || "none set yet";
  const prompt = `You are a world-class life coach helping ${userName || "a driven professional"} set powerful ${dim} goals for their 90-day cycle.

Their current ${dim} goals: ${existing}

Generate exactly 3 fresh, specific, ambitious but achievable ${dim} goals for the next 90 days. 
Return ONLY a JSON array of 3 strings, no preamble, no markdown. Example: ["Goal one","Goal two","Goal three"]`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "[]";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return []; }
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
  { key: "career",        label: "Career & Leadership",  color: C.sunrise  },
  { key: "faith",         label: "Faith & Purpose",      color: C.lavender },
  { key: "relationships", label: "Relationships",        color: C.coral    },
  { key: "health",        label: "Health & Vitality",    color: C.mint     },
  { key: "abundance",     label: "Wealth & Abundance",   color: C.gold     },
];

const DIMS = [
  { key: "spiritual",    label: "Spiritual",       color: C.lavender },
  { key: "family",       label: "Family",          color: C.coral    },
  { key: "legacy",       label: "Legacy",          color: C.gold     },
  { key: "health",       label: "Health",          color: C.mint     },
  { key: "finances",     label: "Finances",        color: "#52D9A4"  },
  { key: "career",       label: "Career",          color: "#60A5FA"  },
  { key: "social",       label: "Social Capital",  color: C.flame    },
  { key: "intellectual", label: "Intellectual",    color: "#C4B5FD"  },
  { key: "fun",          label: "Fun & Adventure", color: C.gold     },
];

const ONBOARD_SLIDES = [
  {
    title: "Crush Your Goals.\nEvery Single Week.",
    body:  "BestSelf is a proven 90-day system that turns ambitious professionals into goal-crushing machines — one intentional week at a time.",
    cta:   "Let's Go",
    accent: C.sunrise,
  },
  {
    title: "9 Dimensions.\nOne Life. Fully Aligned.",
    body:  "Career, health, family, finances, spirituality — stop letting any dimension fall behind. BestSelf keeps every area of your life moving forward.",
    cta:   "I'm In",
    accent: C.mint,
  },
  {
    title: "Become Who\nYou're Meant to Be.",
    body:  "Your next-level identity is waiting. Rewire your beliefs, declare who you are, and show up as the highest version of yourself — starting today.",
    cta:   "Build My BestSelf",
    accent: C.gold,
  },
];

// ── Trial / Subscription config ──
const TRIAL_DAYS = 14;
const PLAN_PRICE = "$59.99 / year";
const PLAN_MONTHLY = "Only $5/month";

// ── Data helpers ──
function loadData() {
  try { const r = localStorage.getItem(STORAGE); if (r) return { ...seed(), ...JSON.parse(r) }; } catch(_) {}
  return seed();
}
function seed() {
  return {
    user: { name: "", role: "", joinDate: new Date().toISOString().slice(0,10), subscribed: false, trialStart: new Date().toISOString().slice(0,10) },
    annualGoalSets: [],   // [{ year, goals: { spiritual:[...], ... } }]
    cycleGoalSets:  [],   // [{ label, startDate, goals: { ... } }]
    weeks: [],
    iAmCustom: [],
    books: [{ title: "", author: "", lessons:["","",""], actions:["","",""] }],
    lastQuoteIdx: -1,
    lastOpenDate: "",
  };
}
function persist(d) { try { localStorage.setItem(STORAGE, JSON.stringify(d)); } catch(_) {} }
function newWeek() {
  return {
    id: Date.now(), date: new Date().toISOString().slice(0,10),
    wins:["","",""], goals:["","",""],
    actions:[["","",""],["","",""],["","",""]],
    showUp:["","",""], limiting:["","",""], empowering:["","",""],
    learned:["","",""], worked:["","",""], avoided:["",""], doOver:[""],
    iAm:["","",""], done:false,
  };
}
function blankGoals() { return Object.fromEntries(DIMS.map(d=>[d.key,["",""]])); }
function trialDaysLeft(user) {
  if (user.subscribed) return Infinity;
  const start = new Date(user.trialStart);
  const elapsed = Math.floor((Date.now()-start)/86400000);
  return Math.max(0, TRIAL_DAYS - elapsed);
}
function isLocked(user) { return trialDaysLeft(user) <= 0 && !user.subscribed; }

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
function Styles() {
  return <style>{`
    @import url('${GFONTS}');
    *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
    html, body { background:${C.void}; overscroll-behavior:none; -webkit-tap-highlight-color:transparent; }
    ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:${C.faint}; border-radius:2px; }
    input, textarea, button { font-family:'Plus Jakarta Sans',sans-serif; }
    input::placeholder, textarea::placeholder { color:${C.faint}; }
    textarea { resize:none; }

    @keyframes riseUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes popIn   { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
    @keyframes slideR  { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
    @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
    @keyframes gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
    @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes cardPulse { 0%,100%{box-shadow:0 0 0px transparent} 50%{box-shadow:0 0 20px ${C.sunrise}33} }

    .rise  { animation: riseUp 0.5s cubic-bezier(.22,1,.36,1) both; }
    .fadein{ animation: fadeIn 0.4s ease both; }
    .popin { animation: popIn  0.35s cubic-bezier(.22,1,.36,1) both; }
    .slR   { animation: slideR 0.38s cubic-bezier(.22,1,.36,1) both; }
    .float { animation: float 5s ease-in-out infinite; }

    .tap { transition:transform .14s,opacity .14s; cursor:pointer; }
    .tap:active { transform:scale(0.96); opacity:.78; }
    .lift { transition:transform .2s ease, box-shadow .2s ease; }
    .lift:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(0,0,0,.45); }

    .grad-text {
      background: linear-gradient(90deg,${C.sunrise},${C.gold});
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
    }
    .il {
      width:100%; background:transparent; border:none;
      border-bottom:1px solid ${C.border}; color:${C.cream};
      font-size:13px; font-family:'Plus Jakarta Sans',sans-serif;
      padding:8px 2px; outline:none; transition:border-color .2s;
    }
    .il:focus { border-bottom-color:${C.sunrise}; }
    .decl-card {
      animation: cardPulse 3s ease-in-out infinite;
    }
  `}</style>;
}

/* ═══════════════════════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════════════════════ */
function Logo({ size=18 }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:size+10,height:size+10,borderRadius:8,background:`linear-gradient(135deg,${C.sunrise},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 14px ${C.sunrise}44`,flexShrink:0}}>
        <span style={{color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:size,lineHeight:1}}>B</span>
      </div>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:size+2,color:C.cream,letterSpacing:.5}}>Best</span>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:400,fontSize:size+2,color:C.sunrise,marginLeft:-6}}>Self</span>
    </div>
  );
}
function H({ children, size=22, style={}, className="" }) {
  return <h2 className={className} style={{fontFamily:"'Cormorant Garamond',serif",color:C.cream,fontSize:size,fontWeight:700,lineHeight:1.18,...style}}>{children}</h2>;
}
function Lbl({ children, color }) {
  return <p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:600,letterSpacing:2.5,textTransform:"uppercase",color:color||C.sunrise,marginBottom:10}}>{children}</p>;
}
function Pill({ children, color }) {
  return <span style={{background:`${color||C.sunrise}18`,color:color||C.sunrise,border:`1px solid ${color||C.sunrise}30`,borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:600,letterSpacing:.8}}>{children}</span>;
}
function Btn({ children, onClick, full, ghost, small, danger, style={} }) {
  if (ghost) return <button onClick={onClick} className="tap" style={{background:"transparent",border:`1px solid ${danger?C.coral:C.border}`,color:danger?C.coral:C.muted,borderRadius:6,padding:small?"6px 14px":"10px 20px",fontSize:12,fontWeight:500,...style}}>{children}</button>;
  return <button onClick={onClick} className="tap" style={{background:`linear-gradient(135deg,${C.sunrise},${C.flame})`,border:"none",color:"#fff",borderRadius:8,padding:small?"8px 18px":"14px 28px",fontSize:small?12:14,fontWeight:700,letterSpacing:.5,boxShadow:`0 4px 18px ${C.sunrise}44`,width:full?"100%":"auto",...style}}>{children}</button>;
}
function Card({ children, style={}, glow, className="" }) {
  return <div className={className} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 16px",boxShadow:glow?`0 0 26px ${glow}22`:"0 2px 10px rgba(0,0,0,.3)",...style}}>{children}</div>;
}
function Avatar({ name, size=44 }) {
  const init=(name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${C.sunrise},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 10px ${C.sunrise}44`}}><span style={{color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:size*.38}}>{init}</span></div>;
}
function Ring({ pct=0, size=80, stroke=7, color=C.sunrise, children }) {
  const r=(size-stroke*2)/2, ci=size/2, circ=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={ci} cy={ci} r={r} fill="none" stroke={C.faint} strokeWidth={stroke}/>
        <circle cx={ci} cy={ci} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        {children||<span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:size*.24,fontWeight:700,color:C.cream}}>{pct}%</span>}
      </div>
    </div>
  );
}
function Bar({ value=0, max=1, color=C.sunrise, h=5 }) {
  const pct=Math.min(100,Math.round((value/max)*100));
  return <div style={{background:C.faint,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 1s cubic-bezier(.22,1,.36,1)"}}/></div>;
}
// ── SVG Icons — unique, purposeful, no emojis ──
const Icons = {
  // Home: abstract house / compass rose
  Home: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  // Annual: calendar with a star / year view
  Annual: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
      <path d="M12 14l1.5 3 3-4.5-4.5 1.5L9 12l.75 3.75L12 14z"/>
    </svg>
  ),
  // 90-Day: clock / arc suggesting a sprint
  Sprint: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 7v5l3.5 3.5"/>
      <path d="M16.5 3.5l1 2M7.5 3.5l-1 2"/>
    </svg>
  ),
  // Weekly: layered lines / journal pages
  Weekly: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <path d="M8 7h8M8 11h8M8 15h5"/>
      <circle cx="17" cy="17" r="3" fill="none"/>
      <path d="M16 17l.8.8 1.7-1.6"/>
    </svg>
  ),
  // Identity: person silhouette with a spark / crown
  Identity: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      <path d="M17 4l1-2 1 2-2-1 2-1z" strokeWidth="1.4" fill={color} opacity="0.7"/>
    </svg>
  ),
  // Reading: open book
  Reading: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6s2-2 6-2 6 2 6 2v14s-2-1-6-1-6 1-6 1V6z"/>
      <path d="M14 6s2-2 6-2v14s-2-1-6-1"/>
      <path d="M12 6v14"/>
    </svg>
  ),
  // Analytics: bar chart trend upward
  Analytics: ({size=20,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18"/>
      <rect x="4" y="12" width="3" height="8" rx="1"/>
      <rect x="10.5" y="7" width="3" height="13" rx="1"/>
      <rect x="17" y="3" width="3" height="17" rx="1"/>
      <path d="M5.5 12l6-5 6-3" strokeDasharray="2 1" opacity="0.5"/>
    </svg>
  ),
  // Checkmark for completed goals
  Check: ({size=12,color="currentColor"}) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-5"/>
    </svg>
  ),
};

// ── Goal list with completion checkboxes ──
function GoalList({ items, checked, onChange, onToggle, placeholder, accentColor }) {
  const accent = accentColor || C.sunrise;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {/* Subtle hint — shown once at top */}
      <p style={{color:C.faint,fontSize:10,letterSpacing:1,marginBottom:10,fontStyle:"italic"}}>
        Only tick a goal when it is fully complete
      </p>
      {items.map((v,i)=>{
        const done = checked?.[i] || false;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}22`,transition:"opacity .2s",opacity:done?0.55:1}}>
            {/* Number badge */}
            <div style={{width:22,height:22,borderRadius:6,background:`${accent}18`,border:`1px solid ${accent}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:accent,fontSize:10,fontWeight:700}}>{i+1}</span>
            </div>
            {/* Text input */}
            <input className="il"
              value={v}
              onChange={e=>{const a=[...items];a[i]=e.target.value;onChange(a);}}
              placeholder={placeholder}
              style={{textDecoration:done?"line-through":"none",color:done?C.faint:C.cream,flex:1}}
            />
            {/* Completion checkbox */}
            <button
              onClick={()=>onToggle(i)}
              title={done?"Mark incomplete":"Mark as complete — only when done!"}
              style={{
                width:26,height:26,borderRadius:7,flexShrink:0,cursor:"pointer",
                border:`1.8px solid ${done?accent:C.faint}`,
                background:done?accent:"transparent",
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:"all .2s ease",
                boxShadow:done?`0 0 10px ${accent}55`:"none",
              }}>
              {done && <Icons.Check size={12} color="#fff"/>}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Legacy plain list (used in weekly planner where checkboxes aren't appropriate)
function NumList({ items, onChange, placeholder }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {items.map((v,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:22,height:22,borderRadius:6,background:`${C.sunrise}18`,border:`1px solid ${C.sunrise}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{color:C.sunrise,fontSize:10,fontWeight:700}}>{i+1}</span>
          </div>
          <input className="il" value={v} onChange={e=>{const a=[...items];a[i]=e.target.value;onChange(a);}} placeholder={placeholder}/>
        </div>
      ))}
    </div>
  );
}
function Divider({ style={} }) {
  return <div style={{height:1,background:C.border,margin:"16px 0",...style}}/>;
}

/* ═══════════════════════════════════════════════════════════
   MILESTONE CELEBRATION MODAL
═══════════════════════════════════════════════════════════ */
function MilestoneCelebration({ milestone, onClose }) {
  if (!milestone) return null;
  return (
    <div className="fadein" style={{position:"fixed",inset:0,zIndex:400,background:"#000000DD",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="popin" style={{background:`linear-gradient(135deg,${C.surface},${C.card})`,border:`2px solid ${milestone.color}55`,borderRadius:20,padding:"40px 28px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:`0 0 60px ${milestone.color}33`}}>
        {/* Burst ring */}
        <div style={{width:90,height:90,borderRadius:"50%",border:`3px solid ${milestone.color}`,background:`${milestone.color}12`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px",boxShadow:`0 0 30px ${milestone.color}44`}}>
          <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <path d="M20 5l3.5 10h10.5l-8.5 6.5 3.5 10L20 26l-9 6 3.5-10L6 16h10.5z" fill={milestone.color} opacity={0.9}/>
          </svg>
        </div>
        <p style={{color:milestone.color,fontSize:10,letterSpacing:3,fontWeight:700,marginBottom:10}}>MILESTONE UNLOCKED</p>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",color:C.cream,fontSize:28,fontWeight:700,marginBottom:12,lineHeight:1.2}}>{milestone.label}</h2>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:28}}>{milestone.msg}</p>
        <button onClick={onClose} style={{background:`linear-gradient(135deg,${milestone.color},${C.sunrise})`,border:"none",color:"#fff",borderRadius:10,padding:"14px 32px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>
          Keep Going
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANALYTICS PAGE
═══════════════════════════════════════════════════════════ */
function Analytics({ data }) {
  const weeks = data.weeks || [];
  const streak = computeStreak(weeks);
  const milestone = getMilestone(streak);
  const cycles = data.cycleGoalSets || [];

  // Dimension completion data for radar/bar chart
  const dimData = DIMS.map(dim => {
    let total = 0, done = 0;
    cycles.forEach(c => {
      const goals = c.goals?.[dim.key] || [];
      const checks = c.checked?.[dim.key] || [];
      goals.forEach((g, i) => { if (g.trim()) { total++; if (checks[i]) done++; } });
    });
    return { name: dim.label.slice(0, 6), full: dim.label, pct: total > 0 ? Math.round((done / total) * 100) : 0, color: dim.color, done, total };
  });

  // Weekly completion over time
  const weeklyData = weeks.slice(-12).map((w, i) => ({
    name: `W${i + 1}`,
    goals: w.goals.filter(Boolean).length,
    wins:  w.wins.filter(Boolean).length,
    done:  w.done ? 1 : 0,
  }));

  const totalGoalsSet      = dimData.reduce((a, d) => a + d.total, 0);
  const totalGoalsDone     = dimData.reduce((a, d) => a + d.done, 0);
  const overallPct         = totalGoalsSet > 0 ? Math.round((totalGoalsDone / totalGoalsSet) * 100) : 0;
  const completedWeeks     = weeks.filter(w => w.done).length;
  return (
    <div>
      <H size={26} style={{marginBottom:4}}>Analytics</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:22}}>How you're performing across every dimension.</p>

      {/* Streak + milestone */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        <Card glow={C.gold} style={{textAlign:"center",padding:"20px 12px"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:700,color:C.gold,lineHeight:1}}>{streak}</div>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginTop:4}}>WEEK STREAK</p>
          {milestone && <div style={{marginTop:10}}><Pill color={milestone.color}>{milestone.label}</Pill></div>}
        </Card>
        <Card style={{textAlign:"center",padding:"20px 12px"}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:700,color:C.mint,lineHeight:1}}>{overallPct}%</div>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginTop:4}}>GOALS COMPLETED</p>
          <p style={{color:C.faint,fontSize:10,marginTop:6}}>{totalGoalsDone} of {totalGoalsSet}</p>
        </Card>
      </div>

      {/* Dimension completion bar chart */}
      {totalGoalsSet > 0 && (
        <Card style={{marginBottom:16,padding:"18px 10px 8px"}}>
          <Lbl>Goal Completion by Dimension</Lbl>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dimData} margin={{top:0,right:8,left:-28,bottom:0}}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip
                contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}}
                labelStyle={{color:C.cream}}
                formatter={(v, _, props) => [`${v}% (${props.payload.done}/${props.payload.total})`, props.payload.full]}
                cursor={{fill:`${C.faint}22`}}
              />
              <Bar dataKey="pct" radius={[4,4,0,0]}>
                {dimData.map((d, i) => <Cell key={i} fill={d.color} opacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Dimension detail list */}
      <Card style={{marginBottom:16}}>
        <Lbl>Dimension Breakdown</Lbl>
        {dimData.map((d, i) => (
          <div key={i} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{color:C.text,fontSize:12,fontWeight:500}}>{d.full}</span>
              <span style={{color:d.color,fontSize:12,fontWeight:700}}>{d.pct}%</span>
            </div>
            <Bar value={d.done} max={Math.max(d.total, 1)} color={d.color} h={5}/>
            <p style={{color:C.faint,fontSize:10,marginTop:3}}>{d.done} of {d.total} goals completed</p>
          </div>
        ))}
      </Card>

      {/* Weekly history mini chart */}
      {weeklyData.length > 0 && (
        <Card style={{padding:"18px 10px 8px"}}>
          <Lbl>Recent Weeks — Goals Set</Lbl>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyData} margin={{top:0,right:8,left:-28,bottom:0}}>
              <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} labelStyle={{color:C.cream}} cursor={{fill:`${C.faint}22`}}/>
              <Bar dataKey="goals" fill={C.sunrise} radius={[3,3,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {weeks.length === 0 && totalGoalsSet === 0 && (
        <div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
          <p style={{fontSize:14,lineHeight:1.7}}>Complete your first week and set some goals to see your analytics here.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHAREABLE WEEK IN REVIEW CARD
═══════════════════════════════════════════════════════════ */
function ShareCard({ week, weekNum, userName, onClose }) {
  const cardRef = useRef(null);
  const date = week ? new Date(week.date).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "";
  const wins  = (week?.wins  || []).filter(Boolean);
  const goals = (week?.goals || []).filter(Boolean);

  const copyText = () => {
    const lines = [
      `✦ BestSelf — Blueprint ${weekNum} Review`,
      `${userName || "My"} week of ${date}`,
      "",
      wins.length  ? `WINS:\n${wins.map((w,i)=>`${i+1}. ${w}`).join("\n")}` : "",
      goals.length ? `\nGOALS CRUSHED:\n${goals.map((g,i)=>`${i+1}. ${g}`).join("\n")}` : "",
      "",
      "Building my BestSelf — 90 days at a time.",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).catch(()=>{});
    alert("Week review copied to clipboard!");
  };

  return (
    <div className="fadein" style={{position:"fixed",inset:0,zIndex:350,background:"#000000CC",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:380}}>
        {/* The shareable card */}
        <div ref={cardRef} style={{background:`linear-gradient(145deg,#0E1118,#161C2A)`,border:`1px solid ${C.border}`,borderRadius:20,padding:"32px 24px",position:"relative",overflow:"hidden",marginBottom:16}}>
          {/* BG accents */}
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${C.sunrise}18,transparent 65%)`}}/>
          <div style={{position:"absolute",bottom:-40,left:-20,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}12,transparent 65%)`}}/>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,position:"relative"}}>
            <Logo size={15}/>
            <div style={{textAlign:"right"}}>
              <p style={{color:C.sunrise,fontSize:10,fontWeight:700,letterSpacing:2}}>BLUEPRINT {weekNum}</p>
              <p style={{color:C.muted,fontSize:10,marginTop:2}}>{date}</p>
            </div>
          </div>

          <h2 style={{fontFamily:"'Cormorant Garamond',serif",color:C.cream,fontSize:26,fontWeight:700,marginBottom:4,position:"relative"}}>Weekly Blueprint Review</h2>
          <p style={{color:C.muted,fontSize:12,marginBottom:22,position:"relative"}}>{userName || "BestSelf User"}</p>

          {/* Wins */}
          {wins.length > 0 && (
            <div style={{marginBottom:18,position:"relative"}}>
              <p style={{color:C.gold,fontSize:9,letterSpacing:3,fontWeight:700,marginBottom:10}}>THIS WEEK'S WINS</p>
              {wins.map((w,i) => (
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:`${C.gold}20`,border:`1px solid ${C.gold}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:C.gold}}/>
                  </div>
                  <span style={{color:C.text,fontSize:13,lineHeight:1.5}}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div style={{position:"relative"}}>
              <p style={{color:C.sunrise,fontSize:9,letterSpacing:3,fontWeight:700,marginBottom:10}}>GOALS THIS WEEK</p>
              {goals.map((g,i) => (
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:`${C.sunrise}20`,border:`1px solid ${C.sunrise}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:C.sunrise}}/>
                  </div>
                  <span style={{color:C.text,fontSize:13,lineHeight:1.5}}>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer tagline */}
          <div style={{marginTop:24,paddingTop:16,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
            <p style={{color:C.faint,fontSize:10,letterSpacing:1}}>BUILDING MY BESTSELF</p>
            <p style={{color:C.faint,fontSize:10}}>90 days at a time</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={copyText}
            style={{flex:1,background:`linear-gradient(135deg,${C.sunrise},${C.flame})`,border:"none",color:"#fff",borderRadius:10,padding:"14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            Copy as Text
          </button>
          <button onClick={onClose}
            style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"14px 20px",fontSize:13,cursor:"pointer"}}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAYWALL  — annual / monthly toggle
═══════════════════════════════════════════════════════════ */
function Paywall({ user, setData, onClose }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [annual, setAnnual]   = useState(true);

  const ANNUAL_PRICE   = "$59.99 / year";
  const ANNUAL_MONTHLY = "Only $5/month";
  const MONTHLY_PRICE  = "$9.99 / month";
  const MONTHLY_NOTE   = "Billed monthly · Cancel anytime";

  const subscribe = () => {
    setLoading(true);
    setTimeout(()=>{ setData(d=>({...d,user:{...d.user,subscribed:true}})); setDone(true); setLoading(false); }, 1800);
  };

  if (done) return (
    <div className="fadein" style={{position:"fixed",inset:0,zIndex:300,background:"#000000CC",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <Card style={{maxWidth:360,width:"100%",textAlign:"center",padding:"40px 28px"}}>
        <div style={{width:60,height:60,borderRadius:"50%",background:`${C.mint}20`,border:`2px solid ${C.mint}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Icons.Check size={22} color={C.mint}/>
        </div>
        <H size={24} style={{marginBottom:10}}>Welcome to BestSelf Pro</H>
        <p style={{color:C.muted,fontSize:14,lineHeight:1.6,marginBottom:24}}>Your journey has no limits. All features unlocked.</p>
        <Btn full onClick={onClose}>Continue My Journey</Btn>
      </Card>
    </div>
  );

  return (
    <div className="fadein" style={{position:"fixed",inset:0,zIndex:300,background:"#000000DD",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div className="rise" style={{background:C.surface,borderRadius:"20px 20px 0 0",border:`1px solid ${C.border}`,width:"100%",maxWidth:480,padding:"32px 24px 48px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{height:4,background:`linear-gradient(90deg,${C.sunrise},${C.gold},${C.mint})`,borderRadius:99,marginBottom:28}}/>

        <div style={{textAlign:"center",marginBottom:24}}>
          <Logo size={20}/>
          <H size={26} style={{marginTop:16,marginBottom:8}}>Unlock Your <span className="grad-text">Full Potential</span></H>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.65}}>Your free trial has ended. Continue your transformation.</p>
        </div>

        {/* Billing toggle */}
        <div style={{display:"flex",background:C.card,border:`1px solid ${C.border}`,borderRadius:99,padding:4,marginBottom:24,position:"relative"}}>
          <button onClick={()=>setAnnual(true)} className="tap"
            style={{flex:1,padding:"9px",borderRadius:99,background:annual?`linear-gradient(135deg,${C.sunrise},${C.flame})`:"transparent",border:"none",color:annual?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s",position:"relative"}}>
            Annual
            {annual && <span style={{position:"absolute",top:-8,right:10,background:C.mint,color:"#000",fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:99,letterSpacing:.5}}>BEST VALUE</span>}
          </button>
          <button onClick={()=>setAnnual(false)} className="tap"
            style={{flex:1,padding:"9px",borderRadius:99,background:!annual?`linear-gradient(135deg,${C.sunrise},${C.flame})`:"transparent",border:"none",color:!annual?"#fff":C.muted,fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .2s"}}>
            Monthly
          </button>
        </div>

        {/* Price display */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <p style={{color:C.gold,fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:700,lineHeight:1}}>{annual ? ANNUAL_PRICE : MONTHLY_PRICE}</p>
          <p style={{color:C.muted,fontSize:12,marginTop:6}}>{annual ? ANNUAL_MONTHLY : MONTHLY_NOTE}</p>
          {annual && <p style={{color:C.mint,fontSize:11,marginTop:4,fontWeight:600}}>Save 40% vs monthly</p>}
        </div>

        {[
          "Unlimited weekly planning cycles",
          "Unlimited 90-day goal sets",
          "Full identity declaration library",
          "Multi-year goal tracking",
          "AI-powered goal suggestions",
          "Progress analytics & charts",
          "Priority access to new features",
        ].map((f,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:11}}>
            <div style={{width:20,height:20,borderRadius:"50%",background:`${C.mint}20`,border:`1px solid ${C.mint}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icons.Check size={10} color={C.mint}/>
            </div>
            <span style={{color:C.text,fontSize:13}}>{f}</span>
          </div>
        ))}

        <Divider/>
        <Btn full onClick={subscribe} style={{padding:"16px",fontSize:15,marginBottom:12}}>
          {loading ? "Processing..." : `Subscribe ${annual?"Annually":"Monthly"} — Start Today`}
        </Btn>
        {onClose && <button onClick={onClose} style={{width:"100%",background:"transparent",border:"none",color:C.muted,fontSize:12,padding:"10px",cursor:"pointer"}}>Maybe later</button>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH SCREEN  — Google / Apple / Email (UI only)
═══════════════════════════════════════════════════════════ */
function AuthScreen({ onNext }) {
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [isLogin, setIsLogin]     = useState(false);

  const handleSocial = (provider) => {
    // UI only — real OAuth wired in data layer phase
    onNext({ provider });
  };

  const handleEmail = () => {
    if (!email.trim() || !password.trim()) return;
    onNext({ provider: "email", email: email.trim() });
  };

  return (
    <div className="fadein" style={{minHeight:"100vh",background:C.void,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      {/* Background glow */}
      <div style={{position:"absolute",top:"10%",left:"50%",transform:"translateX(-50%)",width:340,height:340,borderRadius:"50%",background:`radial-gradient(circle,${C.sunrise}12 0%,transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"5%",right:"-10%",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}0E 0%,transparent 65%)`,pointerEvents:"none"}}/>

      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px"}}>
        {/* Logo */}
        <div className="float" style={{marginBottom:32}}>
          <Logo size={22}/>
        </div>

        {/* Headline */}
        <H size={34} style={{textAlign:"center",marginBottom:10,lineHeight:1.1}}>
          Your Best<br/><span className="grad-text">Self Awaits.</span>
        </H>
        <p style={{color:C.muted,fontSize:14,textAlign:"center",lineHeight:1.7,marginBottom:40,maxWidth:300}}>
          {isLogin ? "Welcome back. Pick up where you left off." : `Start your free ${TRIAL_DAYS}-day trial. No credit card needed.`}
        </p>

        {!emailMode ? (
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:12}}>
            {/* Google */}
            <button onClick={()=>handleSocial("google")} className="tap"
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",color:C.cream,fontSize:14,fontWeight:600,transition:"border-color .2s"}}
              onMouseOver={e=>e.currentTarget.style.borderColor=C.sunrise}
              onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
              <svg width={20} height={20} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Apple */}
            <button onClick={()=>handleSocial("apple")} className="tap"
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",color:C.cream,fontSize:14,fontWeight:600,transition:"border-color .2s"}}
              onMouseOver={e=>e.currentTarget.style.borderColor=C.cream}
              onMouseOut={e=>e.currentTarget.style.borderColor=C.border}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill={C.cream}>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </button>

            {/* Divider */}
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
              <div style={{flex:1,height:1,background:C.border}}/>
              <span style={{color:C.faint,fontSize:11,letterSpacing:1}}>OR</span>
              <div style={{flex:1,height:1,background:C.border}}/>
            </div>

            {/* Email */}
            <button onClick={()=>setEmailMode(true)} className="tap"
              style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",color:C.muted,fontSize:14,fontWeight:600}}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
              Continue with Email
            </button>

            {/* Toggle login/signup */}
            <p style={{textAlign:"center",color:C.faint,fontSize:12,marginTop:8}}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={()=>setIsLogin(!isLogin)} style={{color:C.sunrise,cursor:"pointer",fontWeight:600}}>
                {isLogin ? "Sign up free" : "Log in"}
              </span>
            </p>
          </div>
        ) : (
          /* Email form */
          <div className="fadein" style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:14}}>
            <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:2}}>EMAIL</p>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" type="email"
              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:14,padding:"13px 16px",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor=C.sunrise} onBlur={e=>e.target.style.borderColor=C.border}/>
            <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:2,marginTop:4}}>PASSWORD</p>
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password" type="password"
              style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:14,padding:"13px 16px",outline:"none",fontFamily:"'Plus Jakarta Sans',sans-serif"}}
              onFocus={e=>e.target.style.borderColor=C.sunrise} onBlur={e=>e.target.style.borderColor=C.border}
              onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
            <Btn full onClick={handleEmail} style={{padding:"15px",marginTop:4}}>
              {isLogin ? "Log In" : "Create Account"}
            </Btn>
            <button onClick={()=>setEmailMode(false)} style={{background:"transparent",border:"none",color:C.faint,fontSize:12,cursor:"pointer",padding:"8px"}}>
              ← Back to sign in options
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{textAlign:"center",color:C.faint,fontSize:10,padding:"0 24px 32px",lineHeight:1.6}}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DEMOGRAPHICS SCREEN  — optional profile enrichment
═══════════════════════════════════════════════════════════ */
function DemographicsScreen({ authData, onDone }) {
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("");
  const [age,  setAge]    = useState("");
  const [focus, setFocus] = useState("");

  const FOCUS_OPTIONS = [
    "Career Growth",
    "Health & Fitness",
    "Entrepreneurship",
    "Faith & Purpose",
    "Financial Freedom",
    "Relationships",
    "Personal Development",
  ];

  return (
    <div className="fadein" style={{minHeight:"100vh",background:C.void,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"20%",right:"-5%",width:220,height:220,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}10 0%,transparent 65%)`,pointerEvents:"none"}}/>

      {/* Progress bar — step 2 of 3 */}
      <div style={{padding:"20px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size={16}/>
        <div style={{display:"flex",gap:6}}>
          {[0,1,2].map(i=><div key={i} style={{height:3,width:i<=1?28:7,borderRadius:99,background:i<=1?C.sunrise:C.faint,transition:"all .4s"}}/>)}
        </div>
      </div>
      <div style={{margin:"16px 24px 0",height:1,background:`linear-gradient(90deg,${C.sunrise}66,transparent)`}}/>

      <div style={{flex:1,padding:"32px 28px 24px",overflowY:"auto"}}>
        <Lbl>STEP 2 OF 3</Lbl>
        <H size={30} style={{marginBottom:8}}>Tell us about<br/><span className="grad-text">yourself</span></H>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:28}}>This helps BestSelf personalize your experience. All fields optional — skip any you prefer.</p>

        {/* Name */}
        <div style={{marginBottom:20}}>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:8}}>YOUR NAME <span style={{color:C.sunrise}}>*</span></p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"
            style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:16,fontFamily:"'Cormorant Garamond',serif",padding:"13px 16px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=C.sunrise} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>

        {/* Role */}
        <div style={{marginBottom:20}}>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:8}}>ROLE OR TAGLINE <span style={{color:C.faint,fontSize:9}}>(optional)</span></p>
          <input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior Manager · Entrepreneur"
            style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:14,fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"13px 16px",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=C.sunrise} onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>

        {/* Age range */}
        <div style={{marginBottom:20}}>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:10}}>AGE RANGE <span style={{color:C.faint,fontSize:9}}>(optional)</span></p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["18–24","25–34","35–44","45–54","55+"].map(a=>(
              <button key={a} onClick={()=>setAge(age===a?"":a)} className="tap"
                style={{padding:"8px 16px",borderRadius:99,border:`1px solid ${age===a?C.sunrise:C.border}`,background:age===a?`${C.sunrise}18`:"transparent",color:age===a?C.sunrise:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Primary focus */}
        <div style={{marginBottom:32}}>
          <p style={{color:C.muted,fontSize:10,letterSpacing:2,marginBottom:10}}>PRIMARY FOCUS <span style={{color:C.faint,fontSize:9}}>(optional)</span></p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {FOCUS_OPTIONS.map(f=>(
              <button key={f} onClick={()=>setFocus(focus===f?"":f)} className="tap"
                style={{padding:"8px 14px",borderRadius:99,border:`1px solid ${focus===f?C.gold:C.border}`,background:focus===f?`${C.gold}18`:"transparent",color:focus===f?C.gold:C.muted,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Trial notice */}
        <div style={{background:C.card,border:`1px solid ${C.gold}33`,borderRadius:10,padding:"14px 16px",marginBottom:24}}>
          <p style={{color:C.gold,fontSize:12,fontWeight:600,marginBottom:4}}>Free {TRIAL_DAYS}-Day Trial</p>
          <p style={{color:C.muted,fontSize:12,lineHeight:1.6}}>Full access for {TRIAL_DAYS} days. Then just {PLAN_PRICE}. No credit card required to start.</p>
        </div>

        <Btn full onClick={()=>{ if(name.trim()) onDone(name.trim(), role.trim(), age, focus); }}
          style={{padding:"16px",fontSize:15}}>
          Continue →
        </Btn>
        <button onClick={()=>{ if(name.trim()) onDone(name.trim(), role.trim(), age, focus); else onDone("Champion","","",""); }}
          style={{width:"100%",background:"transparent",border:"none",color:C.faint,fontSize:12,padding:"12px",cursor:"pointer",marginTop:4}}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ONBOARDING SLIDES
═══════════════════════════════════════════════════════════ */
function Onboarding({ onDone }) {
  const [authStage, setAuthStage]   = useState("auth");   // "auth" | "demo" | "slides"
  const [authData,  setAuthData]    = useState(null);
  const [demoData,  setDemoData]    = useState(null);
  const [step,      setStep]        = useState(0);

  const s    = ONBOARD_SLIDES[step];
  const last = step === ONBOARD_SLIDES.length - 1;

  if (authStage === "auth") return (
    <AuthScreen onNext={(ad) => { setAuthData(ad); setAuthStage("demo"); }}/>
  );

  if (authStage === "demo") return (
    <DemographicsScreen authData={authData} onDone={(name, role, age, focus) => {
      setDemoData({ name, role, age, focus });
      setAuthStage("slides");
    }}/>
  );

  // Onboarding slides (step 3 of 3)
  return (
    <div key={step} style={{minHeight:"100vh",background:C.deep,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div className="float" style={{position:"absolute",top:"8%",right:"-8%",width:260,height:260,borderRadius:"50%",background:`radial-gradient(circle,${s.accent}16 0%,transparent 65%)`,pointerEvents:"none"}}/>
      <div className="float" style={{position:"absolute",bottom:"16%",left:"-12%",width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${s.accent}0E 0%,transparent 65%)`,pointerEvents:"none",animationDelay:"2.2s"}}/>

      {/* Logo + progress dots */}
      <div style={{padding:"24px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size={16}/>
        <div style={{display:"flex",gap:6}}>
          {[0,1,2].map(i=><div key={i} style={{height:3,width:i<=2?28:7,borderRadius:99,background:i<=step?s.accent:C.faint,transition:"all .4s"}}/>)}
        </div>
      </div>
      <div style={{margin:"20px 24px 0",height:1,background:`linear-gradient(90deg,${s.accent}66,transparent)`}}/>

      <div className="rise" style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 28px 24px"}}>
        <Lbl style={{marginBottom:12}}>STEP 3 OF 3</Lbl>
        <H size={40} style={{marginBottom:20,whiteSpace:"pre-line",lineHeight:1.1}}>
          {s.title.split("\n").map((line,i)=>
            i===1 ? <span key={i} style={{color:s.accent}}>{line}<br/></span>
                  : <span key={i}>{line}<br/></span>
          )}
        </H>
        <p style={{color:C.muted,fontSize:15,lineHeight:1.75,maxWidth:320}}>{s.body}</p>
      </div>

      <div style={{padding:"0 28px 52px"}}>
        <Btn full onClick={()=>{ if(last) onDone(demoData.name, demoData.role); else setStep(s=>s+1); }} style={{padding:"17px",fontSize:15}}>{s.cta}</Btn>
        {step>0 && <button onClick={()=>setStep(s=>s-1)} style={{width:"100%",background:"transparent",border:"none",color:C.muted,padding:"12px",fontSize:13,cursor:"pointer",marginTop:4}}>Back</button>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   QUOTE ENGINE  — changes every time the app is opened
═══════════════════════════════════════════════════════════ */
function useRotatingQuote(data, setData) {
  const [quote, setQuote] = useState(null);
  useEffect(()=>{
    const today = new Date().toISOString().slice(0,10);
    const lastIdx = data.lastQuoteIdx ?? -1;
    let nextIdx;
    // If opened on a new day OR first time, rotate
    if (data.lastOpenDate !== today || lastIdx < 0) {
      do { nextIdx = Math.floor(Math.random()*QUOTES.length); } while (nextIdx === lastIdx && QUOTES.length > 1);
      setData(d=>({...d, lastQuoteIdx:nextIdx, lastOpenDate:today}));
    } else {
      nextIdx = lastIdx;
    }
    setQuote(QUOTES[nextIdx]);
  },[]);
  return quote;
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
function Dashboard({ data, setData, showMilestone }) {
  const quote = useRotatingQuote(data, setData);
  const days  = Math.min(90, Math.max(0, Math.floor((Date.now()-new Date(data.user.trialStart||data.user.joinDate))/86400000)));
  const pct90 = Math.round((days/90)*100);
  const lastW = data.weeks[data.weeks.length-1];
  const totalGoals = (data.cycleGoalSets[data.cycleGoalSets.length-1]?.goals
    ? DIMS.reduce((a,d)=>a+(data.cycleGoalSets[data.cycleGoalSets.length-1].goals[d.key]||[]).filter(g=>g.trim()).length,0)
    : 0);
  const daysLeft = trialDaysLeft(data.user);
  const trialActive = daysLeft > 0 && !data.user.subscribed;
  const streak = computeStreak(data.weeks);
  const milestone = getMilestone(streak);

  return (
    <div>
      {/* Trial banner */}
      {trialActive && (
        <div style={{background:`linear-gradient(90deg,${C.gold}18,${C.sunrise}10)`,border:`1px solid ${C.gold}40`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{color:C.gold,fontSize:11,fontWeight:700,letterSpacing:1}}>FREE TRIAL</p>
            <p style={{color:C.muted,fontSize:12,marginTop:2}}>{daysLeft} days remaining</p>
          </div>
          <Bar value={TRIAL_DAYS-daysLeft} max={TRIAL_DAYS} color={C.gold} h={4}/>
        </div>
      )}

      {/* Hero */}
      <div style={{position:"relative",borderRadius:16,overflow:"hidden",marginBottom:18,background:`linear-gradient(135deg,${C.surface} 0%,#161C2A 100%)`,border:`1px solid ${C.border}`,padding:"22px 18px"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${C.sunrise}18 0%,transparent 65%)`}}/>
        <div style={{position:"absolute",bottom:-40,left:-20,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}12 0%,transparent 65%)`}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,position:"relative"}}>
          <Avatar name={data.user.name} size={52}/>
          <div>
            <p style={{color:C.muted,fontSize:10,letterSpacing:2.5,fontWeight:600,marginBottom:3}}>WELCOME BACK</p>
            <H size={22}>{data.user.name||"Champion"}</H>
            {data.user.role && <p style={{color:C.muted,fontSize:11,marginTop:3}}>{data.user.role}</p>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:18,position:"relative"}}>
          <Ring pct={pct90} size={78} color={C.sunrise}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:700,color:C.cream}}>{pct90}%</span>
            <span style={{fontSize:8,color:C.muted,letterSpacing:1}}>DONE</span>
          </Ring>
          <div style={{flex:1}}>
            <p style={{color:C.cream,fontSize:14,fontFamily:"'Cormorant Garamond',serif",marginBottom:8}}>
              Day <strong style={{color:C.sunrise}}>{days}</strong> of your 90-day cycle
            </p>
            <Bar value={days} max={90} h={6} color={`linear-gradient(90deg,${C.sunrise},${C.gold})`}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
              <span style={{color:C.muted,fontSize:11}}>Started {new Date(data.user.trialStart||data.user.joinDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
              <span style={{color:C.muted,fontSize:11}}>{Math.max(0,90-days)} days left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rotating quote */}
      {quote && (
        <div className="rise" style={{background:`linear-gradient(135deg,${C.card},${C.surface})`,border:`1px solid ${C.gold}28`,borderLeft:`3px solid ${C.gold}`,borderRadius:10,padding:"16px 18px",marginBottom:18}}>
          <p style={{color:C.gold,fontSize:9,letterSpacing:3,fontWeight:600,marginBottom:8}}>DAILY FUEL</p>
          <p style={{color:"#E8D9A0",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:15,lineHeight:1.65,marginBottom:6}}>"{quote.q}"</p>
          <p style={{color:C.muted,fontSize:11}}>— {quote.a}</p>
        </div>
      )}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        {[
          {label:"Week Streak",   value:streak,                                              color:C.gold,   sub: milestone?.label || null},
          {label:"Blueprints",     value:data.weeks.length,                                   color:C.mint},
          {label:"90-Day Goals",   value:totalGoals,                                          color:"#60A5FA"},
          {label:"Audited",        value:data.weeks.filter(w=>w.done).length,                 color:C.sunrise},
        ].map((s,i)=>(
          <div key={i} className="lift" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 14px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.color},transparent)`}}/>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.cream,fontWeight:700,lineHeight:1,marginBottom:4}}>{s.value}</div>
            <div style={{color:C.muted,fontSize:10,letterSpacing:1,fontWeight:600}}>{s.label.toUpperCase()}</div>
            {s.sub && <div style={{marginTop:6}}><Pill color={C.gold}>{s.sub}</Pill></div>}
          </div>
        ))}
      </div>

      {/* Last week wins */}
      {lastW && lastW.wins.some(Boolean) && (
        <Card glow={C.mint} style={{marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <Lbl color={C.mint}>Last Week's Wins</Lbl>
            <Pill color={C.mint}>Logged</Pill>
          </div>
          {lastW.wins.filter(Boolean).map((w,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:`${C.mint}18`,border:`1px solid ${C.mint}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.mint}}/>
              </div>
              <span style={{color:C.text,fontSize:13,lineHeight:1.55}}>{w}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Dimension coverage */}
      {data.cycleGoalSets.length>0 && (
        <Card>
          <Lbl>90-Day Goal Coverage</Lbl>
          {DIMS.map(dim=>{
            const n=(data.cycleGoalSets[data.cycleGoalSets.length-1]?.goals?.[dim.key]||[]).filter(g=>g.trim()).length;
            return (
              <div key={dim.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:dim.color,flexShrink:0}}/>
                <span style={{color:C.muted,fontSize:11,minWidth:90,fontWeight:500}}>{dim.label}</span>
                <div style={{flex:1}}><Bar value={n} max={5} color={dim.color} h={3}/></div>
                <span style={{color:dim.color,fontSize:11,minWidth:12,textAlign:"right",fontWeight:700}}>{n}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANNUAL GOALS  — multi-year support
═══════════════════════════════════════════════════════════ */
function AnnualGoals({ data, setData, showPaywall }) {
  const sets = data.annualGoalSets || [];
  const currentYear = new Date().getFullYear();
  const [activeIdx, setActiveIdx] = useState(sets.length > 0 ? sets.length-1 : null);

  const addYear = () => {
    const existing = sets.map(s=>s.year);
    let y = currentYear;
    while(existing.includes(y)) y++;
    const ns = { year:y, goals:blankGoals() };
    setData(d=>({...d, annualGoalSets:[...(d.annualGoalSets||[]),ns]}));
    setActiveIdx(sets.length);
  };

  const updGoals = (setIdx, dim, items) => {
    setData(d=>{
      const ss=[...d.annualGoalSets];
      ss[setIdx]={...ss[setIdx],goals:{...ss[setIdx].goals,[dim]:items}};
      return {...d,annualGoalSets:ss};
    });
  };

  const updChecked = (setIdx, dim, checked) => {
    setData(d=>{
      const ss=[...d.annualGoalSets];
      const prev = ss[setIdx].checked || {};
      ss[setIdx]={...ss[setIdx],checked:{...prev,[dim]:checked}};
      return {...d,annualGoalSets:ss};
    });
  };

  const toggleGoal = (setIdx, dim, goalIdx) => {
    const prev = (sets[setIdx]?.checked?.[dim]) || [];
    const next = [...prev];
    next[goalIdx] = !next[goalIdx];
    updChecked(setIdx, dim, next);
  };

  // Empty state
  if (sets.length===0) return (
    <div>
      <H size={26} style={{marginBottom:6}}>Annual Goals</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:40,lineHeight:1.65}}>Define your vision for the full year across every dimension of life.</p>
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        <div className="float" style={{width:64,height:64,borderRadius:16,background:`${C.sunrise}18`,border:`1px solid ${C.sunrise}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${C.sunrise}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.sunrise,fontSize:16,fontWeight:700}}>+</span></div>
        </div>
        <H size={20} style={{marginBottom:8}}>Set Your First Year's Goals</H>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.65,marginBottom:24}}>Map out every dimension of your life for {currentYear} and beyond.</p>
        <Btn onClick={addYear}>Create {currentYear} Goals</Btn>
      </div>
    </div>
  );

  const active = activeIdx !== null ? sets[activeIdx] : null;

  return (
    <div>
      {/* Year selector */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {sets.map((s,i)=>(
          <button key={i} onClick={()=>setActiveIdx(i)} className="tap"
            style={{flexShrink:0,padding:"7px 16px",borderRadius:99,background:activeIdx===i?`linear-gradient(135deg,${C.sunrise},${C.flame})`:`${C.card}`,border:`1px solid ${activeIdx===i?"transparent":C.border}`,color:activeIdx===i?"#fff":C.muted,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            {s.year}
          </button>
        ))}
        <button onClick={addYear} className="tap"
          style={{flexShrink:0,padding:"7px 16px",borderRadius:99,background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,fontSize:13,cursor:"pointer"}}>
          + New Year
        </button>
      </div>

      {active && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <H size={26}>{active.year} Goals</H>
            <button onClick={()=>{
              if(window.confirm(`Delete ${active.year} goals?`)){
                setData(d=>{const ss=[...d.annualGoalSets];ss.splice(activeIdx,1);return{...d,annualGoalSets:ss};});
                setActiveIdx(sets.length>1?sets.length-2:null);
              }
            }} style={{background:"transparent",border:"none",color:C.faint,fontSize:11,cursor:"pointer"}}>Remove year</button>
          </div>

          {DIMS.map((dim,i)=>(
            <div key={dim.key} className="rise" style={{animationDelay:`${i*30}ms`,marginBottom:12}}>
              <Card className="lift" style={{borderTop:`2px solid ${dim.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <div style={{width:30,height:30,borderRadius:7,background:`${dim.color}18`,border:`1px solid ${dim.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:dim.color}}/>
                  </div>
                  <Lbl color={dim.color}>{dim.label}</Lbl>
                </div>
                <GoalList
                  items={active.goals[dim.key]||["",""]}
                  checked={active.checked?.[dim.key]||[]}
                  onChange={items=>updGoals(activeIdx,dim.key,items)}
                  onToggle={i=>toggleGoal(activeIdx,dim.key,i)}
                  placeholder={`${dim.label} goal for ${active.year}...`}
                  accentColor={dim.color}
                />
                <button onClick={()=>updGoals(activeIdx,dim.key,[...(active.goals[dim.key]||[]),""])}
                  style={{marginTop:10,background:"transparent",border:`1px dashed ${dim.color}38`,color:dim.color,padding:"6px",borderRadius:6,width:"100%",fontSize:11,fontWeight:600,letterSpacing:1,cursor:"pointer"}}>
                  + Add Goal
                </button>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   90-DAY GOALS  — multi-cycle support
═══════════════════════════════════════════════════════════ */
function Goals90({ data, setData, showPaywall }) {
  const sets = data.cycleGoalSets || [];
  const [activeIdx, setActiveIdx] = useState(sets.length>0?sets.length-1:null);
  const [naming, setNaming] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [aiLoading, setAiLoading] = useState(null); // dim key being loaded
  const [aiError, setAiError]   = useState(null);

  const addCycle = () => {
    const label = newLabel.trim() || `Cycle ${sets.length+1}`;
    const ns = { label, startDate:new Date().toISOString().slice(0,10), goals:blankGoals() };
    setData(d=>({...d,cycleGoalSets:[...(d.cycleGoalSets||[]),ns]}));
    setActiveIdx(sets.length);
    setNaming(false); setNewLabel("");
  };

  const updGoals = (setIdx, dim, items) => {
    setData(d=>{
      const ss=[...d.cycleGoalSets];
      ss[setIdx]={...ss[setIdx],goals:{...ss[setIdx].goals,[dim]:items}};
      return {...d,cycleGoalSets:ss};
    });
  };

  const toggleGoal90 = (setIdx, dim, goalIdx) => {
    setData(d=>{
      const ss=[...d.cycleGoalSets];
      const prev = ss[setIdx].checked || {};
      const arr = [...(prev[dim]||[])];
      arr[goalIdx] = !arr[goalIdx];
      ss[setIdx]={...ss[setIdx],checked:{...prev,[dim]:arr}};
      return {...d,cycleGoalSets:ss};
    });
  };

  const suggestWithAI = async (dim) => {
    if (aiLoading) return;
    setAiLoading(dim.key); setAiError(null);
    try {
      const existing = active?.goals?.[dim.key] || [];
      const suggestions = await fetchAISuggestions(dim.label, existing, data.user.name);
      if (suggestions.length > 0) updGoals(activeIdx, dim.key, suggestions);
    } catch(e) { setAiError(dim.key); }
    finally { setAiLoading(null); }
  };

  if (sets.length===0) return (
    <div>
      <H size={26} style={{marginBottom:6}}>90-Day Goals</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:40,lineHeight:1.65}}>Your 90-day sprint. Set focused goals for each area of life and crush them.</p>
      <div style={{textAlign:"center",padding:"40px 20px"}}>
        <div className="float" style={{width:64,height:64,borderRadius:16,background:`${C.gold}18`,border:`1px solid ${C.gold}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${C.gold}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.gold,fontSize:16,fontWeight:700}}>+</span></div>
        </div>
        <H size={20} style={{marginBottom:8}}>Start Your First 90-Day Cycle</H>
        <p style={{color:C.muted,fontSize:13,lineHeight:1.65,marginBottom:24}}>90 days is all you need to create a quantum leap in your life.</p>
        <Btn onClick={()=>setNaming(true)}>Create First Cycle</Btn>
      </div>
      {naming && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"#000000BB",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <Card style={{width:"100%",maxWidth:360,padding:"28px 24px"}}>
            <H size={20} style={{marginBottom:6}}>Name Your Cycle</H>
            <p style={{color:C.muted,fontSize:13,marginBottom:16}}>e.g. "Q1 2026" or "Launch Sprint"</p>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Q1 2026"
              className="il" style={{fontSize:16,fontFamily:"'Cormorant Garamond',serif",marginBottom:20}}
              onKeyDown={e=>e.key==="Enter"&&addCycle()}/>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={addCycle} full>Create Cycle</Btn>
              <Btn ghost onClick={()=>setNaming(false)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const active = activeIdx !== null ? sets[activeIdx] : null;

  return (
    <div>
      {/* Cycle selector */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {sets.map((s,i)=>(
          <button key={i} onClick={()=>setActiveIdx(i)} className="tap"
            style={{flexShrink:0,padding:"7px 16px",borderRadius:99,background:activeIdx===i?`linear-gradient(135deg,${C.gold},${C.flame})`:"transparent",border:`1px solid ${activeIdx===i?"transparent":C.border}`,color:activeIdx===i?C.void:C.muted,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
            {s.label}
          </button>
        ))}
        <button onClick={()=>setNaming(true)} className="tap"
          style={{flexShrink:0,padding:"7px 16px",borderRadius:99,background:"transparent",border:`1px dashed ${C.border}`,color:C.muted,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>
          + New Cycle
        </button>
      </div>

      {/* Add cycle modal */}
      {naming && (
        <div style={{position:"fixed",inset:0,zIndex:200,background:"#000000BB",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <Card style={{width:"100%",maxWidth:360,padding:"28px 24px"}}>
            <H size={20} style={{marginBottom:6}}>Name Your New Cycle</H>
            <p style={{color:C.muted,fontSize:13,marginBottom:16}}>e.g. "Q2 2026" or "Summer Sprint"</p>
            <input value={newLabel} onChange={e=>setNewLabel(e.target.value)} placeholder="Q2 2026"
              className="il" style={{fontSize:16,fontFamily:"'Cormorant Garamond',serif",marginBottom:20}}
              onKeyDown={e=>e.key==="Enter"&&addCycle()}/>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={addCycle} full>Create</Btn>
              <Btn ghost onClick={()=>setNaming(false)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {active && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <H size={24}>{active.label}</H>
              <p style={{color:C.muted,fontSize:11,marginTop:3}}>Started {new Date(active.startDate).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
            </div>
            <button onClick={()=>{
              if(window.confirm(`Remove "${active.label}"?`)){
                setData(d=>{const ss=[...d.cycleGoalSets];ss.splice(activeIdx,1);return{...d,cycleGoalSets:ss};});
                setActiveIdx(sets.length>1?sets.length-2:null);
              }
            }} style={{background:"transparent",border:"none",color:C.faint,fontSize:11,cursor:"pointer"}}>Remove</button>
          </div>

          {DIMS.map((dim,i)=>(
            <div key={dim.key} className="rise" style={{animationDelay:`${i*30}ms`,marginBottom:12}}>
              <Card className="lift" style={{borderTop:`2px solid ${dim.color}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:30,height:30,borderRadius:7,background:`${dim.color}18`,border:`1px solid ${dim.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:dim.color}}/>
                    </div>
                    <Lbl color={dim.color}>{dim.label}</Lbl>
                  </div>
                  <button onClick={()=>suggestWithAI(dim)} disabled={!!aiLoading} className="tap"
                    style={{background:aiLoading===dim.key?`${C.lavender}18`:`${C.lavender}14`,border:`1px solid ${C.lavender}33`,color:C.lavender,padding:"5px 10px",borderRadius:6,fontSize:10,fontWeight:600,letterSpacing:.5,cursor:"pointer",display:"flex",alignItems:"center",gap:6,opacity:aiLoading&&aiLoading!==dim.key?0.4:1}}>
                    {aiLoading===dim.key ? (
                      <div style={{width:10,height:10,border:`1.5px solid ${C.lavender}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                    ) : (
                      <svg width={10} height={10} viewBox="0 0 12 12" fill={C.lavender}><path d="M6 1l1.2 3.8H11L8 7l1.2 3.8L6 8.5 2.8 10.8 4 7 1 4.8h3.8z"/></svg>
                    )}
                    {aiLoading===dim.key ? "Thinking..." : "AI Suggest"}
                  </button>
                </div>
                {aiError===dim.key && <p style={{color:C.coral,fontSize:11,marginBottom:8}}>Could not generate suggestions. Try again.</p>}
                <GoalList
                  items={active.goals[dim.key]||["",""]}
                  checked={active.checked?.[dim.key]||[]}
                  onChange={items=>updGoals(activeIdx,dim.key,items)}
                  onToggle={i=>toggleGoal90(activeIdx,dim.key,i)}
                  placeholder={`${dim.label} goal...`}
                  accentColor={dim.color}
                />
                <button onClick={()=>updGoals(activeIdx,dim.key,[...(active.goals[dim.key]||[]),""])}
                  style={{marginTop:10,background:"transparent",border:`1px dashed ${dim.color}38`,color:dim.color,padding:"6px",borderRadius:6,width:"100%",fontSize:11,fontWeight:600,letterSpacing:1,cursor:"pointer"}}>
                  + Add Goal
                </button>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEEKLY PLANNER  (unchanged structure, no emojis)
═══════════════════════════════════════════════════════════ */
function Weekly({ data, setData }) {
  const [view, setView]     = useState("list");
  const [idx, setIdx]       = useState(null);
  const [shareIdx, setShareIdx] = useState(null);

  const add = () => {
    const w = newWeek(), ni = data.weeks.length;
    setData(d=>({...d,weeks:[...d.weeks,w]}));
    setIdx(ni); setView("plan");
  };
  const upd = fn => setData(d=>{ const ws=[...d.weeks]; ws[idx]=fn(ws[idx]); return {...d,weeks:ws}; });
  const w = idx!==null ? data.weeks[idx] : null;

  if (view==="plan" && w) return (
    <div className="fadein">
      <button onClick={()=>{setView("list");setIdx(null);}} style={{background:"transparent",border:"none",color:C.muted,fontSize:13,cursor:"pointer",marginBottom:20}}>← All Weeks</button>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div>
          <Pill>Week {idx+1}</Pill>
          <H size={24} style={{marginTop:8}}>Weekly Blueprint</H>
          <p style={{color:C.muted,fontSize:12,marginTop:4}}>{new Date(w.date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        </div>
        <Btn ghost small onClick={()=>setView("reflect")}>Audit</Btn>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card glow={C.gold}><Lbl color={C.gold}>Last Week's Wins</Lbl><NumList items={w.wins} onChange={v=>upd(wk=>({...wk,wins:v}))} placeholder="A result worth noting..."/></Card>
        <Card><Lbl color={C.sunrise}>This Week's Priorities</Lbl><NumList items={w.goals} onChange={v=>upd(wk=>({...wk,goals:v}))} placeholder="This week I will deliver..."/></Card>
        {[0,1,2].map(gi=>(
          <Card key={gi} style={{borderLeft:`2px solid #60A5FA`}}>
            <Lbl color="#60A5FA">Blueprint Block — Priority {gi+1}{w.goals[gi]?`: ${w.goals[gi].slice(0,26)}${w.goals[gi].length>26?"…":""}`:""}</Lbl>
            <p style={{color:C.faint,fontSize:10,fontStyle:"italic",marginBottom:8}}>Define your success metric + key moves</p>
            <NumList items={w.actions[gi]} onChange={v=>upd(wk=>{const a=[...wk.actions];a[gi]=v;return{...wk,actions:a};})} placeholder="Specific move to execute..."/>
          </Card>
        ))}
        <Card style={{borderLeft:`2px solid ${C.mint}`}}><Lbl color={C.mint}>My Operating Mode This Week</Lbl><NumList items={w.showUp} onChange={v=>upd(wk=>({...wk,showUp:v}))} placeholder="I will operate as..."/></Card>
        <Card style={{borderLeft:`2px solid ${C.coral}`}}><Lbl color={C.coral}>Blockers to Eliminate</Lbl><NumList items={w.limiting} onChange={v=>upd(wk=>({...wk,limiting:v}))} placeholder="I'm removing this from my thinking..."/></Card>
        <Card style={{borderLeft:`2px solid ${C.lavender}`}}><Lbl color={C.lavender}>Reframes That Drive Me</Lbl><NumList items={w.empowering} onChange={v=>upd(wk=>({...wk,empowering:v}))} placeholder="The belief I'm activating instead..."/></Card>
        <Btn full onClick={()=>setView("reflect")} style={{padding:"15px",fontSize:14}}>End of Week — Run the Audit</Btn>
      </div>
    </div>
  );

  if (view==="reflect" && w) return (
    <div className="fadein">
      <button onClick={()=>setView("plan")} style={{background:"transparent",border:"none",color:C.muted,fontSize:13,cursor:"pointer",marginBottom:20}}>← Back to Blueprint</button>
      <H size={24} style={{marginBottom:6}}>Weekly Audit</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:22}}>Accountability debrief — be honest, be precise</p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card><Lbl>What Did This Week Reveal?</Lbl><NumList items={w.learned} onChange={v=>upd(wk=>({...wk,learned:v}))} placeholder="This week exposed..."/></Card>
        <Card style={{borderLeft:`2px solid ${C.mint}`}}><Lbl color={C.mint}>What Drove Results?</Lbl><NumList items={w.worked} onChange={v=>upd(wk=>({...wk,worked:v}))} placeholder="This moved the needle because..."/></Card>
        <Card style={{borderLeft:`2px solid ${C.coral}`}}><Lbl color={C.coral}>Where Did I Lose Momentum?</Lbl><NumList items={w.avoided} onChange={v=>upd(wk=>({...wk,avoided:v}))} placeholder="I stalled on..."/></Card>
        <Card><Lbl>If I Ran This Play Again...</Lbl><NumList items={w.doOver} onChange={v=>upd(wk=>({...wk,doOver:v}))} placeholder="I would have executed differently by..."/></Card>
        <div style={{background:`linear-gradient(135deg,${C.card},#12111A)`,border:`1px solid ${C.lavender}28`,borderRadius:12,padding:"20px 16px"}}>
          <Lbl color={C.lavender}>Identity Anchors</Lbl>
          {w.iAm.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{color:C.lavender,fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic",minWidth:30,flexShrink:0}}>I am</span>
              <input value={s} onChange={e=>{const a=[...w.iAm];a[i]=e.target.value;upd(wk=>({...wk,iAm:a}));}}
                placeholder="...unstoppable, focused, purpose-driven"
                style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:"#C4B5FD",fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",outline:"none",padding:"6px 2px"}}/>
            </div>
          ))}
        </div>
        <Btn full onClick={()=>{upd(wk=>({...wk,done:true}));setView("list");setIdx(null);}} style={{padding:"15px"}}>Lock In Audit — Week Complete</Btn>
      </div>
    </div>
  );

  return (
    <div>
      {shareIdx !== null && (
        <ShareCard
          week={data.weeks[shareIdx]}
          weekNum={shareIdx+1}
          userName={data.user?.name}
          onClose={()=>setShareIdx(null)}
        />
      )}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <H size={26}>Weekly Blueprint</H>
          <p style={{color:C.muted,fontSize:13,marginTop:4}}>{data.weeks.length} blueprints · {data.weeks.filter(w=>w.done).length} audited</p>
        </div>
        <Btn onClick={add}>+ New Blueprint</Btn>
      </div>

      {data.weeks.length===0 && (
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div className="float" style={{width:64,height:64,borderRadius:16,background:`${C.sunrise}18`,border:`1px solid ${C.sunrise}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${C.sunrise}`}}/>
          </div>
          <H size={22} style={{marginBottom:10}}>Build Your First Weekly Blueprint</H>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:28}}>30 minutes of strategic planning sets the trajectory for your entire week.</p>
          <Btn onClick={add}>Begin Blueprint 1</Btn>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[...data.weeks].reverse().map((wk,ri)=>{
          const i=data.weeks.length-1-ri;
          return (
            <div key={wk.id} className="lift" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}
              onClick={()=>{setIdx(i);setView(wk.done?"reflect":"plan");}}>
              <div style={{width:46,height:46,borderRadius:10,background:wk.done?`${C.mint}18`:`${C.sunrise}18`,border:`1px solid ${wk.done?C.mint:C.sunrise}33`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${wk.done?C.mint:C.sunrise}`,background:wk.done?`${C.mint}44`:"transparent"}}/>
              </div>
              <div style={{flex:1}}>
                <p style={{color:C.cream,fontFamily:"'Cormorant Garamond',serif",fontSize:15,marginBottom:5}}>
                  Blueprint {i+1} · {new Date(wk.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                </p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Pill color={C.sunrise}>{wk.goals.filter(Boolean).length} priorities</Pill>
                  <Pill color={C.gold}>{wk.wins.filter(Boolean).length} wins</Pill>
                  {wk.done && <Pill color={C.mint}>Audited</Pill>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <span style={{color:C.muted,fontSize:20}}>›</span>
                {wk.done && (
                  <button onClick={e=>{e.stopPropagation();setShareIdx(i);}} className="tap"
                    style={{background:`${C.sunrise}18`,border:`1px solid ${C.sunrise}33`,color:C.sunrise,padding:"4px 8px",borderRadius:6,fontSize:9,fontWeight:700,letterSpacing:.5,cursor:"pointer"}}>
                    SHARE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IDENTITY — layered declaration experience
═══════════════════════════════════════════════════════════ */
function Identity({ data, setData }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [declIdx, setDeclIdx]   = useState({});
  const [customMode, setCustomMode] = useState(false);
  const [todayDecl, setTodayDecl] = useState([]);

  // On mount: pick 3 random declarations across categories for "today"
  useEffect(()=>{
    const picks = [];
    const cats = [...DECL_CATEGORIES];
    // shuffle
    cats.sort(()=>Math.random()-.5);
    cats.slice(0,3).forEach(cat=>{
      const lib = DECLARATIONS[cat.key];
      picks.push({ text: lib[Math.floor(Math.random()*lib.length)], color: cat.color, label: cat.label });
    });
    setTodayDecl(picks);
  },[]);

  const shuffle = (catKey) => {
    const lib = DECLARATIONS[catKey];
    setDeclIdx(prev=>{
      const cur = prev[catKey] ?? 0;
      let next; do { next = Math.floor(Math.random()*lib.length); } while(next===cur && lib.length>1);
      return {...prev,[catKey]:next};
    });
  };

  const custom = data.iAmCustom || [];

  return (
    <div>
      <H size={26} style={{marginBottom:6}}>I Am Statements</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:20,lineHeight:1.65}}>Your identity is the ceiling of your performance. Raise it here.</p>

      {/* Today's declarations — rotates on every render/open */}
      <div style={{background:`linear-gradient(135deg,#12111A,${C.card})`,border:`1px solid ${C.lavender}25`,borderRadius:14,padding:"22px 18px",marginBottom:22,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:`radial-gradient(circle at 50% 30%,${C.lavender}10,transparent 65%)`}}/>
        <Lbl color={C.lavender}>Today's Declarations</Lbl>
        <p style={{color:C.muted,fontSize:11,marginBottom:16}}>Speak these over yourself daily. Refreshes every session.</p>
        {todayDecl.map((d,i)=>(
          <div key={i} className="rise" style={{animationDelay:`${i*120}ms`,marginBottom:14,paddingBottom:14,borderBottom:i<todayDecl.length-1?`1px solid ${C.border}`:"none"}}>
            <p style={{color:d.color,fontSize:9,letterSpacing:2,fontWeight:600,marginBottom:5}}>{d.label.toUpperCase()}</p>
            <p style={{color:C.cream,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:16,lineHeight:1.55}}>{d.text}</p>
          </div>
        ))}
      </div>

      {/* Category browser */}
      <Card style={{marginBottom:16}}>
        <Lbl>Browse by Category</Lbl>
        <p style={{color:C.muted,fontSize:12,marginBottom:14}}>Tap a category to cycle through its declarations.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {DECL_CATEGORIES.map(cat=>{
            const lib = DECLARATIONS[cat.key];
            const idx = declIdx[cat.key] ?? 0;
            const isOpen = activeCategory===cat.key;
            return (
              <div key={cat.key}>
                <button onClick={()=>{setActiveCategory(isOpen?null:cat.key);}} className="tap"
                  style={{width:"100%",background:isOpen?`${cat.color}12`:"transparent",border:`1px solid ${isOpen?cat.color:C.border}`,borderRadius:8,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:cat.color,flexShrink:0}}/>
                    <span style={{color:isOpen?cat.color:C.muted,fontSize:13,fontWeight:600}}>{cat.label}</span>
                  </div>
                  <span style={{color:cat.color,fontSize:12}}>{isOpen?"−":"+"}</span>
                </button>
                {isOpen && (
                  <div className="popin" style={{background:C.surface,border:`1px solid ${cat.color}22`,borderTop:"none",borderRadius:"0 0 8px 8px",padding:"16px 14px"}}>
                    <p style={{color:C.cream,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:15,lineHeight:1.6,marginBottom:14}}>{lib[idx]}</p>
                    <button onClick={()=>shuffle(cat.key)} className="tap"
                      style={{background:`${cat.color}18`,border:`1px solid ${cat.color}33`,color:cat.color,padding:"7px 14px",borderRadius:6,fontSize:11,fontWeight:600,letterSpacing:1,cursor:"pointer"}}>
                      Shuffle
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Custom declarations */}
      <Card glow={C.gold}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <Lbl color={C.gold}>My Personal Declarations</Lbl>
          <button onClick={()=>setCustomMode(!customMode)} style={{background:"transparent",border:"none",color:C.muted,fontSize:11,cursor:"pointer"}}>{customMode?"Done":"Edit"}</button>
        </div>
        {custom.length===0 && !customMode && (
          <p style={{color:C.faint,fontSize:13,fontStyle:"italic",marginBottom:12}}>Add your own personal declarations here.</p>
        )}
        {custom.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.gold,fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontStyle:"italic",flexShrink:0}}>I am</span>
            {customMode
              ? <input value={s} onChange={e=>{const a=[...custom];a[i]=e.target.value;setData(d=>({...d,iAmCustom:a}));}}
                  style={{flex:1,background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,color:"#E8D9A0",fontSize:15,fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",outline:"none",padding:"4px 2px"}}/>
              : <p style={{color:"#E8D9A0",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",fontSize:15,lineHeight:1.5}}>{s||"…"}</p>
            }
            {customMode && <button onClick={()=>{const a=[...custom];a.splice(i,1);setData(d=>({...d,iAmCustom:a}));}} style={{background:"transparent",border:"none",color:C.coral,fontSize:14,cursor:"pointer",flexShrink:0}}>×</button>}
          </div>
        ))}
        <button onClick={()=>{setData(d=>({...d,iAmCustom:[...(d.iAmCustom||[]),""] })); setCustomMode(true);}}
          style={{background:"transparent",border:`1px dashed ${C.gold}44`,color:C.gold,padding:"8px",borderRadius:6,width:"100%",fontSize:11,fontWeight:600,letterSpacing:1,cursor:"pointer"}}>
          + Add Personal Declaration
        </button>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   READING PLAN
═══════════════════════════════════════════════════════════ */
function Reading({ data, setData }) {
  const upd=(i,f,v)=>setData(d=>{const b=[...d.books];b[i]={...b[i],[f]:v};return{...d,books:b};});
  return (
    <div>
      <H size={26} style={{marginBottom:6}}>Reading Plan</H>
      <p style={{color:C.muted,fontSize:13,marginBottom:6,fontStyle:"italic",fontFamily:"'Cormorant Garamond',serif",lineHeight:1.6}}>
        "You will be the same in 5 years except for the books you read."
      </p>
      <p style={{color:C.muted,fontSize:11,marginBottom:24}}>— Charlie Jones</p>
      {data.books.map((bk,i)=>(
        <Card key={i} className="lift" style={{marginBottom:14,borderTop:`2px solid ${i%2===0?C.sunrise:C.mint}`}}>
          <div style={{display:"flex",gap:12,marginBottom:18,alignItems:"flex-start"}}>
            <div style={{width:40,height:52,borderRadius:4,background:`linear-gradient(160deg,${i%2===0?C.sunrise:C.mint},${i%2===0?C.gold:C.lavender})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${i%2===0?C.sunrise:C.mint}44`}}>
              <span style={{color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:16}}>#{i+1}</span>
            </div>
            <div style={{flex:1}}>
              <input value={bk.title} onChange={e=>upd(i,"title",e.target.value)} placeholder="Book title..." className="il" style={{fontSize:16,fontFamily:"'Cormorant Garamond',serif",marginBottom:4}}/>
              <input value={bk.author} onChange={e=>upd(i,"author",e.target.value)} placeholder="Author..." className="il" style={{fontSize:12,color:C.muted}}/>
            </div>
          </div>
          <div style={{marginBottom:14}}><Lbl>Top 3 Lessons</Lbl><NumList items={bk.lessons} onChange={v=>upd(i,"lessons",v)} placeholder="Key lesson..."/></div>
          <div><Lbl color={C.mint}>Actions I'll Take</Lbl><NumList items={bk.actions} onChange={v=>upd(i,"actions",v)} placeholder="I will apply this by..."/></div>
        </Card>
      ))}
      <button onClick={()=>setData(d=>({...d,books:[...d.books,{title:"",author:"",lessons:["","",""],actions:["","",""]}]}))}
        style={{background:"transparent",border:`2px dashed ${C.border}`,borderRadius:12,color:C.muted,padding:"18px",fontSize:13,cursor:"pointer",width:"100%",letterSpacing:1,fontWeight:600}}>
        Add Another Book
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════ */
const TABS = [
  { id:"home",      label:"Home",     Icon: Icons.Home      },
  { id:"annual",    label:"Annual",   Icon: Icons.Annual    },
  { id:"90day",     label:"90-Day",   Icon: Icons.Sprint    },
  { id:"weekly",    label:"Blueprint", Icon: Icons.Weekly    },
  { id:"analytics", label:"Stats",    Icon: Icons.Analytics },
];
const ALL_PAGES = [
  { id:"home",      label:"Dashboard",       Icon: Icons.Home      },
  { id:"annual",    label:"Annual Goals",    Icon: Icons.Annual    },
  { id:"90day",     label:"90-Day Goals",    Icon: Icons.Sprint    },
  { id:"weekly",    label:"Weekly Blueprint",  Icon: Icons.Weekly    },
  { id:"identity",  label:"I Am Statements", Icon: Icons.Identity  },
  { id:"reading",   label:"Reading Plan",    Icon: Icons.Reading   },
  { id:"analytics", label:"Analytics",       Icon: Icons.Analytics },
];

export default function App() {
  const [data, setRaw]          = useState(loadData);
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab]           = useState("home");
  const [drawer, setDrawer]     = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [milestone, setMilestone]     = useState(null);
  const prevStreakRef = useRef(null);

  useEffect(()=>{ if(data.user.name) setOnboarded(true); },[]);

  // Show paywall when trial expires
  useEffect(()=>{
    if (onboarded && isLocked(data.user)) setPaywallOpen(true);
  },[onboarded]);

  // Detect milestone achievements
  useEffect(()=>{
    const streak = computeStreak(data.weeks);
    const prev   = prevStreakRef.current;
    if (prev !== null && streak > prev) {
      const hit = MILESTONES.find(m => m.weeks === streak);
      if (hit) setMilestone(hit);
    }
    prevStreakRef.current = streak;
  }, [data.weeks]);

  const setData = fn => setRaw(prev=>{ const next=typeof fn==="function"?fn(prev):fn; persist(next); return next; });

  const finish = (name, role, age="", focus="") => {
    setData(d=>({...d,user:{...d.user,name,role,age,focus,joinDate:new Date().toISOString().slice(0,10),trialStart:new Date().toISOString().slice(0,10)}}));
    setOnboarded(true);
  };

  const showPaywall = () => setPaywallOpen(true);

  if (!onboarded) return <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",maxWidth:480,margin:"0 auto"}}><Styles/><Onboarding onDone={finish}/></div>;

  const pages = {
    home:      <Dashboard data={data} setData={setData} showMilestone={()=>setMilestone(getMilestone(computeStreak(data.weeks)))}/>,
    annual:    <AnnualGoals data={data} setData={setData} showPaywall={showPaywall}/>,
    "90day":   <Goals90 data={data} setData={setData} showPaywall={showPaywall}/>,
    weekly:    <Weekly data={data} setData={setData}/>,
    identity:  <Identity data={data} setData={setData}/>,
    reading:   <Reading data={data} setData={setData}/>,
    analytics: <Analytics data={data}/>,
  };

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:C.void,color:C.text,minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>
      <Styles/>

      {/* Paywall overlay */}
      {paywallOpen && <Paywall user={data.user} setData={setData} onClose={()=>setPaywallOpen(false)}/>}

      {/* Milestone celebration */}
      {milestone && <MilestoneCelebration milestone={milestone} onClose={()=>setMilestone(null)}/>}

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:`${C.void}EE`,backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <Logo size={17}/>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {!data.user.subscribed && (
            <button onClick={showPaywall} className="tap"
              style={{background:`${C.gold}18`,border:`1px solid ${C.gold}33`,color:C.gold,padding:"5px 12px",borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:1,cursor:"pointer"}}>
              PRO
            </button>
          )}
          {data.user.subscribed && <Pill color={C.mint}>Pro</Pill>}
          <Avatar name={data.user.name} size={32}/>
          <button onClick={()=>setDrawer(true)} style={{background:"transparent",border:"none",color:C.muted,fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>≡</button>
        </div>
      </div>

      {/* Side drawer */}
      {drawer && (
        <div style={{position:"fixed",inset:0,zIndex:200}} onClick={()=>setDrawer(false)}>
          <div style={{position:"absolute",inset:0,background:"#000000BB",backdropFilter:"blur(4px)"}}/>
          <div className="slR" style={{position:"absolute",right:0,top:0,bottom:0,width:272,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"48px 20px 20px",borderBottom:`1px solid ${C.border}`,background:`linear-gradient(160deg,${C.surface},${C.card})`}}>
              <Avatar name={data.user.name} size={52}/>
              <H size={18} style={{marginTop:12}}>{data.user.name}</H>
              {data.user.role && <p style={{color:C.muted,fontSize:12,marginTop:3}}>{data.user.role}</p>}
              <div style={{marginTop:14}}>
                <Bar value={Math.min(90,Math.floor((Date.now()-new Date(data.user.trialStart||data.user.joinDate))/86400000))} max={90} color={`linear-gradient(90deg,${C.sunrise},${C.gold})`} h={4}/>
                <p style={{color:C.muted,fontSize:10,marginTop:5,letterSpacing:1}}>90-DAY PROGRESS</p>
              </div>
            </div>
            <div style={{flex:1,paddingTop:8,overflowY:"auto"}}>
              {ALL_PAGES.map(p=>(
                <button key={p.id} onClick={()=>{setTab(p.id);setDrawer(false);}}
                  style={{width:"100%",textAlign:"left",padding:"13px 20px",background:tab===p.id?`${C.sunrise}12`:"transparent",border:"none",borderLeft:tab===p.id?`3px solid ${C.sunrise}`:"3px solid transparent",color:tab===p.id?C.sunrise:C.muted,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",gap:12,fontWeight:tab===p.id?600:400,transition:"all .15s"}}>
                  <p.Icon size={16} color={tab===p.id?C.sunrise:C.faint}/>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{padding:"16px 20px",borderTop:`1px solid ${C.border}`}}>
              {!data.user.subscribed && (
                <button onClick={()=>{setDrawer(false);showPaywall();}}
                  style={{width:"100%",background:`linear-gradient(135deg,${C.sunrise},${C.flame})`,border:"none",color:"#fff",padding:"10px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                  Upgrade to Pro
                </button>
              )}
              <button onClick={()=>{if(window.confirm("Reset all data and start a new 90-day cycle?")){localStorage.clear();window.location.reload();}}}
                style={{width:"100%",background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"8px",fontSize:11,cursor:"pointer",borderRadius:6,letterSpacing:1}}>
                Start New Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div key={tab} className="rise" style={{padding:"20px 16px 110px",minHeight:"calc(100vh - 57px)"}}>
        {pages[tab]||pages["home"]}
      </div>

      {/* Bottom tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,zIndex:50,background:`${C.surface}F2`,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"8px 0 18px",display:"flex",justifyContent:"space-around"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"4px 10px",position:"relative"}}>
              {active && <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:24,height:3,background:`linear-gradient(90deg,${C.sunrise},${C.gold})`,borderRadius:99}}/>}
              <div style={{width:28,height:28,borderRadius:8,background:active?`${C.sunrise}20`:"transparent",border:active?`1px solid ${C.sunrise}40`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                <t.Icon size={16} color={active?C.sunrise:C.faint}/>
              </div>
              <span style={{fontSize:9,color:active?C.sunrise:C.muted,letterSpacing:.8,fontWeight:active?700:400,transition:"color .2s"}}>{t.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
