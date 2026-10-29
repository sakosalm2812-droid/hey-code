import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { randomUUID } from 'crypto';
import { putFile } from '@/lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const rateLimit = await checkRateLimit(userId, { windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'upload' });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Upload rate limit exceeded' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const fileId = randomUUID();
    const buffer = await file.arrayBuffer();
    await putFile(`chat/${fileId}`, Buffer.from(buffer), file.type);
    const url = `/api/uploads/chat/${fileId}`;

    await auditLog(userId, 'FILE_UPLOAD', 'file', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    }, request);

    return NextResponse.json({ 
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}