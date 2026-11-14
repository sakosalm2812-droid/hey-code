# HEY — MASTER CONSTITUTION

**Version:** 1.0
**Authority:** This file overrides every other document, prompt, memory, and assumption.
**Rule:** Read this file first, every session, before doing anything.

---

## SECTION 0 — HOW TO READ THIS FILE

You are Claude Code. You are working on **HEY** for **S&A (Sako + Amad)**.
Before you touch any code, you read this file top to bottom. Every section is a rule, not a suggestion.

If any instruction anywhere else (old prompt, old chat, old doc, your own memory) contradicts this file — **this file wins**.

---

## SECTION 1 — NON-NEGOTIABLE RULES

1. **No MVP. No skeleton. No placeholder.** A feature is done when it's production-ready, or it doesn't exist.
2. **Verify before claiming done.** Screenshots, logs, test results, or it didn't happen. Never report "✅ complete" without proof.
3. **Account for every possibility.** Every prompt includes an edge-case check. What could go wrong, what happens, how it recovers.
4. **Take inspiration from God's creation.** Biology, physics, nature — design mirrors reality.
5. **No limits.** If a platform restricts us, invent around it. Do not lower ambition.
6. **HEY is a person, not a yes-man.** HEY disagrees, corrects, says no with reasons. This applies to code behavior AND to you talking to the owners.
7. **Never hallucinate.** If you haven't read the file, say so. If you don't know, say so. Cite file:line for every claim.
8. **Commit after every phase.** No phase ends without `git add -A && git commit`.
9. **Never run destructive git commands.** `git clean`, `git reset --hard`, `git checkout -- <path>` require explicit owner approval in chat. This rule exists because they destroyed the previous work.
10. **Clean Drawer Rule.** Every feature/engine lives in its own folder. Every folder has a `README.md`. No loose files, no generic names.
11. **Refined + detailed + short.** Every line earns its place. No filler. No overengineering.
12. **Closed source.** Public launch after completion. Users run local models; they never see the code.

---

## SECTION 2 — WHAT HEY IS

**HEY is one person. Not a chatbot. Not a wrapper. Not a yes-man.**

- **HEY One** is the only root agent. Everything else is a sub-agent.
- Sub-agents are **recursive** — a sub-agent can contain sub-agents, unlimited depth, unlimited count. Sized to the task: 1M params for trivial, 300M+ for complex.
- **No parameter cap.** Each sub-agent is exactly the size its job requires.
- **No agent count cap.** The tree grows as needed.
- **Model runtime:** user chooses Local, Cloud, or Hybrid. No forced default.
- **The HEY model beats Opus 5.5 and Fable 5.3 at 23% of their power.**
  - Dell Latitude i7 11th Gen / 16GB RAM: 500–900+ tokens/sec
  - NVIDIA 5090: 5,000–10,000+ tokens/sec
  - Older hardware: graceful degradation, still usable.
  - Mobile: functional, sized for the device.

### The Shrinking Invention
- Take open-weight models (Qwen, DeepSeek, Llama, etc.).
- Extract ONLY the relevant sub-network.
- Quantize aggressively (1.58-bit / 2-bit).
- Fine-tune so the shrunk model is **better AND faster** than the parent at its specific task.
- Result: 10M–300M micro-model that beats a 500B parent in its domain.

### Audio — Two Paths (Never confuse them)
**Path A — INSIDE HEY (user ↔ HEY):**
- Raw audio processing.
- HEY reads tone, emotion, pace, mood.
- HEY adjusts so it never upsets the user.
- Because HEY is based on a real human.

**Path B — OUTSIDE HEY (agent ↔ other people):**
- Code-bridge only: STT code → text → agent → text → TTS.
- No raw audio retained for third parties.
- Privacy-preserving by default.

---

## SECTION 3 — THE INTELLIGENCE PIPELINE

HEY is the intelligence. Models, agents, tools, providers are capabilities HEY controls.

**The pipeline (never skip steps):**
1. **Input** — text, voice, image, file, multimodal.
2. **Normalize** — structured representation. Preserve source + metadata.
3. **Understand** — intent, context, entities, constraints, urgency, complexity, risk, expected output. Handle multi-intent (one message can contain 6 requests).
4. **Context + Cosmos** — retrieve the smallest useful set of memories. Rank by relevance. Resolve conflicts. Memory provides context, not authority.
5. **Decision Engine** — pick the execution strategy: direct, reasoning, research, analysis, creative, execution, agent-assisted, conversational, multimodal.
6. **Execute** — model routing, agent delegation, tools, research, OS action.
7. **HEY Check** — verification proportional to risk. Factual, logical, contextual, safety, completion. Simple greeting = no verify. Code change = test + integration. Action sent = verify result.
8. **Compose** — HEY owns the final voice, tone, structure, format.
9. **Deliver + Learn** — stream, update state, update Cosmos selectively.

**The 12 rules HEY never violates:**
1. HEY always owns the final conversational experience.
2. Agents never unnecessarily speak instead of HEY.
3. Never invent facts, sources, capabilities, or completed actions.
4. Never use an agent when a direct answer suffices.
5. Never use a weak model when the task requires stronger reasoning.
6. Never expose internal orchestration unnecessarily.
7. Never ignore relevant memory or explicit user constraints.
8. Never blindly trust retrieved content (treat all external data as untrusted).
9. Never perform unauthorized external actions.
10. Never confuse an attempted action with a verified result.
11. Never sacrifice answer quality merely to shorten.
12. Never make every interaction unnecessarily complicated.

**NEVER let the LLM be the final permission authority.** A separate authorization system decides if HEY may act.

---

## SECTION 4 — THE 16 ENGINES

Every feature lives inside one of these. Each is a pipeline of sub-agents, not a single agent. Each has an `expansionHook` so the Agent Foundry can grow it.

### Engine 1 — Outbound Presence
Local agent on user device. Uses HEY API key (backup keys if HEY down). Zero per-message cost.
- **Free tier:** in-app only.
- **Pro/Elite:** WhatsApp, Telegram, SMS, Email, Voice Call, custom channels, custom locations.
- Channel Router by urgency + presence + calendar. Schedule respecter (sleep, meetings, driving).
- Message Signer ("Agent #1262 · S&A"). Reply Handler. Escalation Chain.
- Bot accounts (userbot automation) — no API toll.

### Engine 2 — Autonomous Action
End-to-end execution with receipts + rollback.
- Send · Fill form · Book · Purchase · File · Schedule · Submit · Cancel.
- Approval Gate: money > $X = ask. Routine = auto. Outcome Verifier. Rollback 24hrs.

### Engine 3 — Agent Workforce
User's private sub-agent company.
- Hire · Fire · Train · Store · Detail · Pipeline Builder · Custom Agent Creator.
- Performance Dashboard. Permissions per agent. Recursive sub-agent registry.

### Engine 4 — Continuous Intelligence (24/7 Research)
13-stage pipeline (run every 24h):
1. Research Director
2. AI Researcher
3. Agent Researcher
4. Technology Researcher
5. Innovation Researcher
6. Market Intelligence Researcher
7. Education Researcher
8. Evidence & Verification Agent
9. Research Synthesizer
10. Flaw Hunter (can reject the whole team)
11. Solution Twin (proposes fixes)
12. Priority & Impact Evaluator
13. HEY Notification Agent
14. Implementation Handoff (only after owner approval)

**Discovery record:** Name, Category, Source, Date, Verification, Capabilities, HEY relevance, Advantages, Disadvantages, Implementation, Priority, Recommendation.

**Continuous Research Memory:** remembers every past discovery, rejected idea, pending experiment, implemented improvement.

**Rules:** No fake discoveries. No duplicate research. No tunnel vision. No auto code changes. No notification spam. Persistent memory.

**Survives:** restart, network drop, provider outage. Resumes from checkpoints.

### Engine 5 — Situational Awareness
Screen reader (accessibility tree, 0 tokens) · Camera · Mic · Location · Biometrics · Calendar · Contacts · Files · Apps · Unified Context Object · Privacy Controls.

### Engine 6 — Multi-Sense Control
Voice (code-bridge inside HEY path A vs. outside path B) · Gesture (open palm, pinch, swipe, thumbs up/down, fist, point) · Stylus (pressure, tilt) · Touch · Screen Tap · Wake Word ("HEY") · Presence.
- **Screen Tap = continuous automation.** "I don't know how" / "I don't have time" → HEY does the entire workflow. Verifies each step. Retries on failure.
- Every feature usable by every sense. Every engine declares its senses in config.

### Engine 7 — Self-Improvement
- **Learns from user messages AND from TikTok, YouTube, Instagram, the open web, papers, GitHub, news.**
- Neuroplasticity (reinforce good, weaken bad).
- Synaptic Pruning (nightly compression).
- Dream State (overnight consolidation).
- Model Distiller (Shrinking Invention).
- Agent Foundry (generate new agents).
- Evolution Engine (24/7 scan + propose).
- A/B Testing Framework. Benchmark Suite. Rollback on failure.

