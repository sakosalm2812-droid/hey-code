import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function resolvePowerShell() {
  for (const command of ["pwsh", "powershell"]) {
    const probe = spawnSync(command, ["-NoProfile", "-Command", "exit 0"], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (probe.error == null) return command;
  }
  throw new Error("No PowerShell runtime (pwsh or powershell) is available.");
}

test("transactional upgrade framework protects baselines, logs, and rollback", () => {
  const shell = resolvePowerShell();
  const result = spawnSync(
    shell,
    ["-NoProfile", "-File", "scripts/hey-upgrade/Test-HeyUpgrade.ps1"],
    { cwd: process.cwd(), encoding: "utf8", windowsHide: true, timeout: 120_000 },
  );

  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const report = JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1));
  assert.equal(report.success, true);
  assert.equal(report.tests, 15);
});

