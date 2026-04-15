import { useEffect, useState } from "react";
import { C } from "../theme/colors.js";
import { DECLARATIONS, DECL_CATEGORIES } from "../lib/appConstants.js";
import { Btn, Card, H, Lbl } from "../components/ui/index.js";

export function Identity({ data, setData }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [declIdx, setDeclIdx] = useState({});
  const [customMode, setCustomMode] = useState(false);
  const [todayDecl, setTodayDecl] = useState([]);

  useEffect(() => {
    const picks = [];
    const cats = [...DECL_CATEGORIES];
    cats.sort(() => Math.random() - 0.5);
    cats.slice(0, 3).forEach((cat) => {
      const lib = DECLARATIONS[cat.key];
      picks.push({ text: lib[Math.floor(Math.random() * lib.length)], color: cat.color, label: cat.label });
    });
    setTodayDecl(picks);
  }, []);

  const shuffle = (catKey) => {
    const lib = DECLARATIONS[catKey];
    setDeclIdx((prev) => {
      const cur = prev[catKey] ?? 0;
      let next;
      do {
        next = Math.floor(Math.random() * lib.length);
      } while (next === cur && lib.length > 1);
      return { ...prev, [catKey]: next };
    });
  };

  const custom = data.iAmCustom || [];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <H size={32} style={{ marginBottom: 12 }}>I Am Statements</H>
      <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 40, lineHeight: 1.6, maxWidth: 600 }}>
        Your identity is the ceiling of your performance. Raise it here by speaking truth over your life daily.
      </p>

      <div style={{ 
        background: `linear-gradient(135deg, ${C.agroLight}, #FFFFFF)`, 
        borderRadius: 24, 
        padding: "32px", 
        marginBottom: 32, 
        position: "relative", 
        overflow: "hidden",
        border: `1px solid ${C.agroBorder}`,
        boxShadow: "0 10px 25px rgba(20,83,45,0.05)"
      }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 0%, rgba(34,197,94,0.1), transparent 70%)` }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: C.forest, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Today's Declarations</p>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 32 }}>Speak these over yourself daily. Refreshes every session.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 32 }}>
            {todayDecl.map((d, i) => (
              <div key={i} className="rise" style={{ animationDelay: `${i * 120}ms` }}>
                <p style={{ color: d.color, fontSize: 10, letterSpacing: 1.5, fontWeight: 800, marginBottom: 12, textTransform: "uppercase" }}>{d.label}</p>
                <p style={{ color: C.text, fontSize: 17, lineHeight: 1.6, fontWeight: 600, fontStyle: "italic" }}>"{d.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
        <Card>
          <H size={20} style={{ marginBottom: 8 }}>Browse by Category</H>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>Tap a category to cycle through its declarations.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DECL_CATEGORIES.map((cat) => {
              const lib = DECLARATIONS[cat.key];
              const idx = declIdx[cat.key] ?? 0;
              const isOpen = activeCategory === cat.key;
              return (
                <div key={cat.key}>
                  <button
                    onClick={() => setActiveCategory(isOpen ? null : cat.key)}
                    className="tap"
                    style={{ 
                      width: "100%", 
                      background: isOpen ? "#F9FAFB" : "transparent", 
                      border: `1px solid ${isOpen ? "#E5E7EB" : "#F3F4F6"}`, 
                      borderRadius: 12, 
                      padding: "16px", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                      <span style={{ color: "#111827", fontSize: 14, fontWeight: 700 }}>{cat.label}</span>
                    </div>
                    <span style={{ color: "#9CA3AF", fontSize: 16, fontWeight: 600 }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="popin" style={{ background: "#FFFFFF", border: "1px solid #F3F4F6", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "24px", marginTop: -4 }}>
                      <p style={{ color: "#374151", fontSize: 16, lineHeight: 1.6, marginBottom: 20, fontStyle: "italic", fontWeight: 500 }}>"{lib[idx]}"</p>
                      <button 
                        onClick={() => shuffle(cat.key)} 
                        className="tap" 
                        style={{ 
                          background: "#F3F4F6", 
                          border: "none", 
                          color: "#111827", 
                          padding: "8px 16px", 
                          borderRadius: 8, 
                          fontSize: 12, 
                          fontWeight: 700, 
                          cursor: "pointer" 
                        }}
                      >
                        Shuffle Statement
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ borderTop: `4px solid ${C.forest}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <H size={20}>Personal Declarations</H>
            <button 
              onClick={() => setCustomMode(!customMode)} 
              style={{ background: "transparent", border: "none", color: customMode ? C.forest : "#6B7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {customMode ? "Save Changes" : "Edit List"}
            </button>
          </div>

          {custom.length === 0 && !customMode && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#9CA3AF", fontSize: 14, fontStyle: "italic" }}>Add your own personal declarations here to customize your growth journey.</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {custom.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ color: C.forest, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>I am</span>
                {customMode ? (
                  <input
                    value={s}
                    onChange={(e) => {
                      const a = [...custom];
                      a[i] = e.target.value;
                      setData((d) => ({ ...d, iAmCustom: a }));
                    }}
                    style={{ flex: 1, background: "transparent", border: "none", color: "#111827", fontSize: 15, fontWeight: 500, outline: "none" }}
                    placeholder="Type your statement..."
                  />
                ) : (
                  <p style={{ color: "#111827", fontSize: 15, fontWeight: 500, margin: 0 }}>{s || "…"}</p>
                )}
                {customMode && (
                  <button
                    onClick={() => {
                      const a = [...custom];
                      a.splice(i, 1);
                      setData((d) => ({ ...d, iAmCustom: a }));
                    }}
                    style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: 18, cursor: "pointer", flexShrink: 0 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setData((d) => ({ ...d, iAmCustom: [...(d.iAmCustom || []), ""] }));
              setCustomMode(true);
            }}
            style={{ 
              background: "#F9FAFB", 
              border: `1px dashed #D1D5DB`, 
              color: "#6B7280", 
              padding: "12px", 
              borderRadius: 12, 
              width: "100%", 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: "pointer" 
            }}
          >
            + Add Personal Declaration
          </button>
        </Card>
      </div>
    </div>
  );
}

