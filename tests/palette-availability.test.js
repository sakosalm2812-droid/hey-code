import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getRowAvailability, getRowsAvailability, filterEnabledRows, partitionRowsByAvailability } from '../src/components/palette/availability.js';

describe('palette/availability.js', () => {
  describe('getRowAvailability', () => {
    it('returns enabled native for row without capabilityId', () => {
      const row = { id: 'test', label: 'Test', capabilityId: null };
      const avail = getRowAvailability(row, 'web');
      assert.strictEqual(avail.enabled, true);
      assert.strictEqual(avail.state, 'native');
      assert.strictEqual(avail.reason, null);
    });

    it('returns enabled native for available capability on web', () => {
      // computer.open_url is available on web
      const row = { id: 'test', capabilityId: 'computer.open_url' };
      const avail = getRowAvailability(row, 'web');
      assert.strictEqual(avail.enabled, true);
      assert.strictEqual(avail.state, 'native');
    });

    it('returns enabled bridged for permission_required capability on web', () => {
      // voice.listen is permission_required on web
      const row = { id: 'test', capabilityId: 'voice.listen' };
      const avail = getRowAvailability(row, 'web');
      assert.strictEqual(avail.enabled, true);
      assert.strictEqual(avail.state, 'bridged');
      assert.ok(typeof avail.reason === 'string');
      assert.ok(avail.reason.length > 0);
    });

    it('returns relay-required with non-empty reason for restricted capability on iOS', () => {
      // computer.open_app is restricted on iOS
      const row = { id: 'test', capabilityId: 'computer.open_app' };
      const avail = getRowAvailability(row, 'ios');
      assert.strictEqual(avail.enabled, false);
      assert.strictEqual(avail.state, 'relay-required');
      assert.ok(typeof avail.reason === 'string');
      assert.ok(avail.reason.length > 0, 'Reason should be non-empty');
      assert.ok(avail.reason.includes('relay') || avail.reason.includes('Relay'));
    });

    it('returns bridged for permission_required capability on Android', () => {
      // computer.open_app is permission_required on Android
      const row = { id: 'test', capabilityId: 'computer.open_app' };
      const avail = getRowAvailability(row, 'android');
      assert.strictEqual(avail.enabled, true);
      assert.strictEqual(avail.state, 'bridged');
      assert.ok(typeof avail.reason === 'string');
      assert.ok(avail.reason.length > 0);
    });

    it('returns unavailable for unsupported capability on web', () => {
      // computer.open_app is unsupported on web
      const row = { id: 'test', capabilityId: 'computer.open_app' };
      const avail = getRowAvailability(row, 'web');
      assert.strictEqual(avail.enabled, false);
      assert.strictEqual(avail.state, 'unavailable');
      assert.ok(typeof avail.reason === 'string');
      assert.ok(avail.reason.length > 0);
    });

    it('returns unavailable for unknown capability', () => {
      const row = { id: 'test', capabilityId: 'nonexistent.capability' };
      const avail = getRowAvailability(row, 'web');
      assert.strictEqual(avail.enabled, false);
      assert.strictEqual(avail.state, 'unavailable');
      assert.ok(typeof avail.reason === 'string');
      assert.ok(avail.reason.length > 0);
    });

    it('returns relay-required for restricted capability on iOS (computer.close_app)', () => {
      const row = { id: 'test', capabilityId: 'computer.close_app' };
      const avail = getRowAvailability(row, 'ios');
      assert.strictEqual(avail.enabled, false);
      assert.strictEqual(avail.state, 'relay-required');
      assert.ok(avail.reason.length > 0);
    });

    it('returns relay-required for restricted capability on Android (computer.close_app)', () => {
      const row = { id: 'test', capabilityId: 'computer.close_app' };
      const avail = getRowAvailability(row, 'android');
      assert.strictEqual(avail.enabled, false);
      assert.strictEqual(avail.state, 'relay-required');
      assert.ok(avail.reason.length > 0);
    });
  });

  describe('getRowsAvailability', () => {
    it('returns array matching input length', () => {
      const rows = [
        { id: 'a', capabilityId: 'computer.open_url' },
        { id: 'b', capabilityId: 'voice.listen' },
        { id: 'c', capabilityId: 'computer.open_app' },
      ];
      const results = getRowsAvailability(rows, 'web');
      assert.strictEqual(results.length, 3);
    });

    it('each result has enabled, state, reason', () => {
      const rows = [{ id: 'a', capabilityId: 'computer.open_url' }];
      const results = getRowsAvailability(rows, 'web');
      assert.ok(typeof results[0].enabled === 'boolean');
      assert.ok(typeof results[0].state === 'string');
      assert.ok(results[0].reason === null || typeof results[0].reason === 'string');
    });
  });

  describe('filterEnabledRows', () => {
    it('filters to only enabled rows', () => {
      const rows = [
        { id: 'a', capabilityId: 'computer.open_url' }, // native on web
        { id: 'b', capabilityId: 'computer.open_app' }, // unavailable on web
        { id: 'c', capabilityId: 'voice.listen' }, // bridged but enabled on web
      ];
      const enabled = filterEnabledRows(rows, 'web');
      assert.strictEqual(enabled.length, 2);
      assert.ok(enabled.some(r => r.id === 'a'));
      assert.ok(enabled.some(r => r.id === 'c'));
      assert.ok(!enabled.some(r => r.id === 'b'));
    });
  });

  describe('partitionRowsByAvailability', () => {
    it('partitions into enabled and disabled', () => {
      const rows = [
        { id: 'a', capabilityId: 'computer.open_url' }, // native on web
        { id: 'b', capabilityId: 'computer.open_app' }, // unavailable on web
      ];
      const { enabled, disabled } = partitionRowsByAvailability(rows, 'web');
      assert.strictEqual(enabled.length, 1);
      assert.strictEqual(disabled.length, 1);
      assert.strictEqual(enabled[0].id, 'a');
      assert.strictEqual(disabled[0].id, 'b');
      assert.ok(disabled[0].availability.reason.length > 0);
    });

    it('disabled rows carry reason string', () => {
      const rows = [{ id: 'b', capabilityId: 'computer.open_app' }];
      const { disabled } = partitionRowsByAvailability(rows, 'web');
      assert.strictEqual(disabled.length, 1);
      assert.ok(typeof disabled[0].availability.reason === 'string');
      assert.ok(disabled[0].availability.reason.length > 0);
    });
  });
});