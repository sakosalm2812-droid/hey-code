import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { auditLog } from '@/lib/audit';
import { chatRateLimiter } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';
import { putFile, deleteFile as deleteStoredFile, deleteUploadedFiles } from '@/lib/storage';
import { extractTextFromFile, extractPdfText, understandImage, analyzeFile, storeFileRecord, listFiles, getFileById, deleteFile } from '@/lib/files';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/xml',
  'text/html',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('q');

    const files = await listFiles(session.user.id, { projectId, search: search ?? undefined });
    return NextResponse.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await chatRateLimiter(`upload:${session.user.id}`);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Upload rate limit exceeded' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = (formData.get('projectId') as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    let text = extractTextFromFile(file.type, buffer);

    if (!text) {
      if (file.type === 'application/pdf') {
        text = await extractPdfText(buffer);
      } else if (file.type.startsWith('image/')) {
        const understood = await understandImage(file.type, buffer, file.name);
        if (understood?.text) {
          text = understood.text;
        }
      }
    }

    const analysis = analyzeFile(text || '', file.name, file.type);
    const fileId = randomUUID();
    const storageKey = `files/${fileId}`;
    await putFile(storageKey, Buffer.from(buffer), file.type);
    const storageUrl = `/api/uploads/${storageKey}`;

    let record;
    try {
      record = await storeFileRecord(session.user.id, {
        name: file.name,
        mimeType: file.type,
        size: file.size,
        storageUrl,
        text: text || undefined,
        summary: analysis.summary,
        keywords: analysis.keywords,
        confidence: analysis.confidence,
        projectId,
      });
    } catch (error) {
      try {
        await deleteStoredFile(storageKey);
      } catch {}
      if (error instanceof Error && error.message === 'Project not found') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw error;
    }

    try {
      await auditLog(session.user.id, 'FILE_UPLOAD', 'file', { fileName: file.name, fileSize: file.size, fileType: file.type, fileId }, request);
    } catch {}

    return NextResponse.json({ file: record }, { status: 201 });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');
    if (!fileId) {
      return NextResponse.json({ error: 'File id is required' }, { status: 400 });
    }

    const existing = await getFileById(session.user.id, fileId);
    if (!existing) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
      await deleteUploadedFiles([existing.storageUrl]);
    } catch {}

    const result = await deleteFile(session.user.id, fileId);

    try {
      await auditLog(session.user.id, 'FILE_DELETE', 'file', { fileName: existing.name }, request);
    } catch {}

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}