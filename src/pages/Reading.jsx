import { C } from "../theme/colors.js";
import { Btn, Card, H, Lbl, NumList } from "../components/ui/index.js";

export function Reading({ data, setData, layout }) {
  const upd = (i, f, v) =>
    setData((d) => {
      const b = [...d.books];
      b[i] = { ...b[i], [f]: v };
      return { ...d, books: b };
    });

  const colors = [C.forest, "#3B82F6", "#F59E0B", "#8B5CF6"];
  const isMobile = layout === "mobile";

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <H size={isMobile ? 24 : 32} style={{ margin: 0 }}>Reading Plan</H>
        <Btn 
          style={{ 
            flexShrink: 0, 
            padding: isMobile ? "8px 12px" : "10px 20px", 
            fontSize: isMobile ? 12 : 14,
            minWidth: "auto"
          }}
          onClick={() =>
            setData((d) => ({
              ...d,
              books: [...d.books, { title: "", author: "", lessons: ["", "", ""], actions: ["", "", ""] }],
            }))
          }
        >
          {isMobile ? "+ Add Book" : "+ Add Another Book"}
        </Btn>
      </div>
      
      <div style={{ marginBottom: 48 }}>
        <p style={{ color: "#6B7280", fontSize: 15, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
          "You will be the same in 5 years except for the books you read."
        </p>
        <p style={{ color: "#9CA3AF", fontSize: 13, fontWeight: 700, marginTop: 8 }}>— Charlie Jones</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 24, marginBottom: 32 }}>
        {data.books.map((bk, i) => {
          const color = colors[i % colors.length];
          return (
            <Card key={i} style={{ 
              background: `${color}08`, 
              border: `1px solid ${color}30`,
              boxShadow: `0 12px 30px -10px ${color}25, 0 4px 10px -5px ${color}20`,
              padding: 24
            }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 56,
                    borderRadius: 10,
                    background: `${color}15`,
                    border: `1px solid ${color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: color, fontWeight: 800, fontSize: 16 }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    value={bk.title} 
                    onChange={(e) => upd(i, "title", e.target.value)} 
                    placeholder="Book title..." 
                    className="il" 
                    style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6, borderBottom: `1px solid ${color}20` }} 
                  />
                  <input 
                    value={bk.author} 
                    onChange={(e) => upd(i, "author", e.target.value)} 
                    placeholder="Author..." 
                    className="il" 
                    style={{ fontSize: 13, color: "#6B7280", borderBottom: "none" }} 
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: "#9CA3AF", marginBottom: 12, textTransform: "uppercase" }}>Top 3 Lessons</p>
                  <NumList items={bk.lessons} onChange={(v) => upd(i, "lessons", v)} placeholder="Key lesson..." />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: color, marginBottom: 12, textTransform: "uppercase" }}>Actions I'll Take</p>
                  <NumList items={bk.actions} onChange={(v) => upd(i, "actions", v)} placeholder="I will apply this by..." />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