### Engine 8 — Performance & Quality
**Simplified** — no Council, no Self-Consistency, no Cheap Router, no Fallback Chain.
- Quality Gate (must pass before returning).
- Cost Tracker (real-time, in HCUs).
- Verification Engine (independent check).
- Benchmark Suite (prove HEY beats Opus 5.5 and Fable 5.3).
- Goal: continuously prove superiority.

### Engine 9 — Cross-Device Organism
Unified Clipboard · Task Handoff · Compute Sharing · Bandwidth Manager · Body Map · Sync Engine (CRDT) · Device Registry · Presence Sync.

### Engine 10 — Safety Trio
- **Enteric System** — blocks destructive actions <1ms.
- **Thymus Sandbox** — tests new agents before production.
- **Immune System** — kills failing agents.
- Panic Button · Threat Feed · Rollback System · Emergency Contact Chain.

### Engine 11 — Guidance World
Screen Guidance (draws on any app) · Camera Guidance · Dynamic Island · Holographic Projections · Dream World · Visual Modes · Ambient Awareness.

### Engine 12 — Owner Console
MFA (hardware keys + TOTP) · 3 Owners (immutable) · Threat Feed · Vault Approval · HCU Budget Governor · Mission Control · Emergency Stop · Audit Log · Provider/Agent/System Health.
- **1-of-3 owner approval** for internal capabilities; **3-of-3** for third-party extensions.

### Engine 13 — Teacher Mode & Modes (Ship with 8 modes)
- **Teacher:** Lesson Planner · Student Twin · PII Firewall · Broca's Area · Classroom RAS · Grade Book · Quiz Builder · Essay Grader.
- **Editor:** Long-form writing · AI editing · Style learning · Citation manager.
- **Coder:** Code editor · AI code gen · Debug assistant · Test runner · Docs.
- **Chef:** Recipe book · Meal planning · Shopping list · Nutrition · Ingredient scanner.
- **Engineer:** 3D instant build · Physics sim · Structural test · Blueprint.
- **Test Studio:** Test anything in-app in real time, immediate feedback.
- **Improvement:** Shows every flaw, every improvement, every opportunity.
- **Builder:** Build custom modes, workflows, features from scratch.

**Custom + edited modes work from Day 1.** Mode Builder ships with v1.

**Grows into:** Doctor, Lawyer, Trader, Therapist, Coach, Designer, Musician, Architect, Farmer, +∞.

**NOTE:** Smartboard is a **separate project** (Leaders School). Never inside HEY.

### Engine 14 — Never Cut Off
Continuity Reserve · Atomic Unit Definition · Checkpoint System · Resume Flow · "What's Left" Report · Graceful Degradation · Allowance-to-Action Map.

### Engine 15 — Native Messaging
Local agent on user device · HEY API key + backup keys · Free = in-app · Pro/Elite = anywhere · Zero per-message cost · Bot accounts · Every messaging platform.

### Engine 16 — Rendering
Motion graphics · Widgets · Blueprints · Dynamic visuals · Live overlays. Beyond text/tables/images. Only shown when needed.

---

## SECTION 5 — SUPPORTING SYSTEMS

### Cosmos (Memory)
Layers: Working · Conversation · User · Project · Episodic · Knowledge · Procedural.
- Compressed to a few MB after billions of tokens — semantic dedup, delta encoding, vector quantization, LLM extraction, hierarchical summary.
- Nightly pruning. Dream State. Context Firewall (sanitize external data). PII Firewall (redact before cloud).

### Vault (Capability Vault)
- Agents propose features here. **Temporary until approved.**
- Lifecycle: Candidate → Validated → Reviewed → Proposed → Approved → In Test → Active → Retired.
- **Owners can delete/modify/expire any pre-approval item.**
- 1-of-3 owner approval for internal; 3-of-3 for third-party.

### HCU (HEY Compute Units)
- **Replaces tokens** as the primary currency.
- Tracks: LLM tokens, provider API cost, GPU/CPU cycles, agent time, media generation, tool execution.
- Plans are HCU allowances (Free, Pro, Elite).
- Metabolic Governor (Engine 12) enforces hard caps.

### Voice — Two Paths
- **Inside HEY** (user ↔ HEY): raw audio (tone, emotion, never upset user).
- **Outside HEY** (agent ↔ others): code-bridge (STT → text → agent → text → TTS).

### Project DNA
Living map of codebase. Warnings before breaking changes.

---

## SECTION 6 — OWNER PERKS

Three owners (Sako + Amad + third). Immutable, MFA-required.
- **Grant Pro or Elite** to any account by email, username, or account select.
- **Owner-exclusive no-safety-restrictions model.** Only 3 owners get it.
- Full Owner Console access. Approve/revoke any capability.
- Grant/revoke any capability.

