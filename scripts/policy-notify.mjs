#!/usr/bin/env node
/**
 * Trigger the policy change-notification job from cron/CI.
 *
 * The /api/admin/policy-notify endpoint is intentionally not self-scheduling
 * (the repo has no knowledge of when legal copy changes). Use this script with
 * any scheduler (Vercel Cron, system cron, GitHub Actions, CI, etc.):
 *
 *   node scripts/policy-notify.mjs \
 *     --title "Updated Privacy Policy" \
 *     --summary "We updated Section 11 with new material." \
 *     --url "/privacy" \
 *     --site "https://hey.ai"
 *
 * Or supply the values as env vars:
 *   POLICY_NOTIFY_TITLE / POLICY_NOTIFY_SUMMARY / POLICY_NOTIFY_URL / POLICY_NOTIFY_SITE
 *
 * Requires ADMIN_TOKEN matching the deployment's environment (sent as
 * X-Admin-Token). Confirms the result (recipients + emailed) and exits non-zero
 * on any failure.
 */
import { env, exit } from 'node:process';

const args = (() => {
  const map = new Map();
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i].startsWith('--')) {
      const key = raw[i].slice(2);
      const next = raw[i + 1];
      map.set(key, next !== undefined && !next.startsWith('--') ? next : 'true');
    }
  }
  return map;
})();

const title = args.get('title') ?? env.POLICY_NOTIFY_TITLE ?? '';
const summary = args.get('summary') ?? env.POLICY_NOTIFY_SUMMARY ?? '';
const url = args.get('url') ?? env.POLICY_NOTIFY_URL ?? '/privacy';
const site = (args.get('site') ?? env.POLICY_NOTIFY_SITE ?? env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const token = env.ADMIN_TOKEN ?? '';

if (!token) {
  console.error('[policy-notify] ADMIN_TOKEN is required (set ADMIN_TOKEN in the script env).');
  exit(1);
}
if (!title || !summary) {
  console.error('[policy-notify] --title and --summary are required.');
  exit(1);
}
if (title.length > 200 || summary.length > 2000 || url.length > 500) {
  console.error('[policy-notify] title (≤200), summary (≤2000), or url (≤500) too long.');
  exit(1);
}

const target = `${site}/api/admin/policy-notify`;

try {
  const res = await fetch(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token,
    },
    body: JSON.stringify({ title, summary, url }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`[policy-notify] ${res.status} ${body?.error ?? res.statusText}`);
    exit(1);
  }
  console.log(
    `[policy-notify] ok: version=${body?.version ?? 'n/a'} recipients=${body?.recipients ?? 0} emailed=${body?.emailed ?? 0}`
  );
  exit(0);
} catch (error) {
  console.error(`[policy-notify] request failed: ${error instanceof Error ? error.message : error}`);
  exit(1);
}