import {
  BarChart,
  Bar as RechartsBar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { C } from "../theme/colors.js";
import { DIMS } from "../lib/appConstants.js";
import { computeStreak, getMilestone } from "../lib/appLogics.js";
import { Bar } from "../components/app/AppPrimitive.jsx";
import { Card, H, Lbl, Pill } from "../components/ui/index.js";

export function Analytics({ data, onShareStreak }) {
  const weeks = data.weeks || [];
  const streak = computeStreak(weeks);
  const milestone = getMilestone(streak);
  const cycles = data.cycleGoalSets || [];

  const dimData = DIMS.map((dim) => {
    let total = 0;
    let done = 0;
    cycles.forEach((c) => {
      const goals = c.goals?.[dim.key] || [];
      const checks = c.checked?.[dim.key] || [];
      goals.forEach((g, i) => {
        if (g.trim()) {
          total++;
          if (checks[i]) done++;
        }
      });
    });
    return {
      name: dim.label.slice(0, 6),
      full: dim.label,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      color: dim.color,
      done,
      total,
    };
  });

  const weeklyData = weeks.slice(-12).map((w) => {
    const actualIdx = weeks.indexOf(w);
    const actionsDone = (w.checkedActions || []).reduce((acc, row) => acc + (Array.isArray(row) ? row.filter(Boolean).length : 0), 0);
    return {
      name: `W${actualIdx + 1}`,
      goals: (w.goals || []).filter(Boolean).length,
      actions: actionsDone,
      wins: (w.wins || []).filter(Boolean).length,
      done: w.done ? 1 : 0,
    };
  });

  const totalGoalsSet = dimData.reduce((a, d) => a + d.total, 0);
  const totalGoalsDone = dimData.reduce((a, d) => a + d.done, 0);
  const overallPct = totalGoalsSet > 0 ? Math.round((totalGoalsDone / totalGoalsSet) * 100) : 0;

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <H size={32} style={{ marginBottom: 12 }}>Analytics</H>
      <p style={{ color: "#6B7280", fontSize: 15, marginBottom: 40 }}>How you're performing across every dimension of your life.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        <Card style={{ textAlign: "center", padding: "32px" }}>
          <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Week Streak</p>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{streak}</div>
          {milestone && (
            <div style={{ marginTop: 16 }}>
              <div style={{ background: `${milestone.color}15`, color: milestone.color, padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, display: "inline-block" }}>{milestone.label.toUpperCase()}</div>
            </div>
          )}
          {streak > 0 && (
            <button
              onClick={onShareStreak}
              className="tap"
              style={{
                marginTop: 24,
                background: C.forest,
                border: "none",
                color: "#FFFFFF",
                padding: "8px 20px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5,150,105,0.2)"
              }}
            >
              Share Streak
            </button>
          )}
        </Card>
        <Card style={{ textAlign: "center", padding: "32px" }}>
          <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Goals Completed</p>
          <div style={{ fontSize: 56, fontWeight: 800, color: C.forest, lineHeight: 1 }}>{overallPct}%</div>
          <p style={{ color: "#6B7280", fontSize: 14, fontWeight: 600, marginTop: 16 }}>
            {totalGoalsDone} of {totalGoalsSet} goals
          </p>
        </Card>
      </div>

      {totalGoalsSet > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, marginBottom: 32 }}>
          <Card style={{ padding: "32px 24px 16px" }}>
            <H size={20} style={{ marginBottom: 24 }}>Completion by Dimension</H>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dimData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #F3F4F6", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 600 }}
                  formatter={(v, _, props) => [`${v}% (${props.payload.done}/${props.payload.total})`, props.payload.full]}
                  cursor={{ fill: "#F9FAFB" }}
                />
                <RechartsBar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {dimData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </RechartsBar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <H size={20} style={{ marginBottom: 24 }}>Dimension Breakdown</H>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {dimData.map((d, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: "#111827", fontSize: 14, fontWeight: 700 }}>{d.full}</span>
                    <span style={{ color: d.color, fontSize: 14, fontWeight: 800 }}>{d.pct}%</span>
                  </div>
                  <Bar value={d.done} max={Math.max(d.total, 1)} color={d.color} h={8} />
                  <p style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, marginTop: 6 }}>
                    {d.done} of {d.total} goals completed
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {weeklyData.length > 0 && (
        <Card style={{ padding: "32px 24px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <H size={20} style={{ margin: 0 }}>Recent Weeks — Performance</H>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.forest }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Goals Set</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#60A5FA" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280" }}>Actions Done</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #F3F4F6", borderRadius: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 600 }}
                cursor={{ fill: "#F9FAFB" }}
              />
              <RechartsBar dataKey="goals" name="Goals Set" fill={C.forest} radius={[4, 4, 0, 0]} barSize={12} />
              <RechartsBar dataKey="actions" name="Actions Done" fill="#60A5FA" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {weeks.length === 0 && totalGoalsSet === 0 && (
        <div style={{ textAlign: "center", padding: "80px 40px", background: "#FFFFFF", borderRadius: 24, border: "1px solid #F3F4F6" }}>
          <p style={{ color: "#6B7280", fontSize: 15, lineHeight: 1.6 }}>Complete your first week and set some goals to see your analytics here.</p>
        </div>
      )}
    </div>
  );
}