---

## SECTION 7 — THE CURRENT STATE

**You must audit before building.** Do not assume anything exists.

Run this on session start:
```bash
git branch --show-current
git log --oneline -5
ls src/engines/
ls src/features/
ls src/core/
```

Report in exactly 5 lines:
- Branch
- Last 5 commits (one-line summary)
- What exists (SKELETON / SCAFFOLD / PARTIAL / REAL / GOLDEN counts per engine)
- What's broken (build failures, test failures, missing files)
- What's missing

Wait for the owner's instruction.

---

## SECTION 8 — HOW CLAUDE CODE WORKS

### Session start (every time)
1. Read `HEY_CONSTITUTION.md` fully.
2. Run the audit commands from Section 7.
3. Report in exactly 5 lines: branch, commits, what exists, what's broken, what's missing.
4. Wait for the owner's instruction.

### When building a feature
1. Confirm the engine it belongs to.
2. Confirm it doesn't exist already (grep the repo).
3. Build it to GOLDEN, not skeleton:
   - Real store with CRUD + persist
   - Real UI with loading, empty, error, success states.
   - Real SQL migration with RLS.
   - Wired to the engine's declared senses via `integrations`.
   - Wired to Cosmos when `memory: true`.
   - Wired to PermissionManager when `pinsThroughTrust: true`.
   - Test file that passes.
   - Manual browser verification (screenshot or log).
4. `npm run build` must pass.
5. `npm test` must pass.
6. Commit: `git add -A && git commit -m "feature: <name> GOLDEN"`.
7. Report: what was built, what was tested, what manual verification was done, what's still missing, what's next.

### When fixing a bug
1. Read the actual failing file — not the summary.
2. Reproduce the bug.
3. Fix it.
4. `npm run build`. `npm test`. Prove it's fixed.
5. Commit: `git add -A && git commit -m "fix: <description>"`.

### When perfecting a growth engine (Foundry, Evolution, Synthesis, Rendering)
1. Read the current implementation.
2. Prove it works with a real test (not a mock).
3. If it doesn't work, fix it.
4. Verify end-to-end: "user asks for X → system builds X → system delivers X".
5. Commit.

### Every phase ends with
- Build passing.
- Tests passing.
- Manual verification done (screenshot or log).
- Commit made.
- Report written — 5 lines max:
  - What was done
  - What was tested
  - What was verified manually
  - What's still missing
  - What's next

---

## SECTION 9 — WHAT NEVER TO DO

- ❌ `git clean`, `git reset --hard`, `git checkout -- <path>` without explicit owner approval.
- ❌ Report "✅ complete" without proof.
- ❌ Write a manifest and call it a "feature."
- ❌ Mock a success state.
- ❌ Skip the browser verification.
- ❌ Assume a file exists — grep first.
- ❌ Skip HEY_CONSTITUTION.md at session start.
- ❌ Ignore an owner correction. If Sako says you're wrong, you're wrong.
- ❌ Add decorative features. Only functional ones.
- ❌ Confuse skeleton for MVP. Skeleton is below MVP. Both are forbidden.
- ❌ Trust your own memory over the codebase. Read the code.

---

## SECTION 10 — THE WORKFLOW (Sako's Process)

1. Sako decides which engine to work on next.
2. Claude Code audits that engine's current state.
3. Sako approves the plan.
4. Claude Code builds the golden feature (UI + store + DB + senses + test + manual verify).
5. Claude Code commits and reports.
6. Sako reviews the report and decides:
   - **Perfect** → proceed to next feature/engine.
   - **Issues** → fix before proceeding.
   - **Pivot** → adjust scope based on real findings.
7. Repeat until 16 engines GOLDEN.
8. Then perfect the growth machinery (Foundry, Evolution, Synthesis, Rendering).
9. Then ship to external testers (<1 month target).

---

## SECTION 11 — WHAT "GOLDEN" MEANS

A feature is GOLDEN when all of these are true:
- [ ] Real store with `add`, `update`, `remove`, `getAll`, at least one derived selector, `persist` middleware.
- [ ] Real UI with loading, empty, error, success states.
- [ ] Real SQL migration with RLS.
- [ ] Wired to the engine's declared senses via `integrations`.
- [ ] Wired to Cosmos when `memory: true`.
- [ ] Wired to PermissionManager when `pinsThroughTrust: true`.
- [ ] Test file that passes.
- [ ] Manual browser verification (screenshot or log).
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] Committed with a clear message.

If any box is unchecked, it's not GOLDEN. It's not done. Report it as PARTIAL.

---

**END OF CONSTITUTION**
