import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { UnifiedMediaGenerator } from '../src/core/unifiedMediaGenerator.js';

test('PRIM-011 Acceptance Test 1 & 4: Image generates, stores with provenance, and is verified (non-zero size)', async () => {
  const tmpArtifacts = path.resolve('tmp', 'artifacts-1');
  const generator = new UnifiedMediaGenerator({ artifactDir: tmpArtifacts });

  const job = await generator.generate({
    modality: 'image',
    prompt: 'A futuristic city skyline at dusk',
    scope: 'project_media',
  });

  assert.equal(job.status, 'completed');
  assert.equal(job.modality, 'image');
  assert.ok(job.output_url, 'output_url must be populated');
  assert.ok(fs.existsSync(job.output_url), 'output file must exist');
  assert.ok(fs.statSync(job.output_url).size > 0, 'output file must be non-zero size');
  assert.ok(job.artifact_id, 'artifact_id must be assigned');
  assert.equal(job.provenance.scope, 'project_media');
  assert.equal(job.provenance.prompt, 'A futuristic city skyline at dusk');
});

test('PRIM-011 Acceptance Test 2: Timeout marks effect_unknown', async () => {
  const generator = new UnifiedMediaGenerator();

  // Register a slow dispatcher
  generator.registerDispatcher('video', async () => {
    await new Promise((r) => {
      const t = setTimeout(r, 2000);
      t.unref?.();
    });
    return { output_url: 'dummy.mp4' };
  });

  const job = await generator.generate({
    modality: 'video',
    prompt: 'Slow rendering video clip',
    scope: 'project_video',
    timeoutMs: 50, // 50ms timeout
  });

  assert.equal(job.status, 'failed');
  assert.equal(job.effect_unknown, true, 'timed out job must have effect_unknown: true');
  assert.equal(job.error, 'timeout_exceeded');
});

test('PRIM-011 Acceptance Test 3: Cost is recorded per job', async () => {
  const generator = new UnifiedMediaGenerator();

  generator.registerDispatcher('audio', async () => {
    const tmpFile = path.resolve('tmp', 'audio-output.mp3');
    fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
    fs.writeFileSync(tmpFile, 'audio_bytes');
    return { output_url: tmpFile, cost: 0.045 };
  });

  const job = await generator.generate({
    modality: 'audio',
    prompt: 'Synthesize spoken paragraph',
    scope: 'voice_notes',
  });

  assert.equal(job.status, 'completed');
  assert.equal(job.cost, 0.045, 'exact job cost must be recorded');
});

test('PRIM-011 Acceptance Test 5: Invalid params rejected before dispatch', async () => {
  const generator = new UnifiedMediaGenerator();

  // Invalid modality
  await assert.rejects(async () => {
    await generator.generate({
      modality: 'hologram', // unsupported
      prompt: 'test prompt',
      scope: 'project_1',
    });
  }, /Invalid modality/);

  // Missing scope
  await assert.rejects(async () => {
    await generator.generate({
      modality: 'image',
      prompt: 'test prompt',
      scope: '', // empty scope rejected
    });
  }, /scope is mandatory/);

  // Empty prompt
  await assert.rejects(async () => {
    await generator.generate({
      modality: 'image',
      prompt: '   ',
      scope: 'project_1',
    });
  }, /Prompt must be a non-empty string/);
});

test('PRIM-011 Acceptance Test 6: Two parallel jobs do not collide', async () => {
  const tmpArtifacts = path.resolve('tmp', 'artifacts-parallel');
  const generator = new UnifiedMediaGenerator({ artifactDir: tmpArtifacts });

  const [job1, job2] = await Promise.all([
    generator.generate({
      modality: 'image',
      prompt: 'Parallel Prompt 1',
      scope: 'scope_parallel',
    }),
    generator.generate({
      modality: 'image',
      prompt: 'Parallel Prompt 2',
      scope: 'scope_parallel',
    }),
  ]);

  assert.notEqual(job1.id, job2.id);
  assert.notEqual(job1.output_url, job2.output_url);
  assert.ok(fs.existsSync(job1.output_url));
  assert.ok(fs.existsSync(job2.output_url));
});
