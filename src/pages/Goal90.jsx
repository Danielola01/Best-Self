import { useState } from "react";
import { Target, Trash2 } from "lucide-react";
import { C } from "../theme/colors.js";
import { DIMS } from "../lib/appConstants.js";
import { blankGoals, fetchAISuggestions } from "../lib/appLogics.js";
import { GoalList } from "../components/app/AppPrimitive.jsx";
import { Btn, Card, H, Lbl } from "../components/ui/index.js";

export function Goals90({ data, setData, showPaywall }) {
  void showPaywall;
  const sets = data.cycleGoalSets || [];
  const [activeIdx, setActiveIdx] = useState(sets.length > 0 ? sets.length - 1 : null);
  const [naming, setNaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [aiLoading, setAiLoading] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [confirmClear, setConfirmClear] = useState(null);

  const addCycle = () => {
    const label = newLabel.trim() || `Cycle ${sets.length + 1}`;
    const ns = { label, startDate: new Date().toISOString().slice(0, 10), goals: blankGoals() };
    setData((d) => ({ ...d, cycleGoalSets: [...(d.cycleGoalSets || []), ns] }));
    setActiveIdx(sets.length);
    setNaming(false);
    setNewLabel("");
  };

  const updGoals = (setIdx, dim, items) => {
    setData((d) => {
      const ss = [...d.cycleGoalSets];
      ss[setIdx] = { ...ss[setIdx], goals: { ...ss[setIdx].goals, [dim]: items } };
      return { ...d, cycleGoalSets: ss };
    });
  };

  const toggleGoal90 = (setIdx, dim, goalIdx) => {
    setData((d) => {
      const ss = [...d.cycleGoalSets];
      const prev = ss[setIdx].checked || {};
      const arr = [...(prev[dim] || [])];
      arr[goalIdx] = !arr[goalIdx];
      ss[setIdx] = { ...ss[setIdx], checked: { ...prev, [dim]: arr } };
      return { ...d, cycleGoalSets: ss };
    });
  };

  const removeCycle = () => {
    if (activeIdx === null) return;
    setData((d) => {
      const ss = [...(d.cycleGoalSets || [])];
      ss.splice(activeIdx, 1);
      return { ...d, cycleGoalSets: ss };
    });
    const nextIdx = sets.length <= 1 ? null : Math.max(0, activeIdx - 1);
    setActiveIdx(nextIdx);
    setConfirmDelete(false);
  };

  const active = activeIdx !== null ? sets[activeIdx] : null;

  const suggestWithAI = async (dim) => {
    if (aiLoading) return;
    setAiLoading(dim.key);
    setAiError(null);
    try {
      const existing = active?.goals?.[dim.key] || [];
      const suggestions = await fetchAISuggestions(dim.label, existing, data.user.name);
      if (suggestions.length > 0) updGoals(activeIdx, dim.key, suggestions);
    } catch (e) {
      setAiError(dim.key);
    } finally {
      setAiLoading(null);
    }
  };

  if (sets.length === 0)
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <H size={32} style={{ marginBottom: 12 }}>90-Day Goals</H>
        <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 48, lineHeight: 1.6, maxWidth: 600 }}>
          Your 90-day sprint. Set focused goals for each area of life and track your progress as you transform your reality.
        </p>
        <div style={{ textAlign: "center", padding: "80px 40px", background: "#FFFFFF", borderRadius: 24, border: "1px solid #F3F4F6", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div className="float" style={{ width: 80, height: 80, borderRadius: 24, background: "#E8F9F1", border: "1px solid #D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <Target size={32} color={C.forest} />
          </div>
          <H size={24} style={{ marginBottom: 12 }}>Start Your First 90-Day Cycle</H>
          <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
            90 days is the perfect timeframe to create a quantum leap. Start your journey today.
          </p>
          <Btn onClick={() => setNaming(true)}>Create First Cycle</Btn>
        </div>
        {naming && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <Card style={{ width: "100%", maxWidth: 400, padding: "32px" }}>
              <H size={22} style={{ marginBottom: 8 }}>Name Your Cycle</H>
              <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>e.g. "Q1 2026" or "Launch Sprint"</p>
              <input 
                value={newLabel} 
                onChange={(e) => setNewLabel(e.target.value)} 
                placeholder="Q1 2026" 
                className="il" 
                style={{ fontSize: 16, marginBottom: 32, color: "#111827", borderBottom: "2px solid #F3F4F6" }} 
                onKeyDown={(e) => e.key === "Enter" && addCycle()} 
              />
              <div style={{ display: "flex", gap: 12 }}>
                <Btn onClick={addCycle} full>Create Cycle</Btn>
                <Btn ghost onClick={() => setNaming(false)}>Cancel</Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    );

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
              background: activeIdx === i ? C.agroGreen : "#FFFFFF", 
              border: `1px solid ${activeIdx === i ? C.agroGreen : C.border}`, 
              color: activeIdx === i ? "#FFFFFF" : C.muted, 
              fontSize: 13, 
              fontWeight: 700, 
              cursor: "pointer", 
              whiteSpace: "nowrap",
              boxShadow: activeIdx === i ? "0 4px 12px rgba(20,83,45,0.2)" : "none"
            }}
          >
            {s.label}
          </button>
        ))}
        <button 
          onClick={() => setNaming(true)} 
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
            cursor: "pointer", 
            whiteSpace: "nowrap" 
          }}
        >
          + New Cycle
        </button>
      </div>

      {naming && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 400, padding: "32px" }}>
            <H size={22} style={{ marginBottom: 8 }}>Name Your New Cycle</H>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>e.g. "Q2 2026" or "Summer Sprint"</p>
            <input 
              value={newLabel} 
              onChange={(e) => setNewLabel(e.target.value)} 
              placeholder="Q2 2026" 
              className="il" 
              style={{ fontSize: 16, marginBottom: 32, color: "#111827", borderBottom: "2px solid #F3F4F6" }} 
              onKeyDown={(e) => e.key === "Enter" && addCycle()} 
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={addCycle} full>Create</Btn>
              <Btn ghost onClick={() => setNaming(false)}>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {active && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div>
              <H size={28}>{active.label}</H>
              <p style={{ color: "#9CA3AF", fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                Started on{" "}
                {new Date(active.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
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
              Remove Cycle
            </button>
          </div>

          {confirmClear && (
        <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 400, padding: "32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Trash2 size={24} color="#EF4444" />
            </div>
            <H size={22} style={{ marginBottom: 12 }}>Clear {confirmClear.label} Goals?</H>
            <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
              Are you sure you want to clear all goals in the <strong>{confirmClear.label}</strong> category? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={() => { updGoals(activeIdx, confirmClear.key, ["", ""]); setConfirmClear(null); }} style={{ background: "#EF4444", borderColor: "#EF4444" }} full>Yes, Clear All</Btn>
              <Btn ghost onClick={() => setConfirmClear(null)} full>Cancel</Btn>
            </div>
          </Card>
        </div>
      )}

      {confirmDelete && (
            <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <Card style={{ width: "100%", maxWidth: 400, padding: "32px", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Target size={24} color="#EF4444" />
                </div>
                <H size={22} style={{ marginBottom: 12 }}>Remove Cycle?</H>
                <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                  Are you sure you want to remove <strong>"{active.label}"</strong>? This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <Btn onClick={removeCycle} style={{ background: "#EF4444", borderColor: "#EF4444" }} full>Yes, Remove</Btn>
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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                    <button
                      onClick={() => setConfirmClear(dim)}
                      className="tap"
                      style={{ 
                        background: "rgba(255,255,255,0.6)", 
                        border: `1px solid ${dim.color}20`, 
                        color: "#EF4444", 
                        padding: "6px 12px", 
                        borderRadius: 8, 
                        fontSize: 11, 
                        fontWeight: 700, 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 6
                      }}
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>
                  {aiError === dim.key && <p style={{ color: "#EF4444", fontSize: 12, marginBottom: 12 }}>Could not generate suggestions.</p>}
                  
                  <div style={{ flex: 1 }}>
                    <GoalList 
                      items={active.goals[dim.key] || ["", ""]} 
                      checked={active.checked?.[dim.key] || []} 
                      onChange={(items) => updGoals(activeIdx, dim.key, items)} 
                      onToggle={(idx) => toggleGoal90(activeIdx, dim.key, idx)} 
                      placeholder={`${dim.label} goal...`} 
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

