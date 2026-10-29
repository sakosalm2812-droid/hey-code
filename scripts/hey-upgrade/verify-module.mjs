// Module verification probe for the HEY upgrade orchestrator.
// Usage:
//   node scripts/hey-upgrade/verify-module.mjs \
//     --import src/core/executionEngine.js src/core/eventBus.js \
//     --exists src/pages/VoicePage.jsx src-tauri/tauri.conf.json \
//     [--test tests/journeys.test.js]
//
// --import paths must resolve as Node ESM modules (core/lib .js files).
// --exists paths must be present (covers views/native/config surface area).
// --test optionally runs one Node test file.
// Exits 0 only when every probe passes; otherwise prints a report and exits 1.

import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
function collect(flag) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag) {
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        values.push(args[++i]);
      }
    }
  }
  return values;
}

const imports = collect("--import");
const exists = collect("--exists");
const tests = collect("--test");
const failures = [];

const root = process.cwd();
let filesChecked = 0;

for (const rel of exists) {
  filesChecked++;
  const abs = path.resolve(root, rel);
  if (!existsSync(abs)) failures.push(`MISSING ${rel}`);
}

for (const rel of imports) {
  filesChecked++;
  const abs = path.resolve(root, rel);
  if (!existsSync(abs)) {
    failures.push(`MISSING ${rel}`);
    continue;
  }
  try {
    await import(pathToFileURL(abs).href);
  } catch (error) {
    failures.push(`IMPORT_FAIL ${rel}: ${String(error?.message || error).split("\n")[0]}`);
  }
}

for (const testFile of tests) {
  const probe = spawnSync(
    process.execPath,
    ["--test", path.resolve(root, testFile)],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  if (probe.status !== 0) {
    failures.push(`TEST_FAIL ${testFile}: ${String(probe.stdout || "").split("\n").filter((l) => /(fail|error)/i.test(l)).slice(-5).join(" | ")}`);
  }
}

if (failures.length) {
  console.error(`verify-module: ${failures.length} failure(s) of ${filesChecked} probe(s)`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`verify-module: ok (${imports.length} imports, ${exists.length} exists, ${tests.length} tests)`);
process.exit(0);