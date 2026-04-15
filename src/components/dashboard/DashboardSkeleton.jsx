import { C } from "../../theme/colors.js";

const Skeleton = ({ width, height, borderRadius = 12, style = {} }) => (
  <div 
    className="skeleton animate-pulse" 
    style={{ 
      width: width || "100%", 
      height: height || 20, 
      borderRadius, 
      ...style 
    }} 
  />
);

export function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Skeleton */}
      <div style={{ 
        background: "#f3f4f6", 
        padding: "32px 24px", 
        borderRadius: 24,
        height: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 12
      }} className="animate-pulse">
        <Skeleton width="120px" height="16px" style={{ opacity: 0.5 }} />
        <Skeleton width="280px" height="32px" />
        <Skeleton width="340px" height="16px" style={{ opacity: 0.5 }} />
      </div>

      {/* KPI Row Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: "#fff", borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 20 }}>
            <Skeleton width="44px" height="44px" borderRadius="50%" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton width="80px" height="14px" />
              <Skeleton width="40px" height="28px" />
            </div>
          </div>
        ))}
      </div>

      {/* Progress Row Skeleton */}
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "24px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <Skeleton width="100px" height="20px" />
            <Skeleton width="40px" height="20px" />
          </div>
          <Skeleton width="100%" height="8px" borderRadius="99px" />
        </div>
        <div style={{ flex: "0 0 420px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
            <Skeleton width="40px" height="40px" borderRadius="10px" />
            <Skeleton width="100px" height="16px" />
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center" }}>
            <Skeleton width="40px" height="40px" borderRadius="10px" />
            <Skeleton width="100px" height="16px" />
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: `1px solid ${C.border}`, height: 340 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <Skeleton width="150px" height="20px" />
            <Skeleton width="100px" height="20px" />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height: 200, padding: "0 20px" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <Skeleton width="100%" height={`${Math.random() * 100 + 50}px`} />
                <Skeleton width="30px" height="10px" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px", border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <Skeleton width="150px" height="20px" />
            <Skeleton width="80px" height="32px" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Skeleton width="44px" height="44px" borderRadius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width="120px" height="16px" />
                  <Skeleton width="80px" height="12px" />
                </div>
                <Skeleton width="60px" height="24px" borderRadius="10px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
