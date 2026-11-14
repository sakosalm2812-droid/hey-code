import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SchemaMigrationSystem } from '../src/core/schemaMigrationSystem.js';

test('PRIM-015 Acceptance Test 1 & 6: Forward migration applies and status reports correct current version', async () => {
  const tmpPath = path.resolve('tmp', 'migrations-1.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const system = new SchemaMigrationSystem({ storagePath: tmpPath });
  const schemaState = { tables: [] };

  system.register({
    version: 1,
    up: async () => {
      schemaState.tables.push('users');
    },
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'users');
    },
  });

  system.register({
    version: 2,
    up: async () => {
      schemaState.tables.push('posts');
    },
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'posts');
    },
  });

  assert.equal(system.status().current, null);
  assert.deepEqual(system.status().pending, [1, 2]);

  await system.migrate_to(2);

  assert.equal(system.status().current, 2);
  assert.deepEqual(system.status().pending, []);
  assert.deepEqual(schemaState.tables, ['users', 'posts']);
});

test('PRIM-015 Acceptance Test 2: Rollback restores previous schema', async () => {
  const tmpPath = path.resolve('tmp', 'migrations-2.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const system = new SchemaMigrationSystem({ storagePath: tmpPath });
  const schemaState = { tables: [] };

  system.register({
    version: 1,
    up: async () => schemaState.tables.push('users'),
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'users');
    },
  });

  system.register({
    version: 2,
    up: async () => schemaState.tables.push('posts'),
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'posts');
    },
  });

  await system.migrate_to(2);
  assert.deepEqual(schemaState.tables, ['users', 'posts']);

  // Rollback to version 1
  await system.rollback_to(1);
  assert.equal(system.status().current, 1);
  assert.deepEqual(schemaState.tables, ['users']);

  // Rollback to version 0 (empty)
  await system.rollback_to(0);
  assert.equal(system.status().current, null);
  assert.deepEqual(schemaState.tables, []);
});

test('PRIM-015 Acceptance Test 3: Failed migration does not leave partial state', async () => {
  const tmpPath = path.resolve('tmp', 'migrations-3.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const system = new SchemaMigrationSystem({ storagePath: tmpPath });
  const schemaState = { tables: [] };

  system.register({
    version: 1,
    up: async () => schemaState.tables.push('users'),
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'users');
    },
  });

  system.register({
    version: 2,
    up: async () => {
      schemaState.tables.push('orders');
      throw new Error('Database constraint failure during migration 2');
    },
    down: async () => {
      schemaState.tables = schemaState.tables.filter((t) => t !== 'orders');
    },
  });

  await assert.rejects(async () => {
    await system.migrate_to(2);
  }, /constraint failure/);

  // Status must remain at version 1; partial 'orders' must be cleaned up
  assert.equal(system.status().current, 1);
  assert.deepEqual(schemaState.tables, ['users']);
});

test('PRIM-015 Acceptance Test 4: Checksum mismatch blocks migration', async () => {
  const tmpPath = path.resolve('tmp', 'migrations-4.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  // Step 1: Run with original checksum
  const system1 = new SchemaMigrationSystem({ storagePath: tmpPath });
  system1.register({
    version: 1,
    up: async () => {},
    down: async () => {},
    checksum: 'original_checksum_abc',
  });
  await system1.migrate_to(1);

  // Step 2: Code changes and checksum differs
  const system2 = new SchemaMigrationSystem({ storagePath: tmpPath });
  system2.register({
    version: 1,
    up: async () => {},
    down: async () => {},
    checksum: 'modified_checksum_xyz',
  });

  await assert.rejects(async () => {
    await system2.migrate_to(1);
  }, /checksum_mismatch/);
});

test('PRIM-015 Acceptance Test 5: Concurrent migrators do not collide', async () => {
  const tmpPath = path.resolve('tmp', 'migrations-5.json');
  if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

  const system = new SchemaMigrationSystem({ storagePath: tmpPath });
  system.register({
    version: 1,
    up: async () => {
      await new Promise((r) => setTimeout(r, 50));
    },
    down: async () => {},
  });

  const [res1, res2] = await Promise.allSettled([
    system.migrate_to(1),
    system.migrate_to(1),
  ]);

  const rejected = [res1, res2].filter((r) => r.status === 'rejected');
  assert.equal(rejected.length, 1, 'one of the concurrent migrators must be rejected by lock');
  assert.ok(rejected[0].reason.message.includes('Concurrent migration in progress'));
});
