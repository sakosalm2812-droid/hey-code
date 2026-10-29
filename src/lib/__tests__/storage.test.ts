import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

describe('storage (local driver)', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'hey-storage-'));
    process.env.STORAGE_DRIVER = 'local';
    process.env.UPLOADS_DIR = dir;
    vi.resetModules();
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
    delete process.env.UPLOADS_DIR;
    delete process.env.STORAGE_DRIVER;
  });

  async function load() {
    return (await import('@/lib/storage')) as typeof import('@/lib/storage');
  }

  it('round-trips a file with its content type', async () => {
    const { putFile, getFile } = await load();
    await putFile('files/abc', Buffer.from('hello world'), 'text/plain');
    const stored = await getFile('files/abc');
    expect(stored?.data.toString()).toBe('hello world');
    expect(stored?.contentType).toBe('text/plain');
  });

  it('returns null for a missing file', async () => {
    const { getFile } = await load();
    expect(await getFile('files/missing')).toBeNull();
  });

  it('deletes files', async () => {
    const { putFile, getFile, deleteFile } = await load();
    await putFile('chat/def', Buffer.from('x'), 'application/octet-stream');
    expect(await getFile('chat/def')).not.toBeNull();
    await deleteFile('chat/def');
    expect(await getFile('chat/def')).toBeNull();
  });

  it('rejects unsafe keys', async () => {
    const { getFile, putFile } = await load();
    await expect(putFile('../escape', Buffer.from('x'), 'text/plain')).rejects.toThrow('Unsafe storage key');
    await expect(putFile('/abs', Buffer.from('x'), 'text/plain')).rejects.toThrow('Unsafe storage key');
    expect(await getFile('../escape')).toBeNull();
    expect(await getFile('files/..')).toBeNull();
  });

  it('collects only internal /api/uploads/ urls for cleanup', async () => {
    const { deleteUploadedFiles } = await load();
    const keys: Array<string | null | undefined> = [
      '/api/uploads/files/one',
      '/api/uploads/chat/two',
      '/uploads/legacy-placeholder',
      'https://cdn.example.com/file.png',
      null,
      undefined,
    ];
    await expect(deleteUploadedFiles(keys)).resolves.toBeUndefined();
  });
});