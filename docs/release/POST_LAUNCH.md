# POST-LAUNCH OPERATIONS — HEY v0.0.0

**Date:** 2026-09-20  
**Cadence:** Continuous

---

## Monitoring & Observability

| System | Check | Frequency | Tool |
|--------|-------|-----------|------|
| Supabase Edge Functions | Error rate, latency, invocations | 5m | Supabase Dashboard / Logs |
| Supabase Auth | Signup/login success rate | 15m | Supabase Dashboard |
| Web Push (VAPID) | Delivery rate, failures | 1h | Custom / Supabase Realtime |
| Tauri Desktop Crashes | Native crash reports | Daily | Sentry / HockeyApp (if integrated) |
| SPA Bundle Size | `dist/assets/*.js` gzip size | Per release | `npm run build` output |
| Agent Success Rate | Verified executions / total | Hourly | `diagnosticsEngine` health checks |

---

## Incident Response

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| P0 (Data loss, auth down, push broken) | 15 min | Page owner, Supabase status |
| P1 (Agent failures > 5%, chat broken) | 1 hr | Owner + Slack/Discord |
| P2 (UI bugs, non-critical feature) | 4 hr | Next sprint |
| P3 (Cosmetic, docs) | Next release | Backlog |

**Runbooks:** See `src/core/diagnosticsEngine.js` health checks for component-level diagnostics.

---

## Release Process

1. **Patch** (bugfix): `npm version patch` → `git push --tags` → CI builds Tauri artifacts
2. **Minor** (feature): `npm version minor` → CHANGELOG → staged rollout (canary 10% → 100%)
3. **Major** (breaking): Full RFC → migration guide → `npm version major`

**Rollback:** `git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z` → redeploy previous tag. See `HEY-ROLLBACK.md`.

---

## Security Hygiene

- [ ] Rotate Supabase anon key quarterly (keep service role secret server-only)
- [ ] Rotate VAPID keys annually
- [ ] Audit Edge Function secrets monthly
- [ ] Run `npm run secret-scan` pre-merge (CI gate)
- [ ] Dependency audit: `npm audit` monthly, `cargo audit` monthly

---

## Capacity Planning

| Resource | Current | Scaling Trigger |
|----------|---------|-----------------|
| Supabase DB | Free tier (500 MB) | > 400 MB → Pro |
| Edge Function invocations | Free tier (2M/mo) | > 1.5M → Pro |
| Realtime connections | Free tier (200 concurrent) | > 150 → Pro |
| Bandwidth | Free tier (5 GB) | > 4 GB → Pro |
| Tauri desktop users | N/A (self-hosted) | Monitor crash reports |

---

## Feature Flags (Runtime)

Managed via `settingsRegistry` / `featureCatalog`:
- `voice.enabled` — MediaPipe gesture + voice
- `agents.advanced` — Full 229-agent workforce
- `tauri.native` — Desktop-only capabilities
- `push.enabled` — Web Push notifications

Default: conservative (off) for new users; opt-in via Settings.

---

## Backup & Recovery

- **Supabase:** Daily automated backups (Pro), manual `pg_dump` (Free)
- **Edge Functions:** Version-controlled in repo (`supabase/functions/`)
- **Secrets:** Stored in 1Password / Bitwarden, not repo
- **Tauri Signing Certs:** Secure offline backup

---

## User Communication

- **Status Page:** GitHub Issues + Supabase Status
- **Changelog:** `HEY-CHANGES.md` per release
- **Breaking Changes:** 30-day notice via in-app banner + email (if opted in)

---

## Metrics to Track (Post-Launch)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| DAU / MAU | Grow 10% MoM | < 5% WoW |
| Agent task success rate | > 95% | < 90% |
| Chat message latency (p95) | < 800 ms | > 2 s |
| Push delivery rate | > 98% | < 95% |
| Desktop crash-free sessions | > 99.5% | < 99% |
| Build time (CI) | < 10 min | > 15 min |

---

*Review monthly. Update with real data after launch.*