/**
 * Deterministic Hijri (Islamic) date conversion — tabular (Kuwaiti algorithm).
 * Pure math, no network. Validated against known reference dates:
 *   2024-03-11 → 1 Ramadan 1445
 *   2024-04-10 → 1 Shawwal 1445
 *   2023-07-19 → 1 Muharram 1445
 */

export const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qadah',
  'Dhu al-Hijjah',
];

export function jdn(gy: number, gm: number, gd: number): number {
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

export function gregorianToHijri(year: number, month: number, day: number): { y: number; m: number; d: number } {
  const gjd = jdn(year, month, day);

  let l = gjd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;

  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);

  const l3 = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

  const m = Math.floor((24 * l3) / 709);
  const d = l3 - Math.floor((709 * m) / 24);
  const y = 30 * n + j - 30;

  return { y, m, d };
}

export interface HijriDateResult {
  gregorian: string;
  day: number;
  month: number;
  monthName: string;
  year: number;
  formatted: string;
  weekday: string;
}

function parseDate(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${date}`);
  return d;
}

export function computeHijriDate(date?: string | Date): HijriDateResult {
  const d = date ? parseDate(date) : new Date();
  const { y, m, d: day } = gregorianToHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const formatted = `${day} ${HIJRI_MONTHS[m - 1]} ${y}`;
  return {
    gregorian: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    day,
    month: m,
    monthName: HIJRI_MONTHS[m - 1],
    year: y,
    formatted,
    weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
  };
}

export function weekdayInfo(date: string | Date): string {
  const d = parseDate(date);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${weekday}, ${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
}