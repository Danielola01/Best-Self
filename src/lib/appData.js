export const STORAGE_KEY = "bestself_v4";

export function storageKeyForUser(uid) {
  return uid ? `bestself_v4_${uid}` : STORAGE_KEY;
}

export function seed() {
  return {
    user: {
      name: "",
      role: "",
      joinDate: new Date().toISOString().slice(0, 10),
      subscribed: false,
      trialStart: new Date().toISOString().slice(0, 10),
    },
    annualGoalSets: [], // [{ year, goals: { spiritual:[...], ... } }]
    cycleGoalSets: [], // [{ label, startDate, goals: { ... } }]
    weeks: [],
    iAmCustom: [],
    books: [{ title: "", author: "", lessons: ["", "", ""], actions: ["", "", ""] }],
    lastQuoteIdx: -1,
    lastOpenDate: "",
    notifications: [
      { id: "welcome", title: "Welcome to BestSelf!", body: "Your journey to elite performance starts here. Set your 90-day goals to begin.", date: new Date().toISOString(), read: false }
    ],
    projects: [],
    teamMembers: [],
  };
}

export function loadMergedFromLocalStorage(key, seedFn) {
  try {
    const r = localStorage.getItem(key);
    if (r) {
      return { ...seedFn(), ...JSON.parse(r) };
    }
  } catch (_) {
    /* ignore */
  }
  return seedFn();
}

export function writeLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {
    /* ignore */
  }
}
