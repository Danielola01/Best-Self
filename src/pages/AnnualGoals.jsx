import { useState } from "react";
import { Target } from "lucide-react";
import { C } from "../theme/colors.js";
import { DIMS } from "../lib/appConstants.js";
import { blankGoals } from "../lib/appLogics.js";
import { GoalList } from "../components/app/AppPrimitive.jsx";
import { Btn, Card, H, Lbl } from "../components/ui/index.js";

export function AnnualGoals({ data, setData, showPaywall }) {
  void showPaywall;
  const sets = data.annualGoalSets || [];
  const currentYear = new Date().getFullYear();
  const [activeIdx, setActiveIdx] = useState(sets.length > 0 ? sets.length - 1 : null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addYear = () => {
    const existing = sets.map((s) => s.year);
    let y = currentYear;
    while (existing.includes(y)) y++;
    const ns = { year: y, goals: blankGoals() };
    setData((d) => ({ ...d, annualGoalSets: [...(d.annualGoalSets || []), ns] }));
    setActiveIdx(sets.length);
  };

  const updGoals = (setIdx, dim, items) => {
    setData((d) => {
      const ss = [...d.annualGoalSets];
      ss[setIdx] = { ...ss[setIdx], goals: { ...ss[setIdx].goals, [dim]: items } };
      return { ...d, annualGoalSets: ss };
    });
  };

  const updChecked = (setIdx, dim, checked) => {
    setData((d) => {
      const ss = [...d.annualGoalSets];
      const prev = ss[setIdx].checked || {};
      ss[setIdx] = { ...ss[setIdx], checked: { ...prev, [dim]: checked } };
      return { ...d, annualGoalSets: ss };
    });
  };

  const toggleGoal = (setIdx, dim, goalIdx) => {
    const prev = sets[setIdx]?.checked?.[dim] || [];
    const next = [...prev];
    next[goalIdx] = !next[goalIdx];
    updChecked(setIdx, dim, next);
  };

  if (sets.length === 0)
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <H size={32} style={{ marginBottom: 12 }}>Annual Goals</H>
        <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 48, lineHeight: 1.6, maxWidth: 600 }}>
          Define your vision for the full year across every dimension of life. Set the direction for your future self.
        </p>
        <div style={{ textAlign: "center", padding: "80px 40px", background: "#FFFFFF", borderRadius: 24, border: "1px solid #F3F4F6", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div className="float" style={{ width: 80, height: 80, borderRadius: 24, background: "#E8F9F1", border: "1px solid #D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <Target size={32} color={C.forest} />
          </div>
          <H size={24} style={{ marginBottom: 12 }}>Set Your First Year's Goals</H>
          <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
            Map out every dimension of your life for {currentYear} and beyond.
          </p>
          <Btn onClick={addYear}>Create {currentYear} Goals</Btn>
        </div>
      </div>
    );

  const removeYear = () => {
    if (activeIdx === null) return;
    setData((d) => {
      const ss = [...(d.annualGoalSets || [])];
      ss.splice(activeIdx, 1);
      return { ...d, annualGoalSets: ss };
    });
    const nextIdx = sets.length <= 1 ? null : Math.max(0, activeIdx - 1);
    setActiveIdx(nextIdx);
    setConfirmDelete(false);
  };

  const active = activeIdx !== null ? sets[activeIdx] : null;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, overflowX: "auto", paddingBottom: 8 }}>
        {sets.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="tap"
            style={{
              flexShrink: 0,
              padding: "10px 20px",
              borderRadius: 12,
              background: activeIdx === i ? C.forest : "#FFFFFF",
              border: `1px solid ${activeIdx === i ? C.forest : "#F3F4F6"}`,
              color: activeIdx === i ? "#FFFFFF" : "#6B7280",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeIdx === i ? "0 4px 12px rgba(5,150,105,0.2)" : "none"
            }}
          >
            {s.year}
          </button>
        ))}
        <button 
          onClick={addYear} 
          className="tap" 
          style={{ 
            flexShrink: 0, 
            padding: "10px 20px", 
            borderRadius: 12, 
            background: "transparent", 
            border: `1px dashed #D1D5DB`, 
            color: "#6B7280", 
            fontSize: 13, 
            fontWeight: 700,
            cursor: "pointer" 
          }}
        >
          + New Year
        </button>
      </div>

      {active && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <H size={28}>{active.year} Goals</H>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ 
                background: "#FEF2F2", 
                border: "1px solid #FEE2E2", 
                color: "#EF4444", 
                fontSize: 12, 
                fontWeight: 700, 
                padding: "8px 16px",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              className="tap"
            >
              Remove Year
            </button>
          </div>

          {confirmDelete && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <Card style={{ width: "100%", maxWidth: 400, padding: "32px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Target size={24} color="#EF4444" />
                </div>
                <H size={22} style={{ marginBottom: 12 }}>Remove Year?</H>
                <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                  Are you sure you want to remove <strong>"{active.year} Goals"</strong>? This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <Btn onClick={removeYear} style={{ background: "#EF4444", borderColor: "#EF4444" }} full>Yes, Remove</Btn>
                  <Btn ghost onClick={() => setConfirmDelete(false)} full>Cancel</Btn>
                </div>
              </Card>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {DIMS.map((dim, i) => (
              <div key={dim.key} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                <Card style={{ 
                  background: `${dim.color}08`, 
                  border: `1px solid ${dim.color}30`,
                  height: "100%", 
                  display: "flex", 
                  flexDirection: "column",
                  boxShadow: `0 12px 30px -10px ${dim.color}25, 0 4px 10px -5px ${dim.color}20`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 10, 
                      background: `${dim.color}15`, 
                      border: `1px solid ${dim.color}25`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      flexShrink: 0 
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: dim.color }} />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: dim.color, margin: 0 }}>{dim.label}</p>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <GoalList
                      items={active.goals[dim.key] || ["", ""]}
                      checked={active.checked?.[dim.key] || []}
                      onChange={(items) => updGoals(activeIdx, dim.key, items)}
                      onToggle={(idx) => toggleGoal(activeIdx, dim.key, idx)}
                      placeholder={`${dim.label} goal for ${active.year}...`}
                      accentColor={dim.color}
                    />
                  </div>

                  <button
                    onClick={() => updGoals(activeIdx, dim.key, [...(active.goals[dim.key] || []), ""])}
                    style={{ 
                      marginTop: 20, 
                      background: "rgba(255,255,255,0.5)", 
                      border: `1px dashed ${dim.color}60`, 
                      color: dim.color, 
                      padding: "10px", 
                      borderRadius: 10, 
                      width: "100%", 
                      fontSize: 12, 
                      fontWeight: 700, 
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    + Add Goal
                  </button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

