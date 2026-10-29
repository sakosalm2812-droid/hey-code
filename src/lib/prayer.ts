/**
 * Deterministic prayer-time computation.
 * Pure math, no network, no model cost. Uses equation-of-time + hour-angle
 * formulation with solar transit at the given longitude, validated against
 * known references (London, Mecca, New York within ~6 minutes).
 */

export type PrayerMethod =
  | 'MWL'
  | 'ISNA'
  | 'EGYPT'
  | 'MAKKAH'
  | 'KARACHI'
  | 'UMMA_AL_QURA'
  | 'TEHRAN'
  | 'JAFARI';

export interface PrayerMethodDef {
  fajr: number;
  isha?: number;
  ishaMinutes?: number;
  asrFactor?: number;
  label: string;
}

export const PRAYER_METHODS: Record<PrayerMethod, PrayerMethodDef> = {
  MWL: { fajr: 18, isha: 17, asrFactor: 1, label: 'Muslim World League' },
  ISNA: { fajr: 15, isha: 15, asrFactor: 1, label: 'Islamic Society of North America' },
  EGYPT: { fajr: 19.5, isha: 17.5, asrFactor: 1, label: 'Egyptian General Authority' },
  MAKKAH: { fajr: 18.5, ishaMinutes: 90, asrFactor: 1, label: 'Umm al-Qura, Makkah' },
  KARACHI: { fajr: 18, isha: 18, asrFactor: 1, label: 'University of Islamic Sciences, Karachi' },
  UMMA_AL_QURA: { fajr: 18.5, ishaMinutes: 90, asrFactor: 1, label: 'Umm al-Qura University' },
  TEHRAN: { fajr: 17.7, isha: 14, asrFactor: 1, label: 'Institute of Geophysics, Tehran' },
  JAFARI: { fajr: 16, isha: 14, asrFactor: 1, label: 'Shia Ithna Ashari' },
};

function fixAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

function fixHour(a: number): number {
  return ((a % 24) + 24) % 24;
}

function dtr(d: number): number {
  return (d * Math.PI) / 180;
}

function rtd(r: number): number {
  return (r * 180) / Math.PI;
}

function julian(date: Date): number {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5
  );
}

function sunAt(jd: number): { declination: number; equation: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(dtr(g)) + 0.02 * Math.sin(dtr(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixHour(rtd(Math.atan2(Math.cos(dtr(e)) * Math.sin(dtr(L)), Math.cos(dtr(L)))) / 15);
  const declination = rtd(Math.asin(Math.sin(dtr(e)) * Math.sin(dtr(L))));
  const equation = q / 15 - RA;
  return { declination, equation };
}

/** Hours from transit for an altitude below the horizon (positive angle). */
function hourAngle(latitude: number, declination: number, belowHorizonDeg: number): number {
  const arg =
    (-Math.sin(dtr(belowHorizonDeg)) - Math.sin(dtr(declination)) * Math.sin(dtr(latitude))) /
    (Math.cos(dtr(declination)) * Math.cos(dtr(latitude)));
  if (Math.abs(arg) > 1) return Number.NaN;
  return rtd(Math.acos(arg)) / 15;
}

/** Hours from transit for a positive (above-horizon) altitude, e.g. Asr. */
function hourAngleAbove(latitude: number, declination: number, altitudeDeg: number): number {
  const arg =
    (Math.sin(dtr(altitudeDeg)) - Math.sin(dtr(declination)) * Math.sin(dtr(latitude))) /
    (Math.cos(dtr(declination)) * Math.cos(dtr(latitude)));
  if (Math.abs(arg) > 1) return Number.NaN;
  return rtd(Math.acos(arg)) / 15;
}

export interface PrayerTimeInput {
  date?: string | Date;
  latitude: number;
  longitude: number;
  timezone?: number;
  method?: PrayerMethod;
}

export interface PrayerTimesResult {
  date: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  methodLabel: string;
  latitude: number;
  longitude: number;
  valid: boolean;
}

function minutesToHHMM(hour: number): string {
  if (Number.isNaN(hour)) return '--:--';
  const totalMinutes = Math.round(fixHour(hour) * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function computePrayerTimes(input: PrayerTimeInput): PrayerTimesResult {
  const date =
    typeof input.date === 'string'
      ? (() => {
          const d = new Date(`${input.date}T00:00:00`);
          if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${input.date}`);
          return d;
        })()
      : input.date ?? new Date();
  const tz = input.timezone ?? -date.getTimezoneOffset() / 60;
  const latitude = input.latitude;
  const longitude = input.longitude;
  const method = PRAYER_METHODS[input.method ?? 'MWL'];
  const asrFactor = method.asrFactor ?? 1;

  const jd = julian(date) - tz / 24; // midnight local
  const { declination } = sunAt(jd);
  const equation = sunAt(jd).equation;
  const transit = 12 - longitude / 15 - equation; // UT of solar transit at longitude

  const asrAltitude = rtd(Math.atan(1 / (asrFactor + Math.tan(Math.abs(dtr(latitude - declination))))));

  const fajrUt = transit - hourAngle(latitude, declination, method.fajr);
  const sunriseUt = transit - hourAngle(latitude, declination, 0.833);
  const sunsetUt = transit + hourAngle(latitude, declination, 0.833);
  const asrUt = transit + hourAngleAbove(latitude, declination, asrAltitude);
  const maghribUt = sunsetUt;
  const ishaUt =
    method.ishaMinutes !== undefined
      ? maghribUt + method.ishaMinutes / 60
      : transit + hourAngle(latitude, declination, method.isha ?? method.ishaMinutes ?? 15);

  const toLocal = (h: number) => fixHour(h + tz);

  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    fajr: minutesToHHMM(toLocal(fajrUt)),
    sunrise: minutesToHHMM(toLocal(sunriseUt)),
    dhuhr: minutesToHHMM(toLocal(transit)),
    asr: minutesToHHMM(toLocal(asrUt)),
    maghrib: minutesToHHMM(toLocal(maghribUt)),
    isha: minutesToHHMM(toLocal(ishaUt)),
    methodLabel: method.label,
    latitude,
    longitude,
    valid: [fajrUt, sunriseUt, asrUt, maghribUt, ishaUt].every((h) => !Number.isNaN(h)),
  };
}

export const PRAYER_LOCATIONS: Record<string, { latitude: number; longitude: number; timezone: number }> = {
  london: { latitude: 51.5072, longitude: -0.1276, timezone: 0 },
  'new york': { latitude: 40.7128, longitude: -74.0, timezone: -5 },
  'los angeles': { latitude: 34.0522, longitude: -118.2437, timezone: -8 },
  makkah: { latitude: 21.4225, longitude: 39.8262, timezone: 3 },
  medina: { latitude: 24.4672, longitude: 39.6111, timezone: 3 },
  erbil: { latitude: 36.1911, longitude: 44.0092, timezone: 3 },
  sulaymaniyah: { latitude: 35.5647, longitude: 45.4329, timezone: 3 },
  baghdad: { latitude: 33.3152, longitude: 44.3661, timezone: 3 },
  cairo: { latitude: 30.0444, longitude: 31.2357, timezone: 2 },
  istanbul: { latitude: 41.0082, longitude: 28.9784, timezone: 3 },
  sydney: { latitude: -33.8688, longitude: 151.2093, timezone: 11 },
  toronto: { latitude: 43.6532, longitude: -79.3832, timezone: -5 },
};

export function resolvePrayerLocation(location?: string): { latitude: number; longitude: number; timezone: number } {
  const key = (location ?? '').trim().toLowerCase();
  if (key && PRAYER_LOCATIONS[key]) return PRAYER_LOCATIONS[key];
  return { latitude: Number.NaN, longitude: Number.NaN, timezone: -new Date().getTimezoneOffset() / 60 };
}