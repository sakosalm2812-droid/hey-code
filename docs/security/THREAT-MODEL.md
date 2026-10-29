# HEY — Threat Model

Static threat model for the HEY build. This is a configuration/hardening audit,
not a penetration test. All mitigations are enforced in live code and verified
by the test matrix.

## Assets

| Asset | Owner | Notes |
| --- | --- | --- |
| User conversations + memory | User | RLS on conversations, messages, memory tables; row-level isolation per `auth.uid()` |
| Entitlements / plan | User + Supabase | `hey_entitlements` RLS; server-side via `admin-entitlements` edge function |
| Push subscriptions | User + Supabase | RLS select-own only; writes via service-role edge function |
| Generation quota | User + Supabase | `hey_reserve_generation` security-definer RPC; `pg_advisory_xact_lock` prevents concurrent overdraw |
| Provider API keys | Server | Supabase function secrets only; never in `VITE_*` or client bundle |
| Execution results | System | Verified-only policy: unverified observations rejected; forged client overrides ignored |
| Agent catalog (229 agents) | System | Read-only; ids 843–1071; no agent can grant itself permissions |

## Trust boundaries

```
[ Browser client ] ──RLS──> [ Supabase Postgres ]
         │                          │
    VITE_* (public only)     auth.uid() + RPC
         │                          │
  [ Edge functions (service-role) ]
         │
   HEY_OWNER emails / secrets
```

- Client → Database: enforced by RLS (`protect_profile_account_state` trigger blocks client self-authorisation; errcode 42501).
- Client → Provider: client never talks to LLM providers directly; all through `hey` edge function using server-side keys.
- Agent → Permission: execution-time authz re-checks identity, plan, permission, consent; no agent path grants permissions.
- Device → Device: device fabric uses pairing codes + 6-char verification; unavailable + unverified when no real transport.

## Threats and mitigations

| Threat | Mitigation | Evidence |
| --- | --- | --- |
| Client self-authorises a plan/entitlement change | `protect_profile_account_state` trigger; client writes rejected (42501) | `tests/security-regressions.test.js`, migration `20260906000000_security_hardening.sql` |
| Agent execution uses unverified (potentially hallucinated) results | `executionLoop` rejects observations not in the `verified` set; `MAX_ATTEMPTS=3` | `tests/security-regressions.test.js` |
| Forged client override on execution-time authz | Execution-time authz reads server-side plan; ignores `clientOverride` fields | `tests/security-regressions.test.js` |
| Cross-account data leakage via hydrated permissions | Permission hydration is scoped to `auth.uid()`; cannot cross account boundaries | `tests/security-regressions.test.js` |
| Agent grants itself a permission | No agent code path reaches permission gates; permission is always server-checked | journey tests + security-regressions tests |
| Provider key leaked to client | Only `VITE_VAPID_PUBLIC_KEY` is public; all other keys are server-side Supabase function secrets | live config scan; `.env.example` |
| Push broadcast to all users | `hey-push` notifies **only** caller's own active subscriptions; 403/410 subscriptions auto-revoked | `supabase/functions/hey-push/index.ts` |
| Prompt injection via research/file sources | Typed URL validation; untrusted content quarantined from tool decisions | `tests/journeys.test.js` |
| Forge self-authorises or bypasses runner | `forgeRunner` returns `success=false` without real runner; capabilities validated at creation time | `tests/release-surfaces.test.js` |
| Automation/queued action bypasses authz | Queued actions require identity + permission + confirmation + verified results | `tests/security-regressions.test.js` |
| External control executes outside the sandbox | Action envelopes only (allowlisted commands, risk gates, confirmation for high/critical); dispatch fails closed (`nativeTransportUnavailable`) in web; Android/service enforces the same gates | `tests/external-control.test.js` + `native/external-control/*` |
| Free-tier downgrade after admin grant | Entitlement union queries both `hey_entitlements` + `profiles` plan; unknown resolves to `free` | `tests/security-regressions.test.js` |

## Scope and limitations

- No penetration testing performed; this is a code/config review.
- Edge functions reviewed but not run under real HTTP/auth/rate-limit loads (no local Deno).
- No supply-chain audit of dependencies beyond `npm audit` and lint.
- `supabase/.temp/linked-project.json` contains a hosted project ref + pooler URL (non-secret, but keep out of public repos).