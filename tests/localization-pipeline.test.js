/**
 * Tests for localizationPipeline.js
 * Minimum 10 tests per spec.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  REQUIRED_LOCALE_FIELDS,
  MANDATORY_LOCALES,
  validateLocale,
  registerLocale,
  requestSignOff,
  assertSignOff,
  getSignOffStatus,
  getRegisteredLocales,
  getAllSignOffs,
  checkMandatoryLocales,
  _clear,
} from "../src/core/localizationPipeline.js";

describe("localizationPipeline.js", () => {
  beforeEach(() => {
    _clear();
  });

  it("validateLocale fails for unregistered locale", () => {
    const result = validateLocale("ckb");
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.includes("Locale ckb not registered"));
  });

  it("validateLocale fails for missing required fields", () => {
    // registerLocale now throws for missing required fields
    assert.throws(() => {
      registerLocale({ locale: "en", direction: "ltr" });
    }, /config.pluralRule is required/);
  });

  it("validateLocale passes for complete locale", () => {
    registerLocale({
      locale: "en",
      direction: "ltr",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Arial", "system-ui"],
      dateFormat: "MM/dd/yyyy",
      numberFormat: "#,##0.00",
      nativeSpeakerVerified: true,
    });
    const result = validateLocale("en");
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it("registerLocale creates frozen config", () => {
    const config = registerLocale({
      locale: "fr",
      direction: "ltr",
      pluralRule: n => n > 1 ? "plural" : "singular",
      fontFallback: ["Roboto", "system-ui"],
      dateFormat: "dd/MM/yyyy",
      numberFormat: "# ##0,00",
      nativeSpeakerVerified: false,
    });
    assert.strictEqual(config.locale, "fr");
    assert.strictEqual(config.direction, "ltr");
    assert.ok(config.pluralRule);
    assert.ok(Array.isArray(config.fontFallback));
    assert.strictEqual(config.nativeSpeakerVerified, false);
    // Frozen
    assert.throws(() => { config.locale = "de"; }, /Cannot assign to read only property/);
  });

  it("MANDATORY_LOCALES includes ckb and ar", () => {
    assert.ok(MANDATORY_LOCALES.includes("ckb"));
    assert.ok(MANDATORY_LOCALES.includes("ar"));
    assert.strictEqual(MANDATORY_LOCALES.length, 2);
  });

  it("requestSignOff requires locale, nativeSpeaker, and evidence", () => {
    registerLocale({
      locale: "ckb",
      direction: "rtl",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "yyyy/MM/dd",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });

    assert.deepStrictEqual(
      requestSignOff({ locale: "ckb" }),
      { ok: false, reason: "nativeSpeaker is required" }
    );
    assert.deepStrictEqual(
      requestSignOff({ locale: "ckb", nativeSpeaker: "Ahmed" }),
      { ok: false, reason: "evidence must be a non-empty array" }
    );
  });

  it("requestSignOff rejects non-mandatory locales", () => {
    registerLocale({
      locale: "en",
      direction: "ltr",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Arial", "system-ui"],
      dateFormat: "MM/dd/yyyy",
      numberFormat: "#,##0.00",
      nativeSpeakerVerified: false,
    });
    const result = requestSignOff({ locale: "en", nativeSpeaker: "John", evidence: ["test"] });
    assert.strictEqual(result.ok, false);
    assert.ok(result.reason.includes("not subject to mandatory sign-off"));
  });

  it("requestSignOff succeeds for mandatory locale with evidence", () => {
    registerLocale({
      locale: "ckb",
      direction: "rtl",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "yyyy/MM/dd",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });

    const result = requestSignOff({
      locale: "ckb",
      nativeSpeaker: "Karim Rashid",
      evidence: ["screenshot-rtl.png", "plural-test-results.json", "font-rendering-test.pdf"],
    });
    assert.strictEqual(result.ok, true);
    assert.ok(result.signOffId);
    assert.ok(result.signOffId.startsWith("signoff-ckb-"));
  });

  it("assertSignOff throws for unsigned locale", () => {
    registerLocale({
      locale: "ar",
      direction: "rtl",
      pluralRule: n => n === 0 ? "zero" : n === 1 ? "one" : n === 2 ? "two" : n % 100 >= 3 && n % 100 <= 10 ? "few" : n % 100 >= 11 && n % 100 <= 99 ? "many" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "dd/MM/yyyy",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });
    assert.throws(() => assertSignOff("ar"), /has not been signed off/);
  });

  it("assertSignOff passes after sign-off", () => {
    registerLocale({
      locale: "ar",
      direction: "rtl",
      pluralRule: n => n === 0 ? "zero" : n === 1 ? "one" : n === 2 ? "two" : n % 100 >= 3 && n % 100 <= 10 ? "few" : n % 100 >= 11 && n % 100 <= 99 ? "many" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "dd/MM/yyyy",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });
    requestSignOff({
      locale: "ar",
      nativeSpeaker: "Ahmed Hassan",
      evidence: ["rtl-test.png", "arabic-plural-test.json"],
    });
    // Should not throw
    assert.doesNotThrow(() => assertSignOff("ar"));
  });

  it("getSignOffStatus returns signed status", () => {
    registerLocale({
      locale: "ckb",
      direction: "rtl",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "yyyy/MM/dd",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });
    requestSignOff({
      locale: "ckb",
      nativeSpeaker: "Karim",
      evidence: ["evidence1"],
    });

    const status = getSignOffStatus("ckb");
    assert.strictEqual(status.signed, true);
    assert.strictEqual(status.by, "Karim");
    assert.ok(status.at);
    assert.deepStrictEqual(status.evidence, ["evidence1"]);
  });

  it("getSignOffStatus returns unsigned for unknown locale", () => {
    const status = getSignOffStatus("xx");
    assert.strictEqual(status.signed, false);
  });

  it("checkMandatoryLocales identifies missing sign-offs", () => {
    registerLocale({
      locale: "ckb",
      direction: "rtl",
      pluralRule: n => n === 1 ? "one" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "yyyy/MM/dd",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });
    registerLocale({
      locale: "ar",
      direction: "rtl",
      pluralRule: n => n === 0 ? "zero" : n === 1 ? "one" : n === 2 ? "two" : n % 100 >= 3 && n % 100 <= 10 ? "few" : n % 100 >= 11 && n % 100 <= 99 ? "many" : "other",
      fontFallback: ["Noto Sans Arabic", "Amiri", "system-ui"],
      dateFormat: "dd/MM/yyyy",
      numberFormat: "#,##0.###",
      nativeSpeakerVerified: false,
    });

    let check = checkMandatoryLocales();
    assert.strictEqual(check.ok, false);
    assert.deepStrictEqual(check.missing.sort(), ["ar", "ckb"]);

    requestSignOff({ locale: "ckb", nativeSpeaker: "Karim", evidence: ["ev1"] });
    check = checkMandatoryLocales();
    assert.strictEqual(check.ok, false);
    assert.deepStrictEqual(check.missing, ["ar"]);

    requestSignOff({ locale: "ar", nativeSpeaker: "Ahmed", evidence: ["ev2"] });
    check = checkMandatoryLocales();
    assert.strictEqual(check.ok, true);
    assert.deepStrictEqual(check.missing, []);
  });

  it("getRegisteredLocales returns all locales", () => {
    registerLocale({ locale: "en", direction: "ltr", pluralRule: n => "other", fontFallback: ["Arial"], dateFormat: "", numberFormat: "", nativeSpeakerVerified: true });
    registerLocale({ locale: "ckb", direction: "rtl", pluralRule: n => "other", fontFallback: ["Noto"], dateFormat: "", numberFormat: "", nativeSpeakerVerified: false });
    const locales = getRegisteredLocales();
    assert.strictEqual(locales.length, 2);
    const codes = locales.map(l => l.locale).sort();
    assert.deepStrictEqual(codes, ["ckb", "en"]);
  });

  it("getAllSignOffs returns all sign-offs", () => {
    registerLocale({ 
      locale: "ckb", 
      direction: "rtl", 
      pluralRule: n => "other", 
      fontFallback: ["Noto"], 
      dateFormat: "yyyy/MM/dd", 
      numberFormat: "#,##0.###", 
      nativeSpeakerVerified: false 
    });
    registerLocale({ 
      locale: "ar", 
      direction: "rtl", 
      pluralRule: n => "other", 
      fontFallback: ["Noto"], 
      dateFormat: "dd/MM/yyyy", 
      numberFormat: "#,##0.###", 
      nativeSpeakerVerified: false 
    });
    requestSignOff({ locale: "ckb", nativeSpeaker: "K", evidence: ["e1"] });
    requestSignOff({ locale: "ar", nativeSpeaker: "A", evidence: ["e2"] });
    const signoffs = getAllSignOffs();
    assert.strictEqual(signoffs.length, 2);
  });

  it("validateLocale enforces RTL for ckb and ar", () => {
    registerLocale({
      locale: "ckb",
      direction: "ltr", // Wrong!
      pluralRule: n => "other",
      fontFallback: ["Noto"],
      dateFormat: "",
      numberFormat: "",
      nativeSpeakerVerified: true,
    });
    const result = validateLocale("ckb");
    assert.strictEqual(result.ok, false);
    assert.ok(result.errors.some(e => e.includes("rtl")));
  });

  it("validateLocale enforces pluralRule as function", () => {
    assert.throws(() => {
      registerLocale({
        locale: "ckb",
        direction: "rtl",
        pluralRule: "not-a-function",
        fontFallback: ["Noto"],
        dateFormat: "",
        numberFormat: "",
        nativeSpeakerVerified: true,
      });
    }, /config.pluralRule must be a function/);
  });

  it("validateLocale enforces fontFallback array", () => {
    assert.throws(() => {
      registerLocale({
        locale: "ckb",
        direction: "rtl",
        pluralRule: n => "other",
        fontFallback: "not-an-array",
        dateFormat: "",
        numberFormat: "",
        nativeSpeakerVerified: true,
      });
    }, /config.fontFallback must be a non-empty array/);
  });
});