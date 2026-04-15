import { useState } from "react";
import { Calendar } from "lucide-react";
import { C } from "../theme/colors.js";
import { newWeek } from "../lib/weekModel.js";
import { ShareCard } from "../components/journal/ShareCard.jsx";
import { Btn, Card, H, Lbl, Pill } from "../components/ui/Primitives.jsx";
import { NumList } from "../components/ui/NumList.jsx";

/**
 * Weekly journaling: plan (intentions), reflect (ahas), week list, share card.
 * Wired to parent app state via `data` / `setData` until a backend replaces localStorage.
 */
function WeekDetailsModal({ week, weekNum, onClose, onEdit }) {
  if (!week) return null;
  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ maxWidth: 500, width: "100%", padding: 32, position: "relative", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", fontSize: 24, cursor: "pointer", color: "#9CA3AF", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }} className="tap">×</button>
        
        <div style={{ marginBottom: 24 }}>
          <div style={{ background: week.done ? "#E8F9F1" : "#FEF3C7", color: week.done ? C.forest : "#D97706", padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-block", marginBottom: 12 }}>WEEK {weekNum}</div>
          <H size={28}>Week Summary</H>
          <p style={{ color: "#9CA3AF", fontSize: 14, fontWeight: 600, marginTop: 4 }}>{new Date(week.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
          {week.wins?.some(Boolean) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#F59E0B", marginBottom: 12, textTransform: "uppercase" }}>Top Wins</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {week.wins.filter(Boolean).map((win, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#D97706", fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.5 }}>{win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {week.goals?.some(Boolean) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.forest, marginBottom: 12, textTransform: "uppercase" }}>Weekly Goals</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {week.goals.filter(Boolean).map((goal, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#E8F9F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: C.forest, fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.5 }}>{goal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {week.learned?.some(Boolean) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#3B82F6", marginBottom: 12, textTransform: "uppercase" }}>Key Lessons</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {week.learned.filter(Boolean).map((lesson, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#2563EB", fontSize: 10, fontWeight: 800 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "#374151", margin: 0, lineHeight: 1.5 }}>{lesson}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Btn full onClick={onEdit}>Edit Week Details</Btn>
      </Card>
    </div>
  );
}

export function Weekly({ data, setData, authUserId = null }) {
  const [view, setView] = useState("list");
  const [idx, setIdx] = useState(null);
  const [shareIdx, setShareIdx] = useState(null);
  const [detailsIdx, setDetailsIdx] = useState(null);

  const add = () => {
    const w = newWeek(authUserId || undefined);
    const ni = data.weeks.length;
    setData((d) => ({ ...d, weeks: [...d.weeks, w] }));
    setIdx(ni);
    setView("plan");
  };
  const upd = (fn) =>
    setData((d) => {
      const ws = [...d.weeks];
      ws[idx] = fn(ws[idx]);
      return { ...d, weeks: ws };
    });
  const w = idx !== null ? data.weeks[idx] : null;

  if (view === "plan" && w)
    return (
      <div className="fadein" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <button onClick={() => { setView("list"); setIdx(null); }} style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          ← All Weeks
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ background: "#E8F9F1", color: C.forest, padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-block", marginBottom: 12 }}>WEEK {idx + 1}</div>
            <H size={32}>My Best Week Yet</H>
            <p style={{ color: "#9CA3AF", fontSize: 14, fontWeight: 600, marginTop: 8 }}>{new Date(w.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <Btn ghost onClick={() => setView("reflect")}>
            Switch to Reflection
          </Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24, marginBottom: 32 }}>
          <Card style={{ 
            background: `#F59E0B08`, 
            border: `1px solid #F59E0B30`,
            boxShadow: `0 12px 30px -10px #F59E0B25, 0 4px 10px -5px #F59E0B20`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#F59E0B", marginBottom: 16, textTransform: "uppercase" }}>Top 3 Wins From Last Week</p>
            <NumList items={w.wins} onChange={(v) => upd((wk) => ({ ...wk, wins: v }))} placeholder="A win worth celebrating..." />
          </Card>
          <Card style={{ 
            background: `${C.forest}08`, 
            border: `1px solid ${C.forest}30`,
            boxShadow: `0 12px 30px -10px ${C.forest}25, 0 4px 10px -5px ${C.forest}20`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.forest, marginBottom: 16, textTransform: "uppercase" }}>Top 3 Goals This Week</p>
            <NumList items={w.goals} onChange={(v) => upd((wk) => ({ ...wk, goals: v }))} placeholder="This week I will..." />
          </Card>
          {[0, 1, 2].map((gi) => (
            <Card key={gi} style={{ 
              background: `#3B82F608`, 
              border: `1px solid #3B82F630`,
              boxShadow: `0 12px 30px -10px #3B82F625, 0 4px 10px -5px #3B82F620`
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#3B82F6", marginBottom: 16, textTransform: "uppercase" }}>
                Actions — Goal {gi + 1}
                {w.goals[gi] ? `: ${w.goals[gi].slice(0, 26)}${w.goals[gi].length > 26 ? "…" : ""}` : ""}
              </p>
              <NumList 
                items={w.actions[gi]} 
                checked={w.checkedActions?.[gi] || []}
                onToggle={(idx) => upd((wk) => {
                  const ca = wk.checkedActions ? [...wk.checkedActions] : [[false,false,false],[false,false,false],[false,false,false]];
                  const row = [...ca[gi]];
                  row[idx] = !row[idx];
                  ca[gi] = row;
                  return { ...wk, checkedActions: ca };
                })}
                onChange={(v) => upd((wk) => { const a = [...wk.actions]; a[gi] = v; return { ...wk, actions: a }; })} 
                placeholder="Specific action..." 
              />
            </Card>
          ))}
          <Card style={{ 
            background: `#10B98108`, 
            border: `1px solid #10B98130`,
            boxShadow: `0 12px 30px -10px #10B98125, 0 4px 10px -5px #10B98120`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#10B981", marginBottom: 16, textTransform: "uppercase" }}>How I Will Show Up</p>
            <NumList items={w.showUp} onChange={(v) => upd((wk) => ({ ...wk, showUp: v }))} placeholder="I will show up as..." />
          </Card>
          <Card style={{ 
            background: `#EF444408`, 
            border: `1px solid #EF444430`,
            boxShadow: `0 12px 30px -10px #EF444425, 0 4px 10px -5px #EF444420`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#EF4444", marginBottom: 16, textTransform: "uppercase" }}>Limiting Beliefs to Release</p>
            <NumList items={w.limiting} onChange={(v) => upd((wk) => ({ ...wk, limiting: v }))} placeholder="I will stop believing..." />
          </Card>
          <Card style={{ 
            background: `#8B5CF608`, 
            border: `1px solid #8B5CF630`,
            boxShadow: `0 12px 30px -10px #8B5CF625, 0 4px 10px -5px #8B5CF620`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#8B5CF6", marginBottom: 16, textTransform: "uppercase" }}>Empowering Beliefs Instead</p>
            <NumList items={w.empowering} onChange={(v) => upd((wk) => ({ ...wk, empowering: v }))} placeholder="I now choose to believe..." />
          </Card>
        </div>
        <Btn full onClick={() => setView("reflect")} style={{ padding: "20px", fontSize: 16 }}>
          End of Week — Reflect
        </Btn>
      </div>
    );

  if (view === "reflect" && w)
    return (
      <div className="fadein" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <button onClick={() => setView("plan")} style={{ background: "transparent", border: "none", color: "#6B7280", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          ← Back to Plan
        </button>
        <H size={32} style={{ marginBottom: 12 }}>My Ahas This Week</H>
        <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 40 }}>End-of-week reflection and growth.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24, marginBottom: 32 }}>
          <Card style={{ 
            background: `${C.forest}08`, 
            border: `1px solid ${C.forest}30`,
            boxShadow: `0 12px 30px -10px ${C.forest}25, 0 4px 10px -5px ${C.forest}20`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.forest, marginBottom: 16, textTransform: "uppercase" }}>What Did I Learn About Myself?</p>
            <NumList items={w.learned} onChange={(v) => upd((wk) => ({ ...wk, learned: v }))} placeholder="I discovered..." />
          </Card>
          <Card style={{ 
            background: `#10B98108`, 
            border: `1px solid #10B98130`,
            boxShadow: `0 12px 30px -10px #10B98125, 0 4px 10px -5px #10B98120`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#10B981", marginBottom: 16, textTransform: "uppercase" }}>What Worked This Week?</p>
            <NumList items={w.worked} onChange={(v) => upd((wk) => ({ ...wk, worked: v }))} placeholder="This helped me succeed..." />
          </Card>
          <Card style={{ 
            background: `#EF444408`, 
            border: `1px solid #EF444430`,
            boxShadow: `0 12px 30px -10px #EF444425, 0 4px 10px -5px #EF444420`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#EF4444", marginBottom: 16, textTransform: "uppercase" }}>What Did I Procrastinate?</p>
            <NumList items={w.avoided} onChange={(v) => upd((wk) => ({ ...wk, avoided: v }))} placeholder="I kept putting off..." />
          </Card>
          <Card style={{ 
            background: `#3B82F608`, 
            border: `1px solid #3B82F630`,
            boxShadow: `0 12px 30px -10px #3B82F625, 0 4px 10px -5px #3B82F620`
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#3B82F6", marginBottom: 16, textTransform: "uppercase" }}>If I Started This Week Over...</p>
            <NumList items={w.doOver} onChange={(v) => upd((wk) => ({ ...wk, doOver: v }))} placeholder="I would have..." />
          </Card>
          <Card style={{ background: "#111827", border: "none", gridColumn: "1 / -1", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: C.forest, marginBottom: 24, textTransform: "uppercase" }}>I Am Statements This Week</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {w.iAm.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: C.forest, fontSize: 14, fontWeight: 800, flexShrink: 0 }}>I am</span>
                  <input
                    value={s}
                    onChange={(e) => {
                      const a = [...w.iAm];
                      a[i] = e.target.value;
                      upd((wk) => ({ ...wk, iAm: a }));
                    }}
                    placeholder="...unstoppable, focused, purpose-driven"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: 500,
                      fontStyle: "italic",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <Btn
          full
          onClick={() => {
            upd((wk) => ({ ...wk, done: true }));
            setView("list");
            setIdx(null);
          }}
          style={{ padding: "20px", fontSize: 16 }}
        >
          Mark Week Complete
        </Btn>
      </div>
    );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {shareIdx !== null && <ShareCard week={data.weeks[shareIdx]} weekNum={shareIdx + 1} userName={data.user?.name} onClose={() => setShareIdx(null)} />}
      {detailsIdx !== null && (
        <WeekDetailsModal 
          week={data.weeks[detailsIdx]} 
          weekNum={detailsIdx + 1} 
          onClose={() => setDetailsIdx(null)} 
          onEdit={() => {
            const i = detailsIdx;
            setDetailsIdx(null);
            setIdx(i);
            setView(data.weeks[i].done ? "reflect" : "plan");
          }}
        />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <H size={32}>Weekly Planner</H>
          <p style={{ color: "#6B7280", fontSize: 15, marginTop: 8, fontWeight: 600 }}>
            {data.weeks.length} weeks planned · {data.weeks.filter((wk) => wk.done).length} completed
          </p>
        </div>
        <Btn onClick={add}>+ New Week</Btn>
      </div>

      {data.weeks.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "80px 40px", 
          background: "#FFFFFF", 
          borderRadius: 24, 
          border: "1px solid #F3F4F6",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
        }}>
          <div className="float" style={{ width: 80, height: 80, borderRadius: 24, background: "#E8F9F1", border: "1px solid #D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <Calendar size={32} color={C.forest} />
          </div>
          <H size={24} style={{ marginBottom: 12 }}>Start Your Best Week Yet</H>
          <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
            30 minutes of intentional planning changes everything. Build your week now.
          </p>
          <Btn onClick={add}>Begin Week 1</Btn>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
        {[...data.weeks].reverse().map((wk, ri) => {
          const i = data.weeks.length - 1 - ri;
          return (
            <Card
              key={wk.id}
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                flexDirection: "column", 
                gap: 20,
                background: `${wk.done ? C.forest : "#F59E0B"}08`,
                border: `1px solid ${wk.done ? C.forest : "#F59E0B"}30`,
                boxShadow: `0 12px 30px -10px ${wk.done ? C.forest : "#F59E0B"}25, 0 4px 10px -5px ${wk.done ? C.forest : "#F59E0B"}20`
              }}
              onClick={() => setDetailsIdx(i)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    background: wk.done ? "#E8F9F1" : "#FEF3C7", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    flexShrink: 0 
                  }}>
                    <Calendar size={20} color={wk.done ? C.forest : "#D97706"} />
                  </div>
                  <div>
                    <p style={{ color: "#111827", fontSize: 16, fontWeight: 800, margin: 0 }}>Week {i + 1}</p>
                    <p style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginTop: 2 }}>{new Date(wk.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                </div>
                {wk.done && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShareIdx(i); }}
                    className="tap"
                    style={{ 
                      background: "#F3F4F6", 
                      border: "none", 
                      color: "#111827", 
                      padding: "6px 12px", 
                      borderRadius: 8, 
                      fontSize: 10, 
                      fontWeight: 800, 
                      cursor: "pointer" 
                    }}
                  >
                    SHARE
                  </button>
                )}
              </div>
              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ background: "#F3F4F6", color: "#4B5563", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{wk.goals.filter(Boolean).length} goals</div>
                <div style={{ background: "#F3F4F6", color: "#4B5563", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{wk.wins.filter(Boolean).length} wins</div>
                {wk.done && <div style={{ background: "#E8F9F1", color: C.forest, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Complete</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
