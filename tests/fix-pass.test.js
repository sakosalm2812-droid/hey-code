import assert from "node:assert/strict";
import test from "node:test";

import {
  dateKey,
  todayDateKey,
  toggleCompletionDates,
  computeStreak,
} from "../src/lib/habitStreak.js";
import { matchesWakeWord } from "../src/lib/wakeWordDetector.js";
import {
  computePrayerTimes,
  toHijri,
} from "../src/core/prayerTimes.js";
import {
  pushState,
  urlBase64ToUint8Array,
  PUSH_STATES,
} from "../src/lib/heyPush.js";
import {
  setReligiousPreferences,
  setReligiousLocation,
  getPrayerSchedule,
  getIslamicCalendarDate,
} from "../src/core/religiousEngine.js";

test("dateKey uses local calendar dates", () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(dateKey(new Date(2024, 11, 31)), "2024-12-31");
  assert.equal(todayDateKey(new Date(2026, 8, 18)), "2026-09-18");
});

test("toggleCompletionDates adds and removes a date", () => {
  assert.deepEqual(toggleCompletionDates([], "2026-09-18"), ["2026-09-18"]);
  assert.deepEqual(
    toggleCompletionDates(["2026-09-17", "2026-09-18"], "2026-09-18"),
    ["2026-09-17"],
  );
  assert.deepEqual(
    toggleCompletionDates(["2026-09-18"], "2026-09-17").sort(),
    ["2026-09-17", "2026-09-18"].sort(),
  );
});

test("computeStreak counts consecutive local days", () => {
  const now = new Date(2026, 8, 18);
  assert.equal(computeStreak(["2026-09-18", "2026-09-17", "2026-09-16"], now), 3);
  assert.equal(computeStreak(["2026-09-18"], now), 1);
  assert.equal(computeStreak([], now), 0);
});

test("computeStreak allows today to be pending", () => {
  const now = new Date(2026, 8, 18);
  assert.equal(computeStreak(["2026-09-17", "2026-09-16"], now), 2);
});

test("computeStreak resets on a missed day", () => {
  const now = new Date(2026, 8, 18);
  assert.equal(computeStreak(["2026-09-18", "2026-09-16"], now), 1);
});

test("matchesWakeWord matches boundary phrases only", () => {
  assert.equal(matchesWakeWord("hey", ["hey"]), true);
  assert.equal(matchesWakeWord("hey what time is it", ["hey"]), true);
  assert.equal(matchesWakeWord("what time is it hey", ["hey"]), true);
  assert.equal(matchesWakeWord("they said hi", ["hey"]), false);
  assert.equal(matchesWakeWord("honey", ["hey"]), false);
  assert.equal(matchesWakeWord("", ["hey"]), false);
});

test("prayer times are not the old hardcoded stub", () => {
  const date = new Date(2026, 5, 15);
  const times = computePrayerTimes(date, { lat: 51.5072, lon: -0.1276 }, { method: "MWL" });
  const names = times.map((entry) => entry.name.toLowerCase());
  assert.deepEqual(names, ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]);
  const fajrMinutes = times[0].time.getHours() * 60 + times[0].time.getMinutes();
  assert.ok(fajrMinutes !== 330, "fajr should not equal the old hardcoded 05:30");
  assert.ok(times[0].time && times[5].time, "all prayer entries have dates");
});

test("toHijri returns a real computed date", () => {
  const hijri = toHijri(new Date(2026, 0, 1));
  assert.ok(hijri.year >= 1400 && hijri.year <= 1500, `unexpected year ${hijri.year}`);
  assert.ok(hijri.month >= 1 && hijri.month <= 12);
  assert.ok(hijri.day >= 1 && hijri.day <= 30);
});

test("religiousEngine schedules derive from solar geometry", () => {
  setReligiousPreferences({ enabled: true });
  setReligiousLocation({ lat: 21.422487, lon: 39.826206 });

  const schedule = getPrayerSchedule(new Date());
  assert.ok(schedule, "a schedule for the current month exists");
  assert.equal(schedule.computedFromSolarGeometry, true);
  for (const prayer of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
    assert.match(schedule[prayer], /^\d{2}:\d{2}$/, `${prayer} is HH:MM`);
  }
  assert.notEqual(schedule.fajr, "05:30", "fajr is not the old hardcoded stub");
});

test("religiousEngine hijri is computed, not fixed", () => {
  const calendar = getIslamicCalendarDate(new Date(2026, 1, 1));
  assert.ok(calendar.hijri.year >= 1400 && calendar.hijri.year <= 1500);
  assert.ok(calendar.hijri.month >= 1 && calendar.hijri.month <= 12);
  assert.ok(calendar.hijri.day >= 1 && calendar.hijri.day <= 30);
});

test("urlBase64ToUint8Array decodes URL-safe base64 keys", () => {
  assert.deepEqual(Array.from(urlBase64ToUint8Array("AQIDBA")), [1, 2, 3, 4]);
  assert.deepEqual(Array.from(urlBase64ToUint8Array("AQI=")), [1, 2]);
  assert.deepEqual(Array.from(urlBase64ToUint8Array("AQIDBA==")), [1, 2, 3, 4]);
});

test("pushState resolves honest states in node", () => {
  assert.equal(pushState(null, "granted"), PUSH_STATES.UNSUPPORTED);
});