import { useEffect, useState } from "react";
import {
  BarChart,
  Bar as RechartsBar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pencil, Play, Square, Plus, Check, Target, X, Share2, ChevronRight, RotateCcw } from "lucide-react";
import { TRIAL_DAYS, DIMS } from "../lib/appConstants.js";
import { computeStreak, getMilestone, trialDaysLeft, pickRotatingQuote } from "../lib/appLogics.js";
import { Avatar, Bar } from "../components/app/AppPrimitive.jsx";
import { C } from "../theme/colors.js";
import { H, Lbl, Btn, Card as UiCard } from "../components/ui/index.js";

function DzResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 1060px) { 
        .dz-home { grid-template-columns: 1fr !important; }
        .dz-progress-row { flex-direction: column !important; }
        .dz-progress-row > section { flex: 1 !important; width: 100% !important; }
      }
      @media (max-width: 900px) { .dz-analytics-grid { grid-template-columns: 1fr !important; } }
      @media (max-width: 860px) { .dz-kpis { grid-template-columns: 1fr 1fr !important; } }
      @media (max-width: 768px) { 
        .dz-progress-row > div { width: 100% !important; }
      }
      @media (max-width: 640px) { 
        .dz-dashboard-content { padding: 0 16px !important; }
      }
      @media (max-width: 520px) { .dz-kpis { grid-template-columns: 1fr !important; } }
    `}</style>
  );
}

function DzCard({ children, style = {} }) {
  return (
    <div style={{ 
      background: "#FFFFFF", 
      borderRadius: 16, 
      padding: 24, 
      border: `1px solid ${C.border}`, 
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
      ...style 
    }}>
      {children}
    </div>
  );
}

function DzKpiRow({ weeks, days, projects, onAdd }) {
  const ended = (weeks || []).filter((w) => w.done).length;
  const running = Math.max(0, (weeks || []).length - ended);
  const pendingCount = (projects || []).filter(p => !p.done).length;

  const cards = [
    { label: "Total Weeks", value: (weeks || []).length, icon: Pencil, color: C.agroGreen, live: true },
    { label: "Ended Weeks", value: ended, icon: Check, color: C.mint },
    { label: "Running Weeks", value: running, icon: Play, color: C.mint },
    { label: "Pending Projects", value: pendingCount, icon: Plus, color: C.gold, action: onAdd },
  ];

  return (
    <div className="dz-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
      {cards.map((k, i) => (
        <div 
          key={i} 
          onClick={k.action}
          className={k.action ? "tap" : ""}
          style={{ 
            background: "#FFFFFF", 
            borderRadius: 20, 
            padding: "20px", 
            border: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
            cursor: k.action ? "pointer" : "default"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${k.color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={20} color={k.color} />
            </div>
            {k.live && (
              <div style={{ background: "#ECFDF5", color: "#10B981", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 99, letterSpacing: 0.5 }}>LIVE</div>
            )}
          </div>
          <div>
            <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{k.label}</p>
            <p style={{ color: C.text, fontSize: 28, fontWeight: 800, margin: 0 }}>{k.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DzActiveProjects({ weeks }) {
  const active = (weeks || []).slice(-2);
  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Active Projects</h2>
        <span style={{ color: C.muted, fontSize: 12 }}>{active.length} active</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {active.map((w, i) => {
          const actualIdx = weeks.indexOf(w);
          return (
            <div key={w.id || i} style={{ 
              background: "#fff", 
              padding: "20px", 
              borderRadius: 16, 
              border: `1px solid ${C.border}`, 
              display: "flex", 
              alignItems: "center", 
              gap: 16,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F8FAF9", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}` }}>
                <Pencil size={20} color={C.muted} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Project Week {actualIdx + 1}</p>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 2, margin: 0 }}>{w.goals?.filter(Boolean).length || 0} goals set</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.mint, fontSize: 13, fontWeight: 700 }}>
                <Check size={16} />
                Active
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DzProjectAnalytics({ dimensionData, pct90 }) {
  return (
    <DzCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        <p style={{ color: C.text, fontSize: 16, fontWeight: 800, margin: 0 }}>Project Analytics</p>
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 700 }}>{pct90}% Time Elapsed</span>
      </div>
      <div style={{ height: 280, minHeight: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dimensionData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: "#6B7280" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: "#6B7280" }}
              label={{ value: 'Progress %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10, fontWeight: 600 } }}
            />
            <Tooltip 
              cursor={{ fill: "#F3F4F6", opacity: 0.4 }} 
              contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
            />
            <Legend 
              verticalAlign="top" 
              align="left" 
              iconType="circle" 
              wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 600 }} 
            />
            <RechartsBar name="Goal Progress" dataKey="goals" fill={C.agroGreen} barSize={12} radius={[4, 4, 0, 0]} />
            <RechartsBar name="Process Progress" dataKey="process" fill="#60A5FA" barSize={12} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DzCard>
  );
}

