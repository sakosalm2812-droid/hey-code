/**
 * Tests for exportHonesty.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRINT_STATES,
  PDF_PLATFORM_STATES,
  getPdfPlatformState,
  getPrintState,
  getPdfExportAction,
  getPrintAction,
  getPackStatusWords,
} from '../src/core/exportHonesty.js';
import { EXPORT_MODES, EXPORT_REASONS } from '../src/core/exportMatrix.js';

describe('exportHonesty', () => {
  describe('constants', () => {
    test('PRINT_STATES has five states', () => {
      assert.deepEqual(Object.values(PRINT_STATES).sort(), ['blocked', 'drafted', 'exported', 'printed', 'rendered']);
    });

    test('PDF_PLATFORM_STATES has four states', () => {
      assert.deepEqual(Object.values(PDF_PLATFORM_STATES).sort(), ['bridged', 'native', 'relay-required', 'unavailable']);
    });
  });

  describe('getPdfPlatformState', () => {
    test('native capability -> native', () => {
      const state = getPdfPlatformState({ state: 'native' });
      assert.equal(state, PDF_PLATFORM_STATES.native);
    });

    test('bridged capability -> bridged', () => {
      const state = getPdfPlatformState({ state: 'bridged' });
      assert.equal(state, PDF_PLATFORM_STATES.bridged);
    });

    test('relay-required capability -> relay-required', () => {
      const state = getPdfPlatformState({ state: 'relay-required' });
      assert.equal(state, PDF_PLATFORM_STATES.relay_required);
    });

    test('unavailable capability -> unavailable', () => {
      const state = getPdfPlatformState({ state: 'unavailable' });
      assert.equal(state, PDF_PLATFORM_STATES.unavailable);
    });

    test('null capability -> unavailable', () => {
      const state = getPdfPlatformState(null);
      assert.equal(state, PDF_PLATFORM_STATES.unavailable);
    });
  });

  describe('getPrintState', () => {
    const pack = { id: 'pack-1', sections: [] };
    const pagePlan = { pages: [{ blocks: [] }], stats: { totalPages: 2 } };

    test('no page plan -> drafted', () => {
      const state = getPrintState(pack, null, { state: 'native' });
      assert.equal(state.state, PRINT_STATES.DRAFTED);
      assert.equal(state.label, 'Drafted');
      assert.equal(state.canExportPdf, false);
    });

    test('page plan exists, not printed -> rendered', () => {
      const state = getPrintState(pack, pagePlan, { state: 'native' });
      assert.equal(state.state, PRINT_STATES.RENDERED);
      assert.equal(state.label, 'Rendered');
      assert.equal(state.canExportPdf, true);
      assert.ok(state.detail.includes('1 page')); // pagePlan.pages.length is 1
    });

    test('rendered on unavailable platform -> cannot export', () => {
      const state = getPrintState(pack, pagePlan, { state: 'unavailable' });
      assert.equal(state.state, PRINT_STATES.RENDERED);
      assert.equal(state.canExportPdf, false);
      assert.equal(state.reason, 'no-pdf-capability');
    });

    test('printed -> printed state', () => {
      const state = getPrintState(pack, pagePlan, { state: 'native' }, true);
      assert.equal(state.state, PRINT_STATES.PRINTED);
      assert.equal(state.label, 'Printed');
    });

    test('exported native -> exported with honesty note absent', () => {
      const state = getPrintState(pack, pagePlan, { state: 'native' }, false, true);
      assert.equal(state.state, PRINT_STATES.EXPORTED);
      assert.equal(state.label, 'Exported');
      assert.ok(!state.honestyNote);
      assert.ok(state.detail.includes('Real PDF'));
    });

    test('exported bridged -> exported with honesty note', () => {
      const state = getPrintState(pack, pagePlan, { state: 'bridged' }, false, true);
      assert.equal(state.state, PRINT_STATES.EXPORTED);
      assert.ok(state.honestyNote);
      assert.ok(state.honestyNote.includes('browser'));
      assert.ok(state.honestyNote.includes('not by HEY'));
    });
  });

  describe('getPdfExportAction', () => {
    test('native -> enabled Export PDF', () => {
      const action = getPdfExportAction({ state: 'native' });
      assert.equal(action.label, 'Export PDF');
      assert.equal(action.disabled, false);
      assert.equal(action.honestyNote, null);
    });

    test('bridged -> enabled Save as PDF with honesty note', () => {
      const action = getPdfExportAction({ state: 'bridged' });
      assert.equal(action.label, 'Save as PDF (via browser)');
      assert.equal(action.disabled, false);
      assert.ok(action.honestyNote);
      assert.ok(action.honestyNote.includes('browser'));
    });

    test('relay-required -> disabled with reason', () => {
      const action = getPdfExportAction({ state: 'relay-required', reason: 'needs relay' });
      assert.equal(action.disabled, true);
      assert.ok(action.label.includes('needs HEY Relay'));
      assert.ok(action.reason.includes('HEY Relay'));
    });

    test('unavailable -> disabled with reason', () => {
      const action = getPdfExportAction({ state: 'unavailable', reason: 'no print' });
      assert.equal(action.disabled, true);
      assert.ok(action.label.includes('unavailable'));
    });
  });

  describe('getPrintAction', () => {
    test('native -> enabled Print', () => {
      const action = getPrintAction({ state: 'native' });
      assert.equal(action.label, 'Print');
      assert.equal(action.disabled, false);
    });

    test('bridged -> enabled Print', () => {
      const action = getPrintAction({ state: 'bridged' });
      assert.equal(action.label, 'Print');
      assert.equal(action.disabled, false);
    });

    test('relay-required -> disabled', () => {
      const action = getPrintAction({ state: 'relay-required', reason: 'needs relay' });
      assert.equal(action.disabled, true);
      assert.ok(action.reason);
    });

    test('unavailable -> disabled', () => {
      const action = getPrintAction({ state: 'unavailable' });
      assert.equal(action.disabled, true);
    });

    test('null -> disabled', () => {
      const action = getPrintAction(null);
      assert.equal(action.disabled, true);
    });
  });

  describe('getPackStatusWords', () => {
    const pack = { id: 'pack-1', sections: [] };
    const pagePlan = { pages: [{ blocks: [] }] };

    test('drafted only', () => {
      const words = getPackStatusWords(pack, null, false, false, { state: 'native' });
      assert.deepEqual(words, ['drafted']);
    });

    test('drafted + rendered', () => {
      const words = getPackStatusWords(pack, pagePlan, false, false, { state: 'native' });
      assert.deepEqual(words, ['drafted', 'rendered']);
    });

    test('drafted + rendered + printed', () => {
      const words = getPackStatusWords(pack, pagePlan, true, false, { state: 'native' });
      assert.deepEqual(words, ['drafted', 'rendered', 'printed']);
    });

    test('drafted + rendered + printed + exported (native)', () => {
      const words = getPackStatusWords(pack, pagePlan, true, true, { state: 'native' });
      assert.deepEqual(words, ['drafted', 'rendered', 'printed', 'exported']);
    });

    test('exported on unavailable platform stays at printed', () => {
      const words = getPackStatusWords(pack, pagePlan, true, true, { state: 'unavailable' });
      assert.deepEqual(words, ['drafted', 'rendered', 'printed']);
    });
  });
});