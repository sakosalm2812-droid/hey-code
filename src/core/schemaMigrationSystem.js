import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { log as auditLog } from './auditLogger.js';

export class SchemaMigrationSystem {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), 'data', 'migrations', 'schema_migrations.json');
    this.auditLogger = options.auditLogger || auditLog;
    this.migrations = new Map(); // version -> { version, up, down, checksum }
    this.applied = []; // [{ version, applied_at, checksum }]
    this.isLocked = false;

    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}

    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        this.applied = JSON.parse(raw);
      }
    } catch {
      this.applied = [];
    }
  }

  saveState() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.applied, null, 2), 'utf-8');
    } catch {}
  }

  computeChecksum(up, down) {
    const upStr = typeof up === 'string' ? up : up.toString();
    const downStr = typeof down === 'string' ? down : down.toString();
    return crypto.createHash('sha256').update(upStr + downStr).digest('hex');
  }

  register({ version, up, down, checksum = null }) {
    if (version === undefined || version === null) {
      throw new TypeError('Migration version is required');
    }
    if (typeof up !== 'function' || typeof down !== 'function') {
      throw new TypeError('Migration up and down must be functions');
    }

    const calcChecksum = checksum || this.computeChecksum(up, down);

    this.migrations.set(Number(version), {
      version: Number(version),
      up,
      down,
      checksum: calcChecksum,
    });
  }

  status() {
    const sortedRegistered = Array.from(this.migrations.keys()).sort((a, b) => a - b);
    const appliedVersions = new Set(this.applied.map((a) => a.version));

    const current = this.applied.length > 0 ? this.applied[this.applied.length - 1].version : null;
    const pending = sortedRegistered.filter((v) => !appliedVersions.has(v));

    return {
      current,
      pending,
      applied: [...this.applied],
    };
  }

  async migrate_to(target_version = null) {
    if (this.isLocked) {
      throw new Error('Concurrent migration in progress; locked');
    }
    this.isLocked = true;

    try {
      this.loadState();
      // Check for checksum mismatch on applied migrations
      for (const appliedItem of this.applied) {
        const registered = this.migrations.get(appliedItem.version);
        if (registered && registered.checksum !== appliedItem.checksum) {
          const err = new Error(
            `checksum_mismatch: Migration ${appliedItem.version} checksum changed from ${appliedItem.checksum} to ${registered.checksum}`
          );
          err.code = 'CHECKSUM_MISMATCH';
          throw err;
        }
      }

      const sortedRegistered = Array.from(this.migrations.keys()).sort((a, b) => a - b);
      const appliedSet = new Set(this.applied.map((a) => a.version));

      const toApply = sortedRegistered.filter((v) => {
        if (appliedSet.has(v)) return false;
        if (target_version !== null && v > Number(target_version)) return false;
        return true;
      });

      for (const version of toApply) {
        const mig = this.migrations.get(version);

        try {
          await mig.up();

          const record = {
            version,
            applied_at: new Date().toISOString(),
            checksum: mig.checksum,
          };
          this.applied.push(record);
          this.saveState();

          if (typeof this.auditLogger === 'function') {
            this.auditLogger({
              event_type: 'migrate:applied',
              actor: 'migration_system',
              payload: record,
            });
          }
        } catch (upErr) {
          // Roll back partial state on failure
          try {
            await mig.down();
          } catch {}

          if (typeof this.auditLogger === 'function') {
            this.auditLogger({
              event_type: 'migrate:failed',
              actor: 'migration_system',
              payload: { version, error: upErr.message },
            });
          }

          throw upErr;
        }
      }

      return { ok: true, current: this.status().current };
    } finally {
      this.isLocked = false;
    }
  }

  async rollback_to(target_version) {
    if (this.isLocked) {
      throw new Error('Concurrent migration in progress; locked');
    }
    this.isLocked = true;

    try {
      this.loadState();
      const target = Number(target_version);

      // Pop migrations from latest applied down to target
      while (this.applied.length > 0) {
        const latest = this.applied[this.applied.length - 1];
        if (latest.version <= target) {
          break; // reached target
        }

        const mig = this.migrations.get(latest.version);
        if (mig) {
          await mig.down();
        }

        this.applied.pop();
        this.saveState();

        if (typeof this.auditLogger === 'function') {
          this.auditLogger({
            event_type: 'migrate:rolled_back',
            actor: 'migration_system',
            payload: { version: latest.version },
          });
        }
      }

      return { ok: true, current: this.status().current };
    } finally {
      this.isLocked = false;
    }
  }
}

export const defaultMigrationSystem = new SchemaMigrationSystem();

export function register(migration) {
  return defaultMigrationSystem.register(migration);
}

export function migrate_to(target_version) {
  return defaultMigrationSystem.migrate_to(target_version);
}

export function rollback_to(target_version) {
  return defaultMigrationSystem.rollback_to(target_version);
}

export function status() {
  return defaultMigrationSystem.status();
}

export default {
  SchemaMigrationSystem,
  defaultMigrationSystem,
  register,
  migrate_to,
  rollback_to,
  status,
};
