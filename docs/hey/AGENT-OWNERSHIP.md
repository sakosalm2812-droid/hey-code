# HEY — AGENT OWNERSHIP MAP

**Date:** 20 October 2026
**Purpose:** Prevent the same agent being built twice by two parts, or built by neither. Every agent class has exactly one owning part.

---

## 1. What exists today — measured

**229 agents** in `src/lib/agents/data-*.ts` (verified 20 Oct 2026):

| File | Count | Domain |
|---|---|---|
| `data-core.ts` | 48 | Core intelligence, Cosmos/memory, research |
| `data-creative.ts` | 55 | Creative and media |
| `data-dev.ts` | 53 | Engineering |
| `data-knowledge.ts` | 42 | Knowledge and analysis |
| `data-qa-forge.ts` | 31 | QA and Forge |

These are **general specialist roles**. They are not the strategic agents described in the product vision.

## 2. What does NOT exist — measured

Text search across all five registry files for the named strategic agents:

| Named role | Occurrences |
|---|---|
| Flaw Hunter | **0** |
| Solution Twin | **0** |
| Risk Twin | **0** |
| Council / Dissent Guardian / Contrarian | **0** |
| Three Evolution agents (Model / Capability / Agent) | **0** |
| Missing-Requirement Hunter / Opportunity Hunter / Assumption Breaker | **0** |
| Outcome Judge | **0** |
| Teacher / education agents | **0** |
| Verifier | **1** |
| Orchestration | 5 |
| Research | 15 |
| Forge | 11 |

**Conclusion:** the strategic agent layer from the vision — the review, challenge, and evolution agents — is **specification only**. It has never been implemented. Anyone claiming HEY "has" a Flaw Hunter or an Evolution Engine is describing a document, not code.

## 3. Ownership by part

| Agent class | Owning part | Notes |
|---|---|---|
| The 229 specialist registry | **Part 4** | Contract, selection, teams, delegation, health. Read-only registry |
| HEY One coordinator / orchestrator | **Part 2** | Architecture; Part 4 consumes its selection output |
| Mission agents (planner, executor, verifier, recovery) | **Part 4** selects; **Part 2** defines the mission runtime | Split is deliberate: one defines, one chooses |
| Flaw Hunter, Contrarian, Dissent Guardian, Assumption Breaker, Missing-Requirement Hunter, Opportunity Hunter | **Part 5** | The challenge layer |
| Risk Twin and Solution Twin | **Part 5** | The adversarial review pair |
| Three Evolution agents (Model / Capability / Agent) | **Part 5** | Stages 21–23 |
| Research teams (Model Intelligence, Agent Systems, Feature Discovery, Assurance) | **Part 5** | Stage 24 |
| Capability Vault agent governance | **Part 5** | Stage 25 |
| Creation agents (image, video, document) | **Part 8** | Forge and media |
| Voice, vision, gesture agents | **Part 9** | Device interaction |
| Proactive and automation agents | **Part 10** | Scheduling, briefs |
| Education / teacher agents | **Part 12** | HEY for Leaders. **None exist today** |
| Outcome Judge | **Part 5** | Independent verification of task outcome |
| Security review agents | **Part 13** | Alongside the security release gate |

## 4. Rules

1. **A part may not create an agent outside its ownership.** If it thinks one is needed, it records a proposal in the Vault and stops.
2. **A new agent enters through the Vault**, with owner approval — not by being added to `data-*.ts` directly.
3. **Part 4 must not add agents.** It validates, selects, and reports.
4. **Verifier scarcity is a live risk.** Only one verifier agent exists. Part 4 requires the verifier to differ from every executor; with one verifier and a small team, plans will legitimately refuse. That refusal is correct behaviour, not a bug — but it means Part 5 must add independent verification capacity.
5. **"Exists in a document" is not "exists in code."** Every claim about an agent's existence must cite a file and line.

## 5. Open question for the owner

The strategic layer (Flaw Hunter, twins, evolution agents, council) is 0% built. Part 5 can build the mechanics, but two decisions are the owner's:

- Does the review layer operate **inside every mission** (slower, safer), or **only on high-risk missions** (faster, cheaper)?
- Do the three Evolution agents run **on a schedule** (with real cost), or **on demand**?
