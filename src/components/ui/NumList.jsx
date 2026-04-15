import { Check } from "lucide-react";
import { C } from "../../theme/colors.js";

/** Numbered single-line inputs (weekly journal, reading notes, etc.) */
export function NumList({ items, onChange, placeholder, checked = [], onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {items.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onToggle ? (
            <button
              onClick={() => onToggle(i)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: checked[i] ? C.agroGreen : "#F3F4F6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {checked[i] ? <Check size={14} color="#fff" /> : <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>}
            </button>
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#6B7280", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
            </div>
          )}
          <input 
            className="il" 
            value={v} 
            onChange={(e) => { const a = [...items]; a[i] = e.target.value; onChange(a); }} 
            placeholder={placeholder} 
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderBottom: "1px solid #F3F4F6",
              color: checked[i] ? "#9CA3AF" : "#111827",
              textDecoration: checked[i] ? "line-through" : "none",
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 0",
              outline: "none"
            }}
          />
        </div>
      ))}
    </div>
  );
}
