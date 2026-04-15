/** Shape of one weekly journal entry — `userId` ties the row to auth.users for sync/RLS */
export function newWeek(userId = null) {
  return {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    ...(userId ? { userId } : {}),
    wins: ["", "", ""],
    goals: ["", "", ""],
    actions: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    checkedActions: [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ],
    showUp: ["", "", ""],
    limiting: ["", "", ""],
    empowering: ["", "", ""],
    learned: ["", "", ""],
    worked: ["", "", ""],
    avoided: ["", ""],
    doOver: [""],
    iAm: ["", "", ""],
    done: false,
  };
}

/** Attach the signed-in user's UUID to every week (cross-device / API filtering). */
export function stampWeeksWithUserId(weeks, userId) {
  if (!userId || !Array.isArray(weeks)) return weeks;
  let changed = false;
  const next = weeks.map((w) => {
    if (w.userId === userId) return w;
    changed = true;
    return { ...w, userId };
  });
  return changed ? next : weeks;
}
