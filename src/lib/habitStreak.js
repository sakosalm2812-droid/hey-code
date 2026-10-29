export function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateKey(now = new Date()) {
  return dateKey(now);
}

export function toggleCompletionDates(completionDates, dateStr) {
  const set = new Set(completionDates || []);
  if (set.has(dateStr)) set.delete(dateStr);
  else set.add(dateStr);
  return Array.from(set).sort();
}

export function computeStreak(completionDates, now = new Date()) {
  const set = new Set(completionDates || []);
  if (set.size === 0) return 0;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;

  if (!set.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}