import test from "node:test";
import assert from "node:assert/strict";
import { INFINITY_FEATURE_COUNT, getInfinityFeatures } from "../src/core/infinity/infinityManifest.js";
import { registerProvider, routeProvider, unregisterProvider } from "../src/core/infinity/providerRouter.js";
import { runQualityGate } from "../src/core/infinity/qualityGate.js";

test("Infinity feature manifest includes the full system layer", () => {
  assert.ok(INFINITY_FEATURE_COUNT >= 40);
  const ids = getInfinityFeatures().map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const required of ["universal-actions", "missions", "provider-router", "quality-gates", "privacy-router", "time-travel", "model-council"]) assert.ok(ids.includes(required));
});

test("provider router prefers compatible healthy higher-quality provider", () => {
  registerProvider({ id: "test-local", modalities: ["text"], quality: .8, speed: .8, privacy: 1, local: true, estimatedCost: 0 });
  registerProvider({ id: "test-cloud", modalities: ["text", "image"], quality: .95, speed: .7, privacy: .5, estimatedCost: .3 });
  const local = routeProvider({ modality: "text", localOnly: true });
  assert.equal(local.selected?.id, "test-local");
  const image = routeProvider({ modality: "image" });
  assert.equal(image.selected?.id, "test-cloud");
  unregisterProvider("test-local"); unregisterProvider("test-cloud");
});

test("quality gate refuses empty output", async () => {
  const result = await runQualityGate("", {}, ["non-empty"]);
  assert.equal(result.ok, false);
});
