import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGeneratedForgeResponse } from '../src/lib/forgeResponse.js';
const response = { artifact: { title: 'Generated site', files: [{ path: 'index.html', content: '<h1>Site</h1>' }] }, validation: { valid: true }, projectId: 'saved-project' };
test('Forge accepts its real multi-file server contract without requiring nonexistent artifact.content', () => {
  assert.equal(validateGeneratedForgeResponse(response), response);
});
test('Forge rejects unsaved, empty, malformed and duplicate artifact files', () => {
  for (const data of [{ ...response, projectId: null }, { ...response, validation: { valid: false } }, { ...response, artifact: { files: [] } }, ...['../outside', '/absolute', 'C:\\outside', 'a/../outside'].map(path => ({ ...response, artifact: { files: [{ path, content: 'unsafe' }] } })), { ...response, artifact: { files: [...response.artifact.files, ...response.artifact.files] } }]) assert.throws(() => validateGeneratedForgeResponse(data));
});
