import { promises as fs } from 'fs';
import path from 'path';

/**
 * Storage abstraction for user-uploaded files.
 *
 * Two drivers are supported:
 *  - `local` (default): writes files under `UPLOADS_DIR` (default `<cwd>/uploads`).
 *  - `s3`: stores objects in any S3-compatible bucket (AWS S3, Cloudflare R2,
 *          MinIO, DigitalOcean Spaces). Configure via S3_ENDPOINT / S3_BUCKET /
 *          S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY.
 *
 * Keys are `[scope]/[resourceId]` (e.g. `files/ckl...`). The public-serving
 * route `/api/uploads/[...path]` translates the URL path back to a key.
 */

const DRIVER = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
const LOCAL_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'));

if (process.env.NODE_ENV === 'production' && DRIVER !== 's3') {
  console.warn(
    '[storage] Running in production with the local-disk driver. ' +
      'Set STORAGE_DRIVER=s3 and the S3_* variables to persist user uploads durably.'
  );
}

export type StoredFile = { data: Buffer; contentType: string };

function isConfiguredS3(): boolean {
  return !!process.env.S3_BUCKET;
}

let s3Client: any = null;

async function getS3() {
  if (!s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const options: Record<string, unknown> = {
      region: process.env.S3_REGION || 'auto',
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    };
    s3Client = new S3Client(options);
  }
  return { client: s3Client as { send: (cmd: unknown) => Promise<unknown> }, bucket: process.env.S3_BUCKET! };
}

export function isKeySafe(key: string): boolean {
  if (!key || key.length > 500) return false;
  if (key.startsWith('/') || key.includes('\\') || key.includes('\0')) return false;
  const segments = key.split('/');
  return segments.every((s) => s && s !== '.' && s !== '..' && !s.includes(':'));
}

function localKeyPath(key: string): string {
  if (!isKeySafe(key)) throw new Error('Unsafe storage key');
  return path.join(LOCAL_DIR, key);
}

function metaKey(assetKey: string): string {
  return `${assetKey}.meta`;
}

async function localPut(key: string, data: Buffer, contentType: string): Promise<void> {
  const filePath = localKeyPath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
  await fs.writeFile(localKeyPath(metaKey(key)), JSON.stringify({ contentType }), 'utf-8');
}

async function localGet(key: string): Promise<StoredFile | null> {
  const filePath = localKeyPath(key);
  try {
    const [data, metaRaw] = await Promise.all([
      fs.readFile(filePath),
      fs.readFile(localKeyPath(metaKey(key)), 'utf-8').catch(() => null),
    ]);
    let contentType = 'application/octet-stream';
    try {
      if (metaRaw) contentType = JSON.parse(metaRaw).contentType ?? contentType;
    } catch {}
    return { data, contentType };
  } catch {
    return null;
  }
}

async function localDelete(key: string): Promise<void> {
  try {
    await fs.unlink(localKeyPath(key));
  } catch {}
  try {
    await fs.unlink(localKeyPath(metaKey(key)));
  } catch {}
}

async function s3Put(key: string, data: Buffer, contentType: string): Promise<void> {
  const { client, bucket } = await getS3();
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  await client.send(new (PutObjectCommand as any)({ Bucket: bucket, Key: key, Body: data, ContentType: contentType }));
}

async function s3Get(key: string): Promise<StoredFile | null> {
  const { client, bucket } = await getS3();
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    const result: any = await client.send(new (GetObjectCommand as any)({ Bucket: bucket, Key: key }));
    const body = (result.Body as { transformToByteArray: () => Promise<Uint8Array> }) ?? (result.Body as { transformToBuffer?: () => Promise<Buffer> });
    let data: Buffer;
    if (typeof body.transformToByteArray === 'function') {
      data = Buffer.from(await body.transformToByteArray());
    } else if (typeof (result.Body as any).transformToBuffer === 'function') {
      data = Buffer.from(await (result.Body as any).transformToBuffer());
    } else {
      data = Buffer.from(await result.Body.arrayBuffer());
    }
    return { data, contentType: result.ContentType || 'application/octet-stream' };
  } catch {
    return null;
  }
}

async function s3Delete(key: string): Promise<void> {
  const { client, bucket } = await getS3();
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await client.send(new (DeleteObjectCommand as any)({ Bucket: bucket, Key: key }));
  } catch {}
}

export async function putFile(key: string, data: Buffer, contentType: string): Promise<void> {
  if (DRIVER === 's3' && isConfiguredS3()) {
    await s3Put(key, data, contentType);
    return;
  }
  await localPut(key, data, contentType);
}

export async function getFile(key: string): Promise<StoredFile | null> {
  if (!isKeySafe(key)) return null;
  if (DRIVER === 's3' && isConfiguredS3()) {
    return s3Get(key);
  }
  return localGet(key);
}

export async function deleteFile(key: string): Promise<void> {
  if (!isKeySafe(key)) return;
  if (DRIVER === 's3' && isConfiguredS3()) {
    await s3Delete(key);
    return;
  }
  await localDelete(key);
}

export function deleteUploadedFiles(keys: Array<string | null | undefined>): Promise<void> {
  const tasks = keys
    .filter((k): k is string => !!k && k.startsWith('/api/uploads/'))
    .map(async (url) => {
      const key = url.replace(/^\/api\/uploads\//, '');
      try {
        await deleteFile(key);
      } catch {}
    });
  return Promise.all(tasks).then(() => undefined);
}