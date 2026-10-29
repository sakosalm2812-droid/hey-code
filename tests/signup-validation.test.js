import { test } from "node:test";
import assert from "node:assert/strict";

import { signupValidationError } from "../src/lib/signupValidation.js";

test("signup validation requires the 13+ age confirmation", () => {
  const ok = { name: "Ada", email: "ada@example.com", password: "correct-horse", ageConfirmed: true };
  assert.equal(signupValidationError(ok), "");
  assert.match(signupValidationError({ ...ok, ageConfirmed: false }), /13 years old/);
});

test("signup validation covers name, email and password rules", () => {
  const ok = { name: "Ada", email: "ada@example.com", password: "correct-horse", ageConfirmed: true };
  assert.match(signupValidationError({ ...ok, name: " " }), /name/);
  assert.match(signupValidationError({ ...ok, email: "not-an-email" }), /valid email/);
  assert.match(signupValidationError({ ...ok, email: " " }), /valid email/);
  assert.match(signupValidationError({ ...ok, password: "short" }), /at least 8 characters/);
  assert.match(signupValidationError({ ...ok, password: "" }), /at least 8 characters/);
});