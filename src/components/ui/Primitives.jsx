import { C } from "../../theme/colors.js";

export function Logo({ size = 18, light = false, textColor }) {
  const finalTextColor = textColor || (light ? "#fff" : "#111827");
  const secondaryTextColor = textColor || (light ? "rgba(255,255,255,0.8)" : C.forest);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: size + 20,
          height: size + 20,
          borderRadius: 12,
          background: light ? "rgba(255,255,255,0.15)" : C.forest,
          border: light ? "1px solid rgba(255,255,255,0.2)" : "2px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: light ? "none" : `0 4px 14px rgba(0, 0, 0, 0.1)`,
          flexShrink: 0,
          overflow: "hidden",
          padding: 2
        }}
      >
        <img 
          src="https://www.image2url.com/r2/default/images/1776174727676-7ec972a9-e17f-4326-b27c-86f5471b9b3d.png" 
          alt="BestSelf Logo" 
          referrerPolicy="no-referrer"
          style={{ 
            width: "115%", 
            height: "115%", 
            objectFit: "cover",
            filter: "brightness(1.1)"
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: size + 2, color: finalTextColor, letterSpacing: -0.5 }}>Best</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: size + 2, color: secondaryTextColor, letterSpacing: -0.5 }}>Self</span>
      </div>
    </div>
  );
}

export function H({ children, size = 22, style = {}, className = "" }) {
  return (
    <h2 className={className} style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#111827", fontSize: size, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.5, ...style }}>
      {children}
    </h2>
  );
}

export function Lbl({ children, color }) {
  return (
    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: color || C.sunrise, marginBottom: 10 }}>{children}</p>
  );
}

export function Pill({ children, color }) {
  return (
    <span
      style={{
        background: `${color || C.sunrise}18`,
        color: color || C.sunrise,
        border: `1px solid ${color || C.sunrise}30`,
        borderRadius: 99,
        padding: "3px 10px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.8,
      }}
    >
      {children}
    </span>
  );
}

export function Btn({ children, onClick, full, ghost, small, danger, style = {} }) {
  if (ghost)
    return (
      <button
        onClick={onClick}
        className="tap"
        style={{
          background: "transparent",
          border: `1px solid ${danger ? C.coral : "#E5E7EB"}`,
          color: danger ? C.coral : "#374151",
          borderRadius: 10,
          padding: small ? "6px 14px" : "10px 20px",
          fontSize: 12,
          fontWeight: 700,
          ...style,
        }}
      >
        {children}
      </button>
    );
  return (
    <button
      onClick={onClick}
      className="tap"
      style={{
        background: C.forest,
        border: "none",
        color: "#fff",
        borderRadius: 12,
        padding: small ? "8px 18px" : "14px 28px",
        fontSize: small ? 12 : 14,
        fontWeight: 800,
        letterSpacing: 0.3,
        boxShadow: `0 4px 14px rgba(5,150,105,0.25)`,
        width: full ? "100%" : "auto",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Card({ children, style = {}, glow, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: "#FFFFFF",
        border: `1px solid #F3F4F6`,
        borderRadius: 16,
        padding: "24px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
