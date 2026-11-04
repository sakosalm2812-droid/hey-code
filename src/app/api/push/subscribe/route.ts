[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Agency Specialist.
YOUR SKILL LIBRARY:

PRE

FILE TO UPGRADE: src\app\api\push\subscribe\route.ts
CURRENT CODE:
[{"tool":"write_file","path":"src/app/api/push/subscribe/route.ts","content":"import { NextRequest, NextResponse } from 'next/server';\nimport { auth } from '@/lib/auth';\nimport { savePushSubscription, removePushSubscription } from '@/lib/push';\n\nexport const runtime = 'nodejs';\n\nfunction isRecord(value: unknown): value is Record<string, unknown> {\n  return typeof value === 'object' && value !== null && !Array.isArray(value);\n}\n\nfunction isNonEmptyString(value: unknown): value is string {\n  return typeof value === 'string' && value.trim().length > 0;\n}\n\nfunction isValidHttpsUrl(value: string): boolean {\n  try {\n    return new URL(value).protocol === 'https:';\n  } catch {\n    return false;\n  }\n}\n\nfunction getValidatedEndpoint(value: unknown): string | null {\n  if (!isNonEmptyString(value)) return null;\n  const endpoint = value.trim();\n  return isValidHttpsUrl(endpoint) ? endpoint : null;\n}\n\nfunction getValidatedKeys(value: unknown): { p256dh: string; auth: string } | null {\n  if (!isRecord(value)) return null;\n  const p256dh = value.p256dh;\n  const authKey = value.auth;\n  if (!isNonEmptyString(p256dh) || !isNonEmptyString(authKey)) return null;\n  return { p256dh: p256dh.trim(), auth: authKey.trim() };\n}\n\nfunction unauthorized() {\n  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n}\n\nfunction badRequest(message: string) {\n  return NextResponse.json({ error: message }, { status: 400 });\n}\n\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    if (!session?.user?.id) return unauthorized();\n\n    let body: unknown;\n    try {\n      body = await request.json();\n    } catch {\n      return badRequest('Invalid JSON body');\n    }\n\n    if (!isRecord(body)) return badRequest('Invalid push subscription payload');\n\n    const endpoint = getValidatedEndpoint(body.endpoint);\n    if (!endpoint) return badRequest('A valid HTTPS push subscription endpoint is required');\n\n    const keys = getValidatedKeys(body.keys);\n    if (!keys) return badRequest('Push subscription keys (p256dh and auth) are required');\n\n    const saved = await savePushSubscription(session.user.id, {\n      endpoint,\n      keys,\n      expirationTime: typeof body.expirationTime === 'number' ? body.expirationTime : null,\n      userAgent: request.headers.get('user-agent') ?? undefined,\n    });\n\n    if (!saved) return badRequest('Invalid push subscription (endpoint and keys required)');\n\n    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });\n  } catch (error) {\n    console.error('[push/subscribe] POST failed', error);\n    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 });\n  }\n}\n\nexport async function DELETE(request: NextRequest) {\n  try {\n    const session = await auth();\n    if (!session?.user?.id) return unauthorized();\n\n    const endpoint = getValidatedEndpoint(request.nextUrl.searchParams.get('endpoint'));\n    if (!endpoint) return badRequest('A valid HTTPS endpoint query param is required');\n\n    await removePushSubscription(session.user.id, endpoint);\n    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });\n  } catch (error) {\n    console.error('[push/subscribe] DELETE failed', error);\n    return NextResponse.json({ error: 'Failed to remove push subscription' }, { status: 500 });\n  }\n}\n"}]
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.