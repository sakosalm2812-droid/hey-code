import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Sandbox } from '../src/core/sandbox.js';

test('PRIM-014 Acceptance Test 1: Simple script runs and returns output', async () => {
  const sb = new Sandbox();
  const res = await sb.run({
    language: 'node',
    code: 'console.log("hello from sandbox " + (2 + 2));',
  });

  assert.equal(res.ok, true);
  assert.equal(res.output, 'hello from sandbox 4');
  assert.equal(res.exit_code, 0);
  assert.ok(res.duration_ms >= 0);
});

test('PRIM-014 Acceptance Test 2: Infinite loop is killed at timeout', async () => {
  const sb = new Sandbox();
  const res = await sb.run({
    language: 'node',
    code: 'while(true) {}',
    limits: { timeout_seconds: 1 }, // 1s timeout
  });

  assert.equal(res.ok, false);
  assert.equal(res.error, 'limit_exceeded');
  assert.ok(res.duration_ms >= 900, 'must have timed out around 1 second');
});

test('PRIM-014 Acceptance Test 3: Memory bomb is killed at memory limit', async () => {
  const sb = new Sandbox();
  // 32MB max heap
  const res = await sb.run({
    language: 'node',
    code: `
      const chunks = [];
      while(true) {
        chunks.push(Buffer.alloc(5 * 1024 * 1024));
      }
    `,
    limits: { memory_mb: 32, timeout_seconds: 5 },
  });

  assert.equal(res.ok, false);
  assert.equal(res.error, 'limit_exceeded');
});

test('PRIM-014 Acceptance Test 4: Network is blocked by default', async () => {
  const sb = new Sandbox();
  const res = await sb.run({
    language: 'node',
    code: `
      import http from 'node:http';
      try {
        http.get('http://example.com');
      } catch (e) {
        console.error(e.message);
        process.exit(1);
      }
    `,
  });

  assert.equal(res.ok, false);
  assert.ok(res.stderr.includes('network_blocked') || res.error.includes('network_blocked'));
});

test('PRIM-014 Acceptance Test 5: Filesystem outside temp dir cannot be read when isolated', async () => {
  const sb = new Sandbox();
  const res = await sb.run({
    language: 'node',
    code: `
      import fs from 'node:fs';
      // cwd is isolated temp directory
      const files = fs.readdirSync('.');
      const hasParentFiles = files.includes('package.json') || files.includes('src');
      console.log(JSON.stringify({ files, hasParentFiles }));
    `,
  });

  assert.equal(res.ok, true);
  const data = JSON.parse(res.output);
  assert.equal(data.hasParentFiles, false, 'parent repository files are inaccessible from cwd');
  assert.ok(data.files.includes('main.mjs'));
});

test('PRIM-014 Acceptance Test 6: Temp dir is cleaned up after run', async () => {
  const sb = new Sandbox();
  const tmpBase = os.tmpdir();
  const initialSbDirs = fs.readdirSync(tmpBase).filter((f) => f.startsWith('hey-sandbox-'));

  await sb.run({
    language: 'node',
    code: 'console.log("running clean test");',
  });

  const finalSbDirs = fs.readdirSync(tmpBase).filter((f) => f.startsWith('hey-sandbox-'));
  assert.equal(finalSbDirs.length, initialSbDirs.length, 'temp directories must be fully cleaned up');
});

test('PRIM-014 Acceptance Test 7: Exit code is captured correctly', async () => {
  const sb = new Sandbox();
  const res = await sb.run({
    language: 'node',
    code: 'process.exit(42);',
  });

  assert.equal(res.ok, false);
  assert.equal(res.exit_code, 42);
});
