import { test } from "node:test";
import assert from "node:assert/strict";

import { KeyRotator } from "../src/core/keyRotator.js";
import { analyzeTeacher, classifyInputLocally, SUBJECT_CONFIGS } from "../src/core/aiRouter.js";
import { debate } from "../src/core/mentorCouncil.js";
import { stageCustomTool, getCustomTools, getCustomTool, removeCustomTool } from "../src/core/vaultStaging.js";

test("KeyRotator: initializes, sets keys, tracks count, and persists active index", () => {
  const rotator = new KeyRotator(["key1", "key2", "key3"]);
  assert.equal(rotator.getKeyCount(), 3);
  assert.equal(rotator.getCurrentKey(), "key1");

  const rotated = rotator.rotateKey();
  assert.equal(rotated, "key2");
  assert.equal(rotator.currentIndex, 1);

  rotator.rotateKey();
  assert.equal(rotator.currentIndex, 2);

  rotator.rotateKey();
  assert.equal(rotator.currentIndex, 0); // Loops back to 0
});

test("KeyRotator: parses comma and newline separated strings into pool", () => {
  const rotator = new KeyRotator();
  const count = rotator.setKeys("keyA, keyB\nkeyC,keyD");
  assert.equal(count, 4);
  assert.deepEqual(rotator.getKeys(), ["keyA", "keyB", "keyC", "keyD"]);
});

test("KeyRotator: detectProvider correctly classifies Google, NVIDIA, OpenRouter", () => {
  const rotator = new KeyRotator();
  assert.equal(rotator.detectProvider("AIzaSyTestGoogleKey"), "google");
  assert.equal(rotator.detectProvider("nvapi-TestNvidiaKey"), "nvidia");
  assert.equal(rotator.detectProvider("sk-or-v1-TestOpenRouterKey"), "openrouter");
});

test("AIRouter: classifyInputLocally maps subjects and returns required schema", () => {
  const chemResult = classifyInputLocally("I teach AP Chemistry and reaction thermodynamics");
  assert.equal(chemResult.subject, "chem");
  assert.equal(chemResult.themeColor, "#00F0FF");
  assert.ok(chemResult.tools.includes("Periodic Table"));

  const mathResult = classifyInputLocally("Multivariable Calculus and linear algebra");
  assert.equal(mathResult.subject, "math");
  assert.equal(mathResult.themeColor, "#8B5CF6");

  const artResult = classifyInputLocally("Digital illustration and color theory");
  assert.equal(artResult.subject, "art");

  const bioResult = classifyInputLocally("Genetics, DNA, and cellular respiration");
  assert.equal(bioResult.subject, "bio");

  const physResult = classifyInputLocally("Classical mechanics, gravity, and kinematics");
  assert.equal(physResult.subject, "phys");

  const engResult = classifyInputLocally("Literature, Shakespeare, and essay grading");
  assert.equal(engResult.subject, "eng");
});

test("MentorCouncil: debate simulates Jobs and Buffett personas with synthesis", async () => {
  const result = await debate("How should I teach stoichiometry to struggling students?", { subject: "chem" });
  assert.ok(result.jobsArgument);
  assert.ok(result.buffettArgument);
  assert.ok(result.synthesis);
  assert.ok(result.verdict);
  assert.equal(result.personas.length, 2);
  assert.equal(result.personas[0].name, "Steve Jobs");
  assert.equal(result.personas[1].name, "Warren Buffett");
});

test("VaultStaging: stages custom tool, retrieves it, and removes it", () => {
  const tool = stageCustomTool("Spectrophotometer Simulator", "<html><body>Spec</body></html>");
  assert.ok(tool.id);
  assert.equal(tool.name, "Spectrophotometer Simulator");

  const retrieved = getCustomTool(tool.id);
  assert.ok(retrieved);
  assert.equal(retrieved.name, "Spectrophotometer Simulator");

  const allTools = getCustomTools();
  assert.ok(allTools.some((t) => t.id === tool.id));

  removeCustomTool(tool.id);
  const afterDelete = getCustomTool(tool.id);
  assert.equal(afterDelete, null);
});