function DzTeamCollaboration({ members = [], onAdd }) {
  return (
    <DzCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ color: C.text, fontSize: 16, fontWeight: 800, margin: 0 }}>Team Collaboration</p>
        <button onClick={onAdd} style={{ 
          background: "transparent", 
          border: `1px solid ${C.border}`, 
          borderRadius: 10, 
          padding: "8px 14px", 
          fontSize: 12, 
          fontWeight: 700, 
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer"
        }}>
          <Plus size={14} /> Add Member
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {members.length === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No team members yet.
          </div>
        ) : (
          members.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ 
                width: 44, 
                height: 44, 
                borderRadius: "50%", 
                background: m.color || C.forest, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#fff", 
                fontSize: 14, 
                fontWeight: 800
              }}>
                {m.initials || m.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>{m.fullName}</p>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4, margin: 0 }}>{m.role}</p>
              </div>
              <div style={{ 
                padding: "6px 14px", 
                borderRadius: 10, 
                fontSize: 11, 
                fontWeight: 700, 
                background: m.status === "In Progress" ? "#E8F9F1" : m.status === "Completed" ? "#F3F4F6" : "#FFFBEB",
                color: m.status === "In Progress" ? "#059669" : m.status === "Completed" ? "#6B7280" : "#D97706"
              }}>
                {m.status || "Pending"}
              </div>
            </div>
          ))
        )}
      </div>
    </DzCard>
  );
}

function AddMemberModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("In Progress");

  const handleSave = () => {
    if (!name.trim()) return;
    const colors = [C.forest, C.mint, C.gold, C.coral, C.lavender];
    onSave({
      fullName: name,
      role: role || "Team Member",
      status,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    onClose();
  };

  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <UiCard style={{ maxWidth: 400, width: "100%", padding: 32, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>
          <X size={20} />
        </button>
        <H size={22} style={{ marginBottom: 8 }}>Add Team Member</H>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Invite a new collaborator to your performance system.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div>
            <Lbl>Full Name</Lbl>
            <input 
              autoFocus
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John Doe"
              style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
            />
          </div>
          <div>
            <Lbl>Role / Responsibility</Lbl>
            <input 
              value={role} 
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Project Manager"
              style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
            />
          </div>
          <div>
            <Lbl>Initial Status</Lbl>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Btn full onClick={handleSave}>Add Member</Btn>
          <Btn ghost full onClick={onClose}>Cancel</Btn>
        </div>
      </UiCard>
    </div>
  );
}

function DzProjectProgress({ totalPct }) {
  return (
    <DzCard style={{ padding: "24px", border: "none", boxShadow: "none", background: "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ 
          background: "#B2F5EA", 
          color: "#0D9488", 
          padding: "4px 12px", 
          borderRadius: 12, 
          fontSize: 12, 
          fontWeight: 800,
          letterSpacing: "0.02em"
        }}>
          IN PROGRESS
        </div>
        <span style={{ color: "#0D9488", fontSize: 14, fontWeight: 800 }}>{totalPct}%</span>
      </div>
      
      <div style={{ width: "100%", height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ 
          width: `${totalPct}%`, 
          height: "100%", 
          background: "#14B8A6", 
          borderRadius: 99,
          transition: "width 0.8s ease-out"
        }} />
      </div>
    </DzCard>
  );
}

function DzProjects({ projects = [], onNew, onToggle, onDelete }) {
  const colors = [
    { color: "#E8F9F1", border: "#D1FAE5" },
    { color: "#E0F2FE", border: "#BAE6FD" },
    { color: "#FFFBEB", border: "#FEF3C7" },
    { color: "#FEE2E2", border: "#FECACA" },
    { color: "#F3E8FF", border: "#E9D5FF" },
  ];

  return (
    <DzCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Project</h2>
        <button onClick={onNew} className="tap" style={{ 
          background: "#fff", 
          border: `1px solid ${C.border}`, 
          borderRadius: 12, 
          padding: "8px 18px", 
          fontSize: 14, 
          fontWeight: 700, 
          color: C.text,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
        }}>
          <Plus size={16} /> New
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {projects.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: C.muted, fontSize: 13, background: "#F9FAFB", borderRadius: 12 }}>
            No projects yet. Click "+ New" to add one.
          </div>
        ) : (
          projects.map((p, i) => {
            const theme = colors[i % colors.length];
            return (
              <div key={p.id || i} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 16, 
                padding: "20px 0", 
                borderBottom: i < projects.length - 1 ? `1px solid ${C.border}80` : "none" 
              }}>
                <button 
                  onClick={() => onToggle(p.id)}
                  className="tap"
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 14, 
                    background: p.done ? C.agroGreen : (p.color || theme.color), 
                    border: `1px solid ${p.done ? C.agroGreen : (p.border || theme.border)}`, 
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {p.done ? <Check size={24} color="#fff" /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.done ? "#fff" : "transparent" }} />}
                </button>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: p.done ? C.muted : C.text, margin: 0, textDecoration: p.done ? "line-through" : "none" }}>{p.title}</p>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 4, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    Due date: {p.due || "Not set"}
                  </p>
                </div>
                <button 
                  onClick={() => onDelete?.(p.id)}
                  className="tap"
                  style={{ background: "transparent", border: "none", padding: 8, color: `${C.border}EE`, cursor: "pointer" }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </DzCard>
  );
}

function ProjectModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ 
      id: Date.now(),
      title, 
      due: due ? new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Not set" 
    });
    onClose();
  };

  return (
    <div className="fadein" style={{ position: "fixed", inset: 0, zIndex: 4000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <UiCard style={{ maxWidth: 400, width: "100%", padding: 32, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", color: C.muted, cursor: "pointer" }}>
          <X size={20} />
        </button>
        <H size={22} style={{ marginBottom: 8 }}>New Project</H>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Add a new milestone to your performance cycle.</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div>
            <Lbl>Project Title</Lbl>
            <input 
              autoFocus
              value={title} 
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Develop API Endpoints"
              style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
            />
          </div>
          <div>
            <Lbl>Due Date</Lbl>
            <input 
              type="date"
              value={due} 
              onChange={e => setDue(e.target.value)}
              style={{ width: "100%", background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: C.text, outline: "none" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Btn full onClick={handleSave}>Create Project</Btn>
          <Btn ghost full onClick={onClose}>Cancel</Btn>
        </div>
      </UiCard>
    </div>
  );
}

function DzQuickActions({ onStart, onNewProject, onResetCycle, compact = false }) {
  const btnStyle = { 
    background: "#fff", 
    padding: compact ? "16px 16px" : "24px", 
    borderRadius: 20, 
    border: `1px solid ${C.border}`, 
    display: "flex", 
    alignItems: "center", 
    gap: 16, 
    cursor: "pointer",
    textAlign: "left",
    outline: "none",
    flex: 1,
    minWidth: 0,
    transition: "all 0.2s ease",
    boxShadow: "0 4px 6px rgba(15,23,42,0.02)"
  };

  return (
    <section style={{ flex: compact ? "0 0 420px" : "1", width: "100%" }}>
      {!compact && <p style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 16 }}>QUICK ACTIONS</p>}
      <div style={{ display: "flex", flexDirection: "row", gap: 16, width: "100%" }}>
        <button type="button" onClick={onStart} className="tap" style={btnStyle}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${C.sunrise}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Share2 size={compact ? 16 : 22} color={C.sunrise} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Share Streak</p>
            {!compact && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Post your progress</p>}
          </div>
          <ChevronRight size={18} color={C.border} />
        </button>
        <button type="button" onClick={onNewProject} className="tap" style={btnStyle}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${C.agroGreen}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Plus size={compact ? 16 : 22} color={C.agroGreen} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>New Project</p>
            {!compact && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Add a goal to your list</p>}
          </div>
          <ChevronRight size={18} color={C.border} />
        </button>
        {!compact && (
          <button type="button" onClick={onResetCycle} className="tap" style={btnStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${C.coral}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <RotateCcw size={22} color={C.coral} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>New Cycle</p>
              <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Reset for 90 days</p>
            </div>
            <ChevronRight size={18} color={C.border} />
          </button>
        )}
      </div>
    </section>
  );
}

function DzQuote({ quote }) {
  return (
    <div style={{ 
      background: "#fff", 
      padding: "24px", 
      borderRadius: 16, 
      border: `1px solid ${C.border}`,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Daily Fuel</h2>
        <span style={{ color: C.mint, fontSize: 11, fontWeight: 800 }}>ACTIVE</span>
      </div>
      <p style={{ color: C.text, fontSize: 15, fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
        &ldquo;{quote.q}&rdquo;
      </p>
      <p style={{ color: C.muted, fontSize: 13, marginTop: 12, margin: 0 }}>— {quote.a}</p>
    </div>
  );
}

function useRotatingQuote(data, setData) {
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    const { today, nextIdx, quote: q } = pickRotatingQuote(
      { lastQuoteIdx: data.lastQuoteIdx ?? -1, lastOpenDate: data.lastOpenDate },
      new Date().toISOString().slice(0, 10),
    );

    if (data.lastOpenDate !== today || (data.lastQuoteIdx ?? -1) !== nextIdx) {
      setData((d) => ({ ...d, lastQuoteIdx: nextIdx, lastOpenDate: today }));
    }
    setQuote(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return quote;
}

export function Dashboard({ data, setData, showMilestone, onShareStreak, onNewProject }) {
  const quote = useRotatingQuote(data, setData);
  const [today] = useState(() => new Date());
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const dateStr = today.toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long' });

  const days = Math.min(90, Math.max(0, Math.floor((Date.now() - new Date(data.user.trialStart || data.user.joinDate)) / 86400000)));
  const pct90 = Math.round((days / 90) * 100);
  const weeks = data.weeks || [];
  const streak = computeStreak(weeks);
  
  const activeCycle = data.cycleGoalSets?.[data.cycleGoalSets.length - 1] || null;
  const totalGoals = activeCycle?.goals
    ? DIMS.reduce((a, d) => a + (activeCycle.goals[d.key] || []).filter((g) => g.trim()).length, 0)
    : 0;
  const totalDone = activeCycle?.goals
    ? DIMS.reduce((a, d) => {
      const goals = (activeCycle.goals[d.key] || []).filter((g) => g.trim());
      const checks = activeCycle.checked?.[d.key] || [];
      return a + goals.reduce((acc, _, i) => acc + (checks[i] ? 1 : 0), 0);
    }, 0)
    : 0;
  const totalPct = totalGoals > 0 ? Math.round((totalDone / totalGoals) * 100) : 0;

  const dimensionData = DIMS.map(dim => {
    const goals = (activeCycle?.goals?.[dim.key] || []).filter(g => g.trim());
    const checks = activeCycle?.checked?.[dim.key] || [];
    const doneCount = goals.reduce((acc, _, i) => acc + (checks[i] ? 1 : 0), 0);
    const goalPct = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;
    
    // Process: Average completion of the weekly actions
    const totalActions = weeks.reduce((acc, w) => {
      const rowCount = (w.checkedActions || []).reduce((r, row) => r + row.filter(Boolean).length, 0);
      return acc + rowCount;
    }, 0);
    const maxActions = weeks.length * 9; // 3 goals * 3 actions each
    const processPct = maxActions > 0 ? Math.round((totalActions / maxActions) * 100) : pct90;
      
    return {
      name: dim.label,
      goals: goalPct,
      process: processPct
    };
  });

  const pieCycle = [
    { name: "Complete", value: Math.max(0, Math.min(100, totalPct)) || 0.1 },
    { name: "Remaining", value: Math.max(0, 100 - Math.min(100, totalPct)) || 99.9 },
  ];

  const handleAddProject = (newProject) => {
    setData(d => ({
      ...d,
      projects: [...(d.projects || []), { ...newProject, done: false }]
    }));
  };

  const handleToggleProject = (id) => {
    setData(d => ({
      ...d,
      projects: (d.projects || []).map(p => p.id === id ? { ...p, done: !p.done } : p)
    }));
  };

  const handleDeleteProject = (id) => {
    setData(d => ({
      ...d,
      projects: (d.projects || []).filter(p => p.id !== id)
    }));
  };

  const handleAddMember = (newMember) => {
    setData(d => ({
      ...d,
      teamMembers: [...(d.teamMembers || []), newMember]
    }));
  };

  // Calculate overall progress combining 90-day goals and projects
  const projects = data.projects || [];
  const projectDone = projects.filter(p => p.done).length;
  const projectPct = projects.length > 0 ? Math.round((projectDone / projects.length) * 100) : 0;

  // Final progress is a weighted average or just the higher one?
  // Let's use the average of goal progress and project progress if both exist
  const finalProgress = totalGoals > 0 && projects.length > 0 
    ? Math.round((totalPct + projectPct) / 2)
    : totalGoals > 0 ? totalPct : projectPct;

  // Default members if none exist
  const displayMembers = (data.teamMembers || []).length > 0 
    ? data.teamMembers 
    : [
        { 
          initials: (data.user?.name || "You").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2), 
          fullName: data.user?.name || "You", 
          role: "Working on Weekly Planner", 
          status: "In Progress", 
          color: C.agroGreen 
        },
        { initials: "GE", fullName: "Goal Engine", role: "Tracking 90-Day Goals", status: "Completed", color: C.mint },
        { initials: "ST", fullName: "Streak Tracker", role: "Measuring consistency", status: "Pending", color: C.gold },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "0 0 40px 0" }}>
      <DzResponsiveStyles />
      
      {/* Welcome Header */}
      <header style={{ padding: "0 20px" }}>
        <div style={{ 
          background: C.agroGreen, 
          padding: "32px 24px", 
          borderRadius: 24,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 12px 24px rgba(20, 83, 45, 0.15)"
        }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF", marginBottom: 8 }}>{dateStr}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.2 }}>
            Welcome back, {data.user.name || "User"}
          </h1>
          <p style={{ fontSize: 14, color: "#FFFFFF", marginTop: 6, lineHeight: 1.5 }}>Here's an overview of your performance journey.</p>
        </div>
      </header>

      <div className="dz-dashboard-content" style={{ padding: "0 32px", display: "flex", flexDirection: "column", gap: 32 }}>
        {quote && <DzQuote quote={quote} />}

        <DzKpiRow 
          weeks={data.weeks} 
          days={days} 
          projects={data.projects} 
          onAdd={() => setIsProjectModalOpen(true)} 
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div className="dz-progress-row" style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
            <div style={{ flex: 1 }}>
              <DzProjectProgress totalPct={finalProgress} />
            </div>
            <DzQuickActions onStart={() => onShareStreak?.()} onNewProject={() => setIsProjectModalOpen(true)} onResetCycle={onNewProject} compact />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <DzActiveProjects weeks={data.weeks} />
          </div>

          <div className="dz-analytics-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32, alignItems: "start" }}>
            <DzProjectAnalytics dimensionData={dimensionData} pct90={pct90} />
            <DzTeamCollaboration members={displayMembers} onAdd={() => setIsMemberModalOpen(true)} />
          </div>

          <DzProjects projects={data.projects} onNew={() => setIsProjectModalOpen(true)} onToggle={handleToggleProject} onDelete={handleDeleteProject} />
        </div>
      </div>

      {isProjectModalOpen && (
        <ProjectModal 
          onClose={() => setIsProjectModalOpen(false)} 
          onSave={handleAddProject} 
        />
      )}

      {isMemberModalOpen && (
        <AddMemberModal 
          onClose={() => setIsMemberModalOpen(false)} 
          onSave={handleAddMember} 
        />
      )}
    </div>
  );
}
