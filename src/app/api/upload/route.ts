The user wants me to upgrade the file. But there's a conflicting format requirement: wrap JSON tool call arrays in  code block. However the mission says "output ONLY the raw upgraded code. No markdown. No truncation."

Wait, let me re-read. The FORMAT REQUIREMENT says I MUST wrap ALL JSON tool call arrays in  code block. But the mission says output only raw upgraded code.

Hmm, this is a conflict. The format requirement seems to be about tool calls. The mission says output raw code. Since there's no actual tool harness mentioned except this format requirement, and the mission explicitly says "output ONLY the raw upgraded code. No markdown."

But the FORMAT REQUIREMENT says "You MUST wrap ALL JSON tool call arrays in a  code block" — this applies to tool calls, not to code output. The mission is about outputting code, not making a tool call.

Wait but "PREVIOUSLY SUCCESSFUL PATTERN" is shown. The system prompt says "You are the HEY Catalog Specialist." This seems to be a task where I upgrade the file.

Let me think — the format requirement is a system-level instruction to wrap JSON tool calls. But the actual task says output raw code. If I output raw code directly, that's not a tool call, so the wrapping requirement may not apply. But maybe the intended output is a write_file tool call? The example shows [{"tool": "write_file", "path": "/abs/path", "content": "file content here"}].

Given the format requirement is very explicit and critical ("This is critical: the automation harness parses your response by looking for code blocks first"), I should output a JSON tool call wrapped in a code block to write the file.

But mission says "output ONLY the raw upgraded code." Hmm. Actually if I use write_file tool, the content field would contain the raw code. That satisfies both — the automation harness parses the tool call, and the file gets written with raw code.

Let me output a write_file tool call with the upgraded code.

Now let me actually upgrade the file. The file is a Next.js API route for file upload. Let me improve it:

Bugs / issues in current code:

file.type from client is user-controlled and can be spoofed — need magic-byte validation.

formData.get('file') as File — if not a File, this could fail weirdly. Should validate it's a File/Blob.

Filename not sanitized — though only fileId used in path, so ok, but audit logs raw name.

file.arrayBuffer() loads whole file into memory — could be an issue but limited to 10MB.

No content-length pre-check.

Missing filename length validation.

putFile path chat/${fileId} — no extension, means serving relies on content-type.

No Content-Disposition considerations.

Rate limit: fine.

Error handling leaks nothing good.

No request.headers.get('content-length') check before parsing formData.

File name with null bytes / path traversal — not used in path, ok.

Should validate file.name length and strip control chars.

Could add runtime = 'nodejs' export.

Add export const dynamic = 'force-dynamic' or similar.

Audit log should sanitize fileName.

Should pass request to auditLog — it does.

Could set Content-Type from detected mime, not user supplied.

Should limit file count/size of formData.

ALLOWED_TYPES — image/svg+xml excluded (good, XSS risk).

Should normalize mime (some browsers send image/jpg sometimes).

Add streaming for large files? 10MB is fine.

The returned URL uses /api/uploads/chat/${fileId} but stored at chat/${fileId} — route probably handles it.

Let me also add:

magic byte detection to prevent mime spoofing (basic)

filename sanitization

content-length early check

better error messages

constant-time-ish type check

use instanceof File check

Also "improve UI to Liquid Glass" — this is an API route, no UI. So skip UI aspect.

Let me write the improved code.

ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { randomUUID } from 'crypto';
import { putFile } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 255;

const ALLOWED_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
]);

// magic-byte signatures for binary types
const MAGIC_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (webp starts with RIFF)
};

function matchesMagic(buffer: Uint8Array, sigs: number[][]): boolean {
  return sigs.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return cleaned.slice(0, MAX_FILENAME_LENGTH) || 'file';
}

function isFileLike(v: unknown): v is File {
  return typeof v === 'object' && v !== null && typeof (v as File).arrayBuffer === 'function' && typeof (v as File).size === 'number';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const rateLimit = await checkRateLimit(userId, { windowMs: 60_000, maxRequests: 20, keyPrefix: 'upload' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Upload rate limit exceeded' }, { status: 429 });
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large (max 10MB)' }, { status: 413 });
    }

    const formData = await request.formData();
    const candidate = formData.get('file');
    if (!isFileLike(candidate)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const file = candidate;

    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    const declaredType = (file.type || '').toLowerCase();
    if (!ALLOWED_TYPES.has(declaredType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const sigs = MAGIC_SIGNATURES[declaredType];
    if (sigs && !matchesMagic(buffer, sigs)) {
      return NextResponse.json({ error: 'File content does not match declared type' }, { status: 415 });
    }

    const safeName = sanitizeFilename(file.name);
    const fileId = randomUUID();
    await putFile(`chat/${fileId}`, buffer, declaredType);
    const url = `/api/uploads/chat/${fileId}`;

    await auditLog(userId, 'FILE_UPLOAD', 'file', {
      fileName: safeName,
      fileSize: file.size,
      fileType: declaredType,
      fileId,
    }, request);

    return NextResponse.json({
      url,
      fileName: safeName,
      fileSize: file.size,
      fileType: declaredType,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

Wait, I should check — 
matchesMagic
 for webp: RIFF then at offset 8 "WEBP". Just checking RIFF is weak. Let me add proper WEBP check. Actually simpler to just check 
RIFF
 at