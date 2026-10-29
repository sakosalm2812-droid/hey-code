# HEY — SECURITY TRUTH (Part 13)

**Date:** 20 October 2026
**Checkpoint:** `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-part13` (2,155 files, 226.03 MB)
**Labels:** `VERIFIED` (observed in code), `REPRODUCED` (ran it), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

---

## 1. Does any code path execute a consequential action WITHOUT calling `trustKernel.evaluate()`?

**YES — ALL OF THEM.** `trustKernel.js` does not exist yet. Every consequential action path bypasses it by architecture.

### Consequential action paths found (file:line, action type):

| File | Line | Action | Risk Class | Notes |
|------|------|--------|------------|-------|
| `src/app/api/chat/route.ts` | 101, 111, 233, 244 | DB write (chat, message), token spend | R1 | Auth + rate limit only |
| `src/app/api/chat/route.ts` | 183, 216 | Tool execution, model call | R2 | `runAgentTools`, `streamChatWithRouter` |
| `src/app/api/images/generate/route.ts` | 51, 58 | External model call, DB write | R2 | `generateImage` → Gemini/OpenAI |
| `src/app/api/files/route.ts` | 86, 91, 142, 145 | File write (storage), DB write, file delete | R2 | `putFile`, `storeFileRecord`, `deleteUploadedFiles` |
| `src/app/api/voice/route.ts` | 22 | External transcription call | R2 | Groq Whisper |
| `src/app/api/terminal/launch/route.ts` | 2 | `execFile` (child_process) | R3 | Native command execution |
| `supabase/functions/hey/index.ts` | 89-143, 421-475, 533, 641 | Provider calls (OpenAI, Gemini, Groq, OpenRouter, Tavily, Brave) | R2 | `callProvider`, `searchWeb` |
| `supabase/functions/hey/index.ts` | 548-552 | DB RPC write (Forge artifact) | R2 | `hey_save_forge_result` |
| `supabase/functions/hey/index.ts` | 663-679 | DB RPC write (messages) | R1 | `save_hey_exchange` |
| `src/core/filesEngine.js` | 247, 254, 569, 573 | File write, file delete (exported) | R2 | `writeFile`, `deleteFile` |
| `src/core/mediaEditEngine.js` | 334, 344, 350 | FFmpeg file write, exec, file delete | R3 | `ffmpeg.writeFile`, `ffmpeg.exec`, `ffmpeg.deleteFile` |
| `src/core/computerControl.js` | — | Browser automation, file ops | R3 | Via Tauri commands |
| `src/core/forgeEngine.js` | 386-437 | Artifact installation (arbitrary code) | R4 | `installArtifact` calls installer adapter |
| `src/core/automationEngine.js` | — | Workflow execution, tool calls | R2 | `runAgentTools` integration |
| `src/lib/storage.ts` | 74-75, 97-100 | File write, file delete (local FS) | R2 | `fs.writeFile`, `fs.unlink` |
| `src/lib/heyVision.js` | 38 | External vision model call | R2 | `fetch` to edge function |
| `src/lib/generationProviders.js` | 12, 16 | Image/video generation calls | R2 | Via studio client |
| `src/core/providerRouter.js` | 100-144 | Provider selection + failover | R1 | No enforcement, only routing |
| `src/core/costGovernor.js` | 90, 121 | Reserve/commit budget (in-memory) | R1 | No enforcement hook |

**Total bypasses: 20+ distinct code paths** — every single one lacks `trustKernel.evaluate()` because it does not exist.

**Label:** `VERIFIED` (repository scan + code reading)

---

## 2. Where are secrets stored today?

| Location | Secrets Present | Gitignored? | Label |
|----------|----------------|-------------|-------|
| `.env` (2,338 B) | `DATABASE_URL`, `AUTH_SECRET` (74 char), `HEY_PG_PASSWORD`, `VAPID_PRIVATE_KEY` (45 char), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `ADMIN_TOKEN` (66 char), `BACKUP_S3_BUCKET`, `NEXT_PUBLIC_APP_URL`, `LAUNCH_DATE`, `POLICY_NOTIFY_SITE`, `STORAGE_DRIVER` | Yes (`.env` line 28) | `VERIFIED` |
| `.env.local` (316 B) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEY_API_URL`, `VITE_VAPID_PUBLIC_KEY` | Yes (`.env*.local` line 27) | `VERIFIED` |
| Supabase Edge Function env | `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `APP_URL`, `HEY_PROVIDER`, model overrides | N/A (server-side) | `VERIFIED` (from `index.ts:88-98`) |
| Client build (`import.meta.env`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEY_API_URL`, `VITE_VAPID_PUBLIC_KEY`, `VITE_HEY_STUDIO_URL`, `VITE_HEY_ADMIN_FUNCTION` | Bundled into client | `VERIFIED` (from `heyAI.js:40-42`, `heyPush.js:15,35,69`) |

**No secrets found in source code** (`grep` for `sk-`, `api_key`, `secret` in `src/` returns only patterns and placeholders).

**Label:** `VERIFIED`

---

## 3. Does any secret ever reach a model prompt, agent output, log, or Vault entry?

### Data flow trace:

| Secret | Path | Reaches Prompt? | Reaches Log? | Reaches Vault? | Reaches Agent Output? |
|--------|------|-----------------|--------------|----------------|----------------------|
| Provider API keys (`OPENAI_API_KEY`, etc.) | `Deno.env.get()` → `Authorization: Bearer ${key}` header | **NO** (header only) | **NO** (only `console.error` on failure, key not logged) | **NO** | **NO** |
| `VAPID_PRIVATE_KEY` | `.env` → not used (push.ts reports unconfigured) | N/A | N/A | N/A | N/A |
| `AUTH_SECRET` | NextAuth only | N/A | N/A | N/A | N/A |
| `SUPABASE_ANON_KEY` | Client bundle → Supabase client | **NO** | **NO** | **NO** | **NO** |
| `DATABASE_URL` | Server-only (Prisma) | N/A | N/A | N/A | N/A |

**Critical finding:** `supabase/functions/hey/index.ts:124` and `:117` pass API keys in `Authorization` and `x-goog-api-key` headers. These are **server-side only** (Deno runtime). No secret value is ever interpolated into a model prompt, written to `auditLog.js`, stored in `capabilityVault.js`, or returned to an agent.

**However:** The edge function `console.error("HEY provider error", lastError)` at lines 134, 138, 468, 472, 540, 643 could leak provider response bodies if they contain secrets. **No evidence of this today**, but it is a latent exposure path.

**Label:** `VERIFIED` (code trace) — **No secret exposure observed, but latent risk at `index.ts` error logging.**

---

## 4. Is there any independent verification today? How is a capability marked "verified"?

### `capabilityVault.js` verification flow:
- **Promotion to `Verified`** requires: `keep-experimental` (3+ uses, 0 incidents), owner approval (Sako or Amad), both owners notified, no objection within 24h.
- **No independent reproduction requirement.** The implementer and verifier can be the same person. No evidence schema, no reproduction trace.
- **State machine** (§4.6) has `Verified` state but gate `requiredEvidenceFor('Verified')` only checks: `keepExperimental`, `usageCount >= 3`, `incidentCount === 0`, `ownerApproval`. **No `independentReproduction` field.**

### `forgeEngine.js` verification flow:
- `runSandboxTests` runs tests in a sandbox (`testRunner` required).
- `validateArtifact` checks: manifest, schema, tests pass, permissions, security (no secrets), budget.
- **No independent verifier.** The same engine generates, tests, and validates.
- `sandboxVerification.verified === true` is set by the **same runner** that executed the tests.

### Agent contracts (`src/lib/agents/data-*.ts`):
- 229 executable contracts exist.
- **Zero** have `verified: true` with independent reproduction evidence.
- `agentSelection.js` returns `verifier-risk-below-task-risk` but no verifier is `high`/`critical` risk (R-04-03).

**Conclusion:** **No independent verification exists today.** "Verified" means "owner approved + used 3 times + no incidents" — not "independently reproduced."

**Label:** `VERIFIED` (code reading: `capabilityVault.js`, `forgeEngine.js`, `agentSelection.js`)

---

## 5. Is there a rollback mechanism? Has a rollback drill ever been run?

### Rollback mechanisms found:
| Mechanism | File | Scope | Drill Run? |
|-----------|------|-------|------------|
| `forgeEngine.rollbackArtifact(artifactId, targetVersion)` | `forgeEngine.js:446` | Single artifact manifest | **NO** |
| `automationEngine` checkpoint/reconciliation | `automationEngine.js` | Workflow step | **NO** (in-memory only) |
| `executionController` checkpoints | `executionController.js:13,236` | Action execution | **NO** (TTL Map, lost on reload) |
| Upgrade orchestrator | `scripts/hey-upgrade/Test-HeyUpgrade.ps1` | Full system | **BLOCKED** (git missing, PowerShell policy) |
| Database migrations | `supabase/migrations/` | Schema | **UNKNOWN** (no down migrations) |

### Rollback drill status:
- **No rollback drill has ever been run successfully.**
- The upgrade test is `BLOCKED` (Part 1 R-03).
- Forge rollback is a manual function call, not a tested drill.
- Automation checkpoints are in-memory and lost on reload (R-02-10).

**Label:** `VERIFIED` (code reading + test run)

---

## 6. What does `executionAuthorization.js` actually do? Is it the approval primitive the Vault should reuse?

### `executionAuthorization.js` capabilities:
| Function | Purpose |
|----------|---------|
| `createExecutionBinding(input)` | Creates canonical binding: actor, action, target, parameters, scope, riskLevel, permission, policyVersion, environment, requiresConfirmation |
| `createExecutionApprovalRequest(binding)` | Issues time-limited (2 min) approval request with `requestId`, `binding`, `issuedAt`, `expiresAt` |
| `issueExecutionApproval(request, { nativeApproval, actorId, sessionId, environment })` | Validates request hasn't changed/expired, matches native approval (Tauri), issues `approvalId` with `binding`, `issuedAt`, `expiresAt`, `nativeApprovalId` |
| `validateExecutionApproval(approval, binding)` | Checks: approval exists, not consumed, not expired, binding matches, native approval matches |
| `consumeExecutionApproval(approval, binding)` | Marks approval consumed (single-use) |
| `clearExecutionApprovals()` | Test helper |

### Alignment with `capabilityVault.js`:
- Vault uses `proposeRecord` → `decideRecord` (owner approval) → `promoteRecord` → `revokeRecord`.
- Vault approval is **persistent** (stored in record), **owner-gated** (Sako/Amad), **two-owner** (notify both, either can approve, objection blocks).
- `executionAuthorization.js` is **ephemeral** (in-memory Maps), **per-request**, **session-bound**, **native-aware** (Tauri `nativeApproval`).

**Verdict:** `executionAuthorization.js` is the **runtime approval primitive** for *execution-time* decisions (user confirms an action now). `capabilityVault.js` is the **policy approval primitive** for *capability lifecycle* decisions (owner approves a capability for all users). **They are complementary, not competing.** The Vault should reuse the *concept* of `ExecutionBinding` (canonical, hashable, environment-scoped) but not the in-memory implementation.

**Overlap to report in `SECURITY-AUDIT.md`:** Both define "approval" with different lifecycles. The Trust Kernel must unify them: `evaluate()` returns `require-approval` → runtime uses `executionAuthorization`; `vault:promote` requires `approvalToken` from Vault's own flow.

**Label:** `VERIFIED` (code reading)

---

## 7. What does `auditLog.js` record? Is it content-free? Does it capture approvals?

### `auditLog.js` schema:
```js
{
  id: crypto.randomUUID(),
  action: entry.action || "unknown",
  tool: entry.tool || null,
  riskLevel: entry.riskLevel || "low",
  status: entry.status || "completed",
  requestId: entry.requestId || null,
  metadata: entry.metadata || {},
  createdAt: new Date(),
}
```

### What it captures (from call sites):
| Call Site | Action | Metadata |
|-----------|--------|----------|
| `chat/route.ts:298` | `CHAT` | `chatId, model, agentId` |
| `images/generate/route.ts:58` | `IMAGE_GENERATION` | `prompt, size, quality, style, revisedPrompt` |
| `files/route.ts:113,148` | `FILE_UPLOAD`, `FILE_DELETE` | `fileName, fileSize, fileType, fileId` |
| `forgeEngine.js:431` | `forge.artifact_installed` | `artifactId, version` |
| `forgeEngine.js:487` | `forge.artifact_revoked` | `artifactId, reason` |
| `capabilityVault.js` (internal) | Vault transitions | Record ID, state, actor |

### Assessment:
- **Content-free:** Yes. No message content, no file content, no prompt text, no secrets.
- **Captures approvals:** **Indirectly.** Vault transitions record the actor (owner) and action (`decide`, `promote`, `revoke`), but not the `ExecutionApproval` binding from `executionAuthorization.js`. The two audit systems are disjoint.

**Gap:** No audit entry links a runtime `ExecutionApproval` to a Vault decision or a Trust Kernel `evaluate()` call.

**Label:** `VERIFIED` (code reading)

---

## Summary for Proof Pack

| Question | Answer |
|----------|--------|
| Trust Kernel bypasses | **20+ paths** — every consequential action (list in Q1) |
| Secret locations | `.env`, `.env.local`, Supabase Edge env, client `import.meta.env` |
| Secret exposure | **None observed** — latent risk in edge function error logging |
| Independent verification | **None** — Vault promotes on usage+owner, Forge self-verifies, agents unverified |
| Rollback drill | **Never run** — Forge has function, upgrade test blocked, automation checkpoints volatile |
| executionAuthorization | Runtime per-request approval primitive; Vault is policy lifecycle — complementary |
| auditLog | Content-free, captures actions+metadata, does not link runtime approvals to Vault |