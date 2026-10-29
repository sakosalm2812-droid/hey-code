import { describe, test, expect } from 'vitest';
import { computePrayerTimes, resolvePrayerLocation, PRAYER_LOCATIONS } from '@/lib/prayer';
import { computeHijriDate, gregorianToHijri } from '@/lib/hijri';

function timeDelta(actual: string, expected: string): number {
  const [ah, am] = actual.split(':').map(Number);
  const [eh, em] = expected.split(':').map(Number);
  return Math.abs(ah * 60 + am - (eh * 60 + em));
}

describe('prayer times', () => {
  test('London 2024-01-01 matches reference times within 8 minutes', () => {
    const r = computePrayerTimes({ latitude: 51.5072, longitude: -0.1276, timezone: 0, date: '2024-01-01', method: 'MWL' });
    expect(r.valid).toBe(true);
    expect(timeDelta(r.sunrise, '08:06')).toBeLessThanOrEqual(8);
    expect(timeDelta(r.dhuhr, '12:04')).toBeLessThanOrEqual(8);
    expect(timeDelta(r.maghrib, '16:01')).toBeLessThanOrEqual(8);
  });

  test('Makkah 2024-01-01 matches reference times within 8 minutes', () => {
    const r = computePrayerTimes({ latitude: 21.4225, longitude: 39.8262, timezone: 3, date: '2024-01-01', method: 'UMMA_AL_QURA' });
    expect(r.valid).toBe(true);
    expect(timeDelta(r.sunrise, '06:58')).toBeLessThanOrEqual(8);
    expect(timeDelta(r.dhuhr, '12:24')).toBeLessThanOrEqual(8);
    expect(timeDelta(r.maghrib, '17:49')).toBeLessThanOrEqual(8);
  });

  test('asr comes after dhuhr and before maghrib in a typical day', () => {
    const r = computePrayerTimes({ latitude: -33.8688, longitude: 151.2093, timezone: 11, date: '2024-06-21' });
    expect(r.valid).toBe(true);
    const toMin = (s: string) => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    };
    expect(toMin(r.dhuhr)).toBeLessThan(toMin(r.asr));
    expect(toMin(r.asr)).toBeLessThan(toMin(r.maghrib));
  });

  test('prayer order is fajr < sunrise < dhuhr < asr < maghrib < isha', () => {
    const r = computePrayerTimes({ latitude: 36.1911, longitude: 44.0092, timezone: 3, date: '2024-03-15' });
    expect(r.valid).toBe(true);
    const times = [r.fajr, r.sunrise, r.dhuhr, r.asr, r.maghrib, r.isha].map((s) => {
      const [h, m] = s.split(':').map(Number);
      return h * 60 + m;
    });
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
  });

  test('resolvePrayerLocation knows all configured cities and rejects unknowns', () => {
    expect(PRAYER_LOCATIONS.london.timezone).toBe(0);
    expect(resolvePrayerLocation('makkah').latitude).toBeCloseTo(21.4225);
    expect(Number.isNaN(resolvePrayerLocation('atlantis').latitude)).toBe(true);
  });

  test('throws on a malformed date string', () => {
    expect(() => computePrayerTimes({ latitude: 0, longitude: 0, date: 'not-a-date' })).toThrow();
  });
});

describe('hijri calendar', () => {
  test('2024-03-11 is 1 Ramadan 1445 (anchor)', () => {
    const h = gregorianToHijri(2024, 3, 11);
    expect(h).toEqual({ y: 1445, m: 9, d: 1 });
    expect(computeHijriDate('2024-03-11').formatted).toBe('1 Ramadan 1445');
  });

  test('2024-04-10 is 1 Shawwal 1445 (Eid al-Fitr anchor)', () => {
    const h = gregorianToHijri(2024, 4, 10);
    expect(h).toEqual({ y: 1445, m: 10, d: 1 });
  });

  test('2023-07-19 is 1 Muharram 1445 (Islamic New Year anchor)', () => {
    const h = gregorianToHijri(2023, 7, 19);
    expect(h).toEqual({ y: 1445, m: 1, d: 1 });
  });

  test('computeHijriDate includes the weekday and Gregorian source', () => {
    const r = computeHijriDate('2024-12-25');
    expect(r.weekday).toBeTruthy();
    expect(r.gregorian).toBe('2024-12-25');
    expect(r.formatted).toMatch(/^\d{1,2} [A-Za-z -]+ \d{4}$/);
    expect(r.day).toBeGreaterThan(0);
  });

  test('round-trips across a whole year without throwing', () => {
    for (let m = 1; m <= 12; m++) {
      const r = computeHijriDate(`2025-${String(m).padStart(2, '0')}-15`);
      expect(r.formatted).toMatch(/^\d{1,2} [A-Za-z -]+ \d{4}$/);
    }
  });
});