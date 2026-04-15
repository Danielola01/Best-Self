import { DIMS, MILESTONES, QUOTES, TRIAL_DAYS } from "./appConstants.js";

// ── Streak helpers ──
export function computeStreak(weeks) {
  if (!weeks || weeks.length === 0) return 0;
  const done = weeks.filter((w) => w.done).length;
  return done; // simplified: consecutive completed weeks
}

export function getMilestone(streak) {
  return [...MILESTONES].reverse().find((m) => streak >= m.weeks) || null;
}

// ── AI suggestion helper ──
export async function fetchAISuggestions(dim, existingGoals, userName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. AI suggestions disabled.");
    return ["Please configure GEMINI_API_KEY", "to enable AI suggestions", "in your settings."];
  }

  const existing = existingGoals.filter(Boolean).join(", ") || "none set yet";
  const prompt = `You are a world-class life coach helping ${userName || "a driven professional"} set powerful ${dim} goals for their 90-day cycle.

Their current ${dim} goals: ${existing}

Generate exactly 3 fresh, specific, ambitious but achievable ${dim} goals for the next 90 days. 
Return ONLY a JSON array of 3 strings, no preamble, no markdown. Example: ["Goal one","Goal two","Goal three"]`;

  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("AI Fetch Error:", err);
    return [];
  }
}

// ── Quotes engine ──
export function pickRotatingQuote({ lastQuoteIdx = -1, lastOpenDate }, todayIso) {
  const today = todayIso || new Date().toISOString().slice(0, 10);
  let nextIdx = lastQuoteIdx;

  if (lastOpenDate !== today || lastQuoteIdx < 0) {
    do {
      nextIdx = Math.floor(Math.random() * QUOTES.length);
    } while (nextIdx === lastQuoteIdx && QUOTES.length > 1);
  }

  return { today, nextIdx, quote: QUOTES[nextIdx] };
}

// ── Trial / lock helpers ──
export function trialDaysLeft(user) {
  if (user.subscribed) return Infinity;
  const start = new Date(user.trialStart);
  const elapsed = Math.floor((Date.now() - start) / 86400000);
  return Math.max(0, TRIAL_DAYS - elapsed);
}

export function isLocked(user) {
  return trialDaysLeft(user) <= 0 && !user.subscribed;
}

export function blankGoals() {
  return Object.fromEntries(DIMS.map((d) => [d.key, ["", ""]]));
}

