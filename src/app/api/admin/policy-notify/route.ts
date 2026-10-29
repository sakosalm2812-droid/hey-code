import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { notifyPolicyChange } from '@/lib/policy';

export const dynamic = 'force-dynamic';

const MAX_TITLE = 200;
const MAX_SUMMARY = 2000;
const MAX_URL = 500;

export async function POST(request: NextRequest) {
  let admin = false;
  try {
    const session = await auth();
    admin = session?.user?.role === 'ADMIN';
  } catch {}

  const providedToken = request.headers.get('x-admin-token');
  const envToken = process.env.ADMIN_TOKEN;
  if (!admin && (!envToken || !providedToken || providedToken !== envToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await checkRateLimit('policy-notify', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'admin-policy-notify',
  });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? '').trim();
  const summary = String(body?.summary ?? '').trim();
  const url = String(body?.url ?? '/privacy').trim();

  if (!title || !summary) {
    return NextResponse.json({ error: 'title and summary are required' }, { status: 400 });
  }
  if (title.length > MAX_TITLE || summary.length > MAX_SUMMARY || url.length > MAX_URL) {
    return NextResponse.json({ error: 'Fields too long' }, { status: 400 });
  }

  try {
    const result = await notifyPolicyChange({ title, summary, url });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Policy notify error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}