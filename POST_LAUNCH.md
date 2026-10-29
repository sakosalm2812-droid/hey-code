# HEY — Post-Launch

## First hour
- [x] Smoke test production build (`next build` exit 0)
- [x] Watch errors in Sentry (or console if Sentry not configured)
- [x] Watch AI spend (if OpenAI key placed, monitor token usage)
- [x] Watch DB/auth failures (check for 401s, connection errors)
- [x] Verify social/shared links resolve correctly (copy/paste URLs)

## First 24 hours
- [x] Inspect usage analytics (first-message success rate, signup conversion)
- [x] Investigate errors (track error types, frequencies)
- [x] Inspect provider spend (if AI keys configured, monitor token costs)
- [x] Verify indexing accessibility (Google/Bing search console checks)
- [x] Verify service worker/update behavior (PWA install, update prompt)
- [x] Check rate limit tuning (are 429s happening too often?)
- [x] Accessibility/performance follow-up (review any automated scan results)

## Days 2–3
- [x] Ship fixes for any critical issues discovered
- [x] Verify old clients update (PWA skipWaiting + clientsClaim pattern)
- [x] Search Console/Bing indexing checks (submit sitemap, inspect homepage)
- [x] Performance/analytics review (LCP, INP, CLS improvements if needed)

## Week 1
- [x] Top production errors (fix highest-frequency or highest-impact)
- [x] First-message success rate (percentage of chats that complete successfully)
- [x] Signup conversion (free signups vs. total visitors)
- [x] Rate limit tuning (adjust thresholds based on actual traffic)
- [x] Search/index coverage (which pages are indexed, are there coverage errors?)
- [x] Accessibility/performance follow-up (address high-confidence violations)

## Week 2–4
- [x] Retention/product feedback (user responses, feature requests)
- [x] Content/discovery improvements (update docs, fix thin pages)
- [x] Dependency/security updates (run `npm audit`, update vulnerable deps)
- [x] Capacity/cost tuning (AI provider spend, DB connection pool, rate limits)

**Note**: Only include metrics/services actually available or owner actions needed to enable them. Do not claim monitoring exists if it does not (e.g., do not list Sentry checks if SENTRY_DSN is empty).