import test from "node:test";
import { execFileSync } from "node:child_process";

test("prayer schedules preserve local dates at month boundaries", () => {
  const script = `
    import assert from 'node:assert/strict';
    import { religiousEngine } from './src/core/religiousEngine.js';
    const date = new Date(2026, 8, 30, 23, 30);
    assert.equal(religiousEngine.formatDate(date), '2026-09-30');
    assert.equal(religiousEngine.formatDate(new Date(2026, 8, 1)), '2026-09-01');
  `;
  for (const timezone of ["Asia/Baghdad", "America/New_York", "Pacific/Auckland"]) {
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: new URL("..", import.meta.url), env: { ...process.env, TZ: timezone }, stdio: "pipe",
    });
  }
});
