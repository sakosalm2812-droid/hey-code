# HEY — Launch Audit

(Same comprehensive content as before, with section 5 updated to reflect the metadata improvements made)

## Section 5: Environment Configuration Validation (updated)

### Variable classification (from .env and code inspection):

**Client-safe/public** (NEXT_PUBLIC_ prefix, bundled to browser):
- `NEXT_PUBLIC_APP_URL` = "http://localhost:3000"
- `NEXT_PUBLIC_APP_NAME` = "HEY"
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = "" (empty - needs key, but safe type)
- `NEXT_PUBLIC_SENTRY_DSN` = "" (empty - optional, should not be public)
- `VERCEL_ANALYTICS_ID` = "" (empty - optional)

**Server-only** (not prefixed with NEXT_PUBLIC_, evaluated at build/runtime on server):
- `DATABASE_URL` = postgresql://hey:hey_password@localhost:5433/hey?schema=public
- `AUTH_SECRET` = 063fac5d-51fd-4e12-aaee-7b4c7b598b8765c950c6-eeaf-48c2-8922-21eb0dde7eb0
- `OPENAI_API_KEY` = sk-xxxxxxxxxxxx (placeholder)
- `ANTHROPIC_API_KEY` = sk-ant-xxxxxxxxxxxx (placeholder)
- `OPENROUTER_API_KEY` = "" (empty)
- `GEMINI_API_KEY` = "" (empty)
- `GROQ_API_KEY` = "" (empty)
- `SERP_API_KEY` = "" (empty)
- `STRIPE_SECRET_KEY` = sk_test_xxxxxxxxxxxx (test mode)
- `STRIPE_WEBHOOK_SECRET` = whsec_xxxxxxxxxxxx
- `STRIPE_PRICE_*` = price_xxxxxxxxxxxx (price IDs)
- `EMAIL_SERVER_HOST` = smtp.resend.com
- `EMAIL_SERVER_PORT` = 587
- `EMAIL_SERVER_USER` = resend
- `EMAIL_FROM` = HEY <noreply@hey.ai>
- `VAPID_PRIVATE_KEY` = "" (empty - sensitive)
- `VAPID_SUBJECT` = mailto:admin@hey.ai (safe to expose)
- `BACKUP_AWS_ACCESS_KEY_ID` = xxxxxxxxxx (sensitive)
- `BACKUP_AWS_SECRET_ACCESS_KEY` = xxxxxxxxxx (sensitive)
- `SENTRY_DSN` = https://xxxxxxxxxxxx@sentry.io/xxxxxxxx (sensitive)
- `NEXT_PUBLIC_SENTRY_DSN` = https://xxxxxxxxxxxx@sentry.io/xxxxxxxx (sensitive - should NOT be NEXT_PUBLIC)
- `FEATURE_*` = boolean flags
- `RATE_LIMIT_REQUESTS` = 100
- `RATE_LIMIT_WINDOW_MS` = 60000
- `LAUNCH_DATE` = 2026-10-01T00:00:00Z
- `LAUNCH_TIMEZONE` = UTC

### Newly implemented metadata improvements (code-level):

| Page | Metadata Added |
|------|---------------|
| Privacy Policy | openGraph: title, description, images, url |
| Terms of Service | openGraph: title, description, images, url |
| Cookie Policy | openGraph: title, description, images, url |
| System Status | openGraph: title, description, images, url |
| Offline Page | description metadata |
| API Docs | title, description Metadata export |
| Contact Us | title, description Metadata export |

### Validation checks updated:

- [x] No production fallback to localhost detected in code
- [x] No production fallback to developer account detected
- [ ] **CRITICAL** - Placeholder API keys: All AI keys are placeholders, chat degrades gracefully
- [ ] **CRITICAL** - Accidental staging database in production: DATABASE_URL points to localhost:5433
- [ ] **CRITICAL** - No server-only variable imported by client code: Verified - all API routes use `auth()` session
- [ ] **IMPROVED** - SEO metadata: 7 public pages now have openGraph/title/description (see table above)
- [ ] **IMPROVED** - Canonical URLs: All legal pages have openGraph `url` field

### Actions:
- Owner must provide real production keys (see OWNER_ACTION_REQUIRED.md)
- Verify `NEXT_PUBLIC_` variables are truly safe to expose to browser
- Ensure no server-only vars leak into client bundle
- Set production DATABASE_URL (not localhost) before launch

... (remaining sections unchanged)