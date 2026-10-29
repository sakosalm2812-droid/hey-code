/**
 * Tests for scripts/snapshot-agents.mjs.
 *
 * The snapshot is the evidence base for every number in AGENT-TRUTH.md, so the two
 * properties that matter are tested, not assumed:
 *   1. it parses all 229 records and its committed output is current;
 *   2. it fails loudly, with file:line, when a record cannot be understood — a
 *      silent skip would quietly shrink the registry.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = join(repoRoot, 'scripts', 'snapshot-agents.mjs');
const agentDir = join(repoRoot, 'src', 'lib', 'agents');
const snapshotPath = join(repoRoot, 'docs', 'hey', 'agents.snapshot.json');
const sourceFiles = ['factory.ts', 'types.ts', 'data-core.ts', 'data-dev.ts', 'data-creative.ts', 'data-knowledge.ts', 'data-qa-forge.ts'];

function runScript(args, env = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function withFixture(mutate, assertions) {
  const dir = mkdtempSync(join(tmpdir(), 'hey-agents-'));
  try {
    for (const file of sourceFiles) copyFileSync(join(agentDir, file), join(dir, file));
    const target = mutate(dir);
    const result = runScript([], { HEY_AGENT_DIR: dir, HEY_SNAPSHOT_OUT: join(dir, 'out.json') });
    assertions(result, target);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('the committed snapshot is current and covers all 229 records', () => {
  const result = runScript(['--check']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /is current/);
  assert.match(result.stdout, /TOTAL\s+229 agents/);

  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  assert.equal(snapshot.agents.length, 229);
  assert.equal(snapshot.metadata.files.length, 5);
  assert.equal(
    snapshot.metadata.files.reduce((sum, file) => sum + file.agents, 0),
    229,
    'per-file counts must add up to the total'
  );
  for (const file of snapshot.metadata.files) {
    assert.match(file.sha256, /^[0-9a-f]{64}$/, `${file.file} needs a sha256`);
    assert.equal(file.file.startsWith('src/lib/agents/'), true);
  }

  const seen = new Set();
  for (const agent of snapshot.agents) {
    for (const field of ['id', 'name', 'category', 'description', 'risk', 'privacy']) {
      assert.equal(typeof agent[field], 'string', `${agent.id} is missing ${field}`);
    }
    assert.ok(Array.isArray(agent.tools) && Array.isArray(agent.permissions) && Array.isArray(agent.keywords));
    assert.ok(agent.source.file.endsWith('.ts'));
    assert.ok(Number.isInteger(agent.source.line) && agent.source.line > 0);
    assert.equal(seen.has(agent.id), false, `duplicate id ${agent.id}`);
    seen.add(agent.id);
  }
});

test('an options expression the parser does not understand fails loudly with file:line', () => {
  withFixture(
    (dir) => {
      const file = join(dir, 'data-core.ts');
      const source = readFileSync(file, 'utf8');
      const mutated = source.replace(
        "keywords: ['intent', 'classify', 'what do you want', 'purpose']",
        "keywords: FUTURE_HELPER(['intent'])"
      );
      assert.notEqual(mutated, source, 'fixture mutation must apply');
      writeFileSync(file, mutated);
    },
    (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /SNAPSHOT FAILED/);
      assert.match(result.stderr, /data-core\.ts:10: unsupported expression: FUTURE_HELPER/);
    }
  );
});

test('a record with an invalid value fails loudly instead of being skipped', () => {
  withFixture(
    (dir) => {
      const file = join(dir, 'data-dev.ts');
      const source = readFileSync(file, 'utf8');
      const mutated = source.replace("risk: 'high'", "risk: 'severe'");
      assert.notEqual(mutated, source, 'fixture mutation must apply');
      writeFileSync(file, mutated);
    },
    (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /data-dev\.ts:\d+: agent .* has unknown risk: severe/);
    }
  );
});

test('a duplicate id fails loudly rather than producing a 228-agent registry', () => {
  withFixture(
    (dir) => {
      const file = join(dir, 'data-core.ts');
      const source = readFileSync(file, 'utf8');
      const mutated = source.replace("ag('context',", "ag('intent',");
      assert.notEqual(mutated, source, 'fixture mutation must apply');
      writeFileSync(file, mutated);
    },
    (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /duplicate agent ids: intent/);
    }
  );
});

test('a changed agent count fails unless explicitly allowed', () => {
  withFixture(
    (dir) => {
      const file = join(dir, 'data-qa-forge.ts');
      const lines = readFileSync(file, 'utf8').split('\n');
      const index = lines.findIndex((line) => line.includes("ag('registry'"));
      assert.ok(index > 0, 'fixture must contain the registry agent');
      lines.splice(index, 1);
      writeFileSync(file, lines.join('\n'));
    },
    (result) => {
      assert.equal(result.status, 1);
      assert.match(result.stderr, /parsed 228 agents, expected 229/);
      assert.match(result.stderr, /--allow-count-change/);
    }
  );
});
