import { C } from "../../theme/colors.js";

export function Avatar({ name, size = 44, src }) {
  const init = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        referrerPolicy="no-referrer"
        style={{ 
          width: size, 
          height: size, 
          borderRadius: "50%", 
          objectFit: "cover", 
          flexShrink: 0, 
          border: "2px solid #fff", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)" 
        }} 
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${C.forest}, #064E3B)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 12px rgba(5,150,105,0.2)",
      }}
    >
      <span
        style={{
          color: "#fff",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.35,
          letterSpacing: -0.5
        }}
      >
        {init}
      </span>
    </div>
  );
}

export function Ring({ pct = 0, size = 80, stroke = 7, color = C.forest, children }) {
  const r = (size - stroke * 2) / 2;
  const ci = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={ci} cy={ci} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        <circle
          cx={ci}
          cy={ci}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {children || (
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: size * 0.22, fontWeight: 800, color: "#111827" }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

export function Bar({ value = 0, max = 1, color = C.forest, h = 5 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: "#F3F4F6", borderRadius: 99, height: h, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

export const Icons = {
  Home: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Annual: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14l1.5 3 3-4.5-4.5 1.5L9 12l.75 3.75L12 14z" />
    </svg>
  ),
  Sprint: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 3.5" />
      <path d="M16.5 3.5l1 2M7.5 3.5l-1 2" />
    </svg>
  ),
  Weekly: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
      <circle cx="17" cy="17" r="3" fill="none" />
      <path d="M16 17l.8.8 1.7-1.6" />
    </svg>
  ),
  Identity: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M17 4l1-2 1 2-2-1 2-1z" strokeWidth="1.4" fill={color} opacity="0.7" />
    </svg>
  ),
  Reading: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6s2-2 6-2 6 2 6 2v14s-2-1-6-1-6 1-6 1V6z" />
      <path d="M14 6s2-2 6-2v14s-2-1-6-1" />
      <path d="M12 6v14" />
    </svg>
  ),
  Analytics: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <rect x="4" y="12" width="3" height="8" rx="1" />
      <rect x="10.5" y="7" width="3" height="13" rx="1" />
      <rect x="17" y="3" width="3" height="17" rx="1" />
      <path d="M5.5 12l6-5 6-3" strokeDasharray="2 1" opacity="0.5" />
    </svg>
  ),
  Check: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6l3 3 5-5" />
    </svg>
  ),
};

export function GoalList({ items, checked, onChange, onToggle, placeholder, accentColor }) {
  const accent = accentColor || C.forest;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600, marginBottom: 12, fontStyle: "italic" }}>Only tick a goal when it is fully complete</p>
      {items.map((v, i) => {
        const done = checked?.[i] || false;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              borderBottom: "1px solid #F3F4F6",
              transition: "all .2s",
              opacity: done ? 0.6 : 1,
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
            </div>
            <input
              className="il"
              value={v}
              onChange={(e) => {
                const a = [...items];
                a[i] = e.target.value;
                onChange(a);
              }}
              placeholder={placeholder}
              style={{ 
                textDecoration: done ? "line-through" : "none", 
                color: done ? "#9CA3AF" : "#111827", 
                flex: 1,
                fontSize: 14,
                fontWeight: 600,
                background: "transparent",
                border: "none",
                outline: "none"
              }}
            />
            <button
              onClick={() => onToggle(i)}
              title={done ? "Mark incomplete" : "Mark as complete — only when done!"}
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                flexShrink: 0,
                cursor: "pointer",
                border: `2px solid ${done ? accent : "#E5E7EB"}`,
                background: done ? accent : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .2s ease",
              }}
            >
              {done && <Icons.Check size={14} color="#fff" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function Divider({ style = {} }) {
  return <div style={{ height: 1, background: C.border, margin: "16px 0", ...style }} />;
}

