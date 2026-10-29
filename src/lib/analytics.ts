export interface Bucket {
  date: string;
  count: number;
}

export function buildDailyWindow(days: number, end = new Date()): Date[] {
  const out: Date[] = [];
  const cursor = new Date(end);
  cursor.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(cursor.getTime() - i * 24 * 60 * 60 * 1000));
  }
  return out;
}

export function bucketize<T extends { createdAt: Date }>(records: T[], window: Date[], end = new Date()): Bucket[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const endOfWindow = new Date(end);
  endOfWindow.setHours(0, 0, 0, 0);

  const counts = new Map<string, number>();
  window.forEach((d) => counts.set(startKey(d), 0));

  for (const record of records) {
    const stamp = record.createdAt.getTime();
    if (stamp > endOfWindow.getTime() + dayMs - 1) continue;
    const offsetDays = Math.max(0, Math.floor((endOfWindow.getTime() + dayMs - 1 - stamp) / dayMs));
    if (offsetDays >= window.length) continue;
    const target = new Date(endOfWindow.getTime() - offsetDays * dayMs);
    const key = startKey(target);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return window.map((d) => ({ date: startKey(d), count: counts.get(startKey(d)) ?? 0 }));
}

export function startKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function maxBucket(buckets: Bucket[]): number {
  return buckets.reduce((max, b) => Math.max(max, b.count), 0);
}

export function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function topByCount<T>(items: T[], key: (item: T) => string, limit = 5): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = key(item) || 'unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}