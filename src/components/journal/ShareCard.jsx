import { useRef, useState } from "react";
import { C } from "../../theme/colors.js";
import { Logo } from "../ui/Primitives.jsx";

export function ShareCard({ week, weekNum, userName, onClose }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);
  const date = week ? new Date(week.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  const wins = (week?.wins || []).filter(Boolean);
  const goals = (week?.goals || []).filter(Boolean);

  const copyText = () => {
    const lines = [
      `✦ Best self — Week ${weekNum} in Review`,
      `${userName || "My"} week of ${date}`,
      "",
      wins.length ? `WINS:\n${wins.map((w, i) => `${i + 1}. ${w}`).join("\n")}` : "",
      goals.length ? `\nGOALS CRUSHED:\n${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}` : "",
      "",
      "Building my Best self — 90 days at a time.",
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(lines).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 350, background: "#000000CC", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div ref={cardRef} style={{ 
          background: `linear-gradient(145deg,#0E1118,#161C2A)`, 
          border: `1px solid ${C.border}`, 
          borderRadius: 20, 
          padding: "32px 24px", 
          position: "relative", 
          overflow: "hidden", 
          marginBottom: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${C.sunrise}18,transparent 65%)` }} />
          <div style={{ position: "absolute", bottom: -40, left: -20, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle,${C.gold}12,transparent 65%)` }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, position: "relative" }}>
            <Logo size={15} />
            <div style={{ textAlign: "right" }}>
              <p style={{ color: C.sunrise, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>WEEK {weekNum}</p>
              <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{date}</p>
            </div>
          </div>

          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", color: C.cream, fontSize: 26, fontWeight: 700, marginBottom: 4, position: "relative" }}>Week in Review</h2>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 22, position: "relative" }}>{userName || "Best self User"}</p>

          {wins.length > 0 && (
            <div style={{ marginBottom: 18, position: "relative" }}>
              <p style={{ color: C.gold, fontSize: 9, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>THIS WEEK'S WINS</p>
              {wins.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${C.gold}20`, border: `1px solid ${C.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold }} />
                  </div>
                  <span style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>{w}</span>
                </div>
              ))}
            </div>
          )}

          {goals.length > 0 && (
            <div style={{ position: "relative" }}>
              <p style={{ color: C.sunrise, fontSize: 9, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>GOALS THIS WEEK</p>
              {goals.map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${C.sunrise}20`, border: `1px solid ${C.sunrise}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.sunrise }} />
                  </div>
                  <span style={{ color: C.text, fontSize: 13, lineHeight: 1.5 }}>{g}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <p style={{ color: C.faint, fontSize: 10, letterSpacing: 1 }}>BUILDING MY BEST SELF</p>
            <p style={{ color: C.faint, fontSize: 10 }}>90 days at a time</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={copyText} style={{ flex: 1, background: copied ? C.forest : `linear-gradient(135deg,${C.sunrise},${C.flame})`, border: "none", color: "#fff", borderRadius: 10, padding: "14px", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}>
            {copied ? "Copied!" : "Copy as Text"}
          </button>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: "14px 20px", fontSize: 13, cursor: "pointer" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
