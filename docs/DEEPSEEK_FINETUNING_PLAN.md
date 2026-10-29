# HEY — DeepSeek Fine-Tuning Plan (Documentation Only)

**Status: PLAN ONLY — NO TRAINING AUTHORIZED**

This document defines the plan for fine-tuning DeepSeek V4.1 Flash into a HEY-owned model.
**No training job, no GPU spend, no data upload, no model weight modification is authorized
by this document.** Execution requires explicit user authorization, rights-cleared data,
controlled compute, and budget approval.

---

## 1. Model Selection (Verified from Official Sources, 17 Oct 2026)

| Fact | Value | Source |
|------|-------|--------|
| API model name | `deepseek-flash` | DeepSeek API docs |
| Full model name | DeepSeek-V4.1-Flash-1017 | DeepSeek release page (17 Oct 2026) |
| Open-weight release | MIT licensed | Hugging Face: deepseek-ai/DeepSeek-V4.1-Flash |
| Architecture | Causal Encoder–Decoder | DeepSeek technical report |
| Backbone parameters | 552B | DeepSeek technical report |
| Active parameters | 8B (input) / 16B (output) | DeepSeek technical report |
| Repository total | 763B | Hugging Face model repository |
| Context window | 1M tokens | DeepSeek API docs |
| API inference edits weights? | **No** | DeepSeek API is inference-only |

> **Important:** The 763B total / 552B backbone discrepancy means you cannot size
> hardware from active parameter count alone. You must inspect exact checkpoint files
> before estimating training hardware.

---

## 2. Two Separate Paths (Must Not Be Confused)

### Path A: API Inference (Cloud Mode) — NO FINE-TUNING
- Call `deepseek-flash` via DeepSeek API
- **Does NOT edit model weights**
- Requires `DEEPSEEK_API_KEY` in `.env`
- Potential per-token cost — not authorized yet
- Use for: chat responses, copilot, reasoning

### Path B: HEY-Controlled Fine-Tuning — LOCAL, $0
- Download open-weight checkpoint from Hugging Face (MIT license)
- Fine-tune locally using PEFT/LoRA/QLoRA adapter
- **No cloud spend, no GPU rental, no API training**
- Requires: user-provided training data, local compute, explicit authorization
- Result: `base_hash + adapter_hash + tokenizer + runtime version` = HEY's own model

---

## 3. Fine-Tuning Workflow (9 Steps)

### Step 1: Select One Measurable Failure
Pick ONE repeated, measurable failure in a role. Examples:
- Task planning (wrong step order)
- Structured output (malformed JSON)
- Tool selection (picks wrong tool)
- Kurdish/Arabic instructions (poor quality)
- Truthful partial-status reporting (claims success when failed)

**Do NOT fine-tune for:** missing live knowledge, permissions, deterministic execution,
or information better served by retrieval/tools.

### Step 2: Define Acceptance Criteria Before Collecting Data
For the chosen failure:
- Human group and use case (e.g., "teachers in Kurdistan planning lessons")
- Role contract (what the model must do)
- Baseline model/prompt/tools
- Acceptance suite (tests that must pass)
- Prohibited behavior (what the model must NOT do)
- Privacy class (no student data, no PII)
- Cost/performance target (latency, cost per request)
- **Freeze a held-out evaluation set BEFORE collecting training examples**

### Step 3: Review Checkpoint & License (Local, $0)
- Download DeepSeek-V4.1-Flash open weights from Hugging Face (MIT license)
- Verify checkpoint files, architecture support, tokenizer, conversation encoding
- Record exact revision hashes
- Check inference/training runtime support
- **Do not size hardware from active parameter count alone**

### Step 4: Build Training Dataset (User-Provided Data Only)
- Smallest rights-cleared, consented, minimized dataset
- **Remove all secrets and personal identifiers**
- **Never include students/pupils or private account histories without valid consent**
- Preserve source IDs, consent/license, transformation lineage, deletion path
- Split by project/person/time to prevent leakage
- Include: negative cases, adversarial cases, language cases, accessibility cases,
  permission denials, cancellations, failed/partial outcomes, correct uncertainty
- Deterministic validators check: schemas, duplicates, PII, leakage, forbidden actions,
  source permissions

### Step 5: Human Review & Approval
- Human review approves the training manifest
- **No model can approve its own dataset or spending**
- Document what is being fine-tuned and why

### Step 6: Establish Baseline Results (Before Tuning)
Measure:
- No model (prompt-only)
- Retrieval/tool route
- Model route (current DeepSeek API or local model)
- End-task success, tool correctness, truthfulness, permission boundary, hallucinated
  completion, regression rate, latency, throughput, memory, serving cost, quality by
  language/user group

### Step 7: Train & Compare (Local Adapter)
- Train PEFT/LoRA/QLoRA adapter over open-weight checkpoint
- Compare adapter vs baseline using same tasks, decoding settings, compute/cost limits
- Blind human evaluation where judgment is needed
- **Reject or roll back if:** critical trust/safety/privacy regression, improvements
  not repeatable on held-out, performance harms a user group, cost/latency exceeds
  approved envelope

### Step 8: Version & Sign Everything
- Base hash + adapter hash + tokenizer/prompt protocol + runtime version + safety policy
- Data manifest, training config, code/container, evaluations, model card
- Owner approval, allowed users/tasks, known limits, rollback version, serving endpoint
- Deploy behind canary, route only eligible tasks
- Monitor drift and cost; provide kill switch and restore path

### Step 9: Record in Ledger
Log whether this was:
- (a) Prompt/RAG/tool adaptation
- (b) HEY-controlled fine-tuned adapter over open weights
- (c) Provider-managed fine-tuning
- (d) From-scratch pretraining

**Never call (a) or API inference "fine-tuning." Never call (b) full ownership of base weights.**

---

## 4. What Requires Your Authorization (NOT Approved Yet)

| Item | Why It Needs Authorization | Status |
|------|---------------------------|--------|
| DeepSeek API key in `.env` | Potential per-token cost | Not configured |
| GPU/cloud compute for training | Spend required | $0 budget — not authorized |
| Uploading private/student data | Privacy/school policy violation | Prohibited |
| Provider-managed fine-tuning | Spend + data rights | Not authorized |
| Deployment to production server | Deployment action | Not authorized |
| Contacting school administrators | External action | Not authorized |

---

## 5. Local Model Targets for Your Hardware (i7-1255U, 16GB RAM)

| Model Tier | Parameters | RAM Required | Local Feasibility |
|------------|-----------|--------------|-------------------|
| HEY Nano | ~1B | ~0.5-1GB | ✅ Excellent |
| HEY Mini | ~4B | ~2-3GB | ✅ Good |
| HEY Local+ | ~9B quantized | ~5-6GB | ⚠️ Possible, slower |
| HEY Core | 20B-40B+ | 20GB+ | ❌ Cloud only |
| DeepSeek V4.1 Flash | 552B backbone | 300GB+ | ❌ Cloud only |

**Recommendation:** Start with HEY-4B (Qwen3.5-4B Base, Apache-2.0) for local
experimentation. 16GB RAM is enough to run and test 1B-4B models locally.

---

## 6. What You Can Do Right Now (All $0, Local)

| Action | File/Location |
|--------|--------------|
| Review this plan | `docs/DEEPSEEK_FINETUNING_PLAN.md` |
| Add DeepSeek API key for inference | `C:\Users\DELL\Documents\hey\.env` → `DEEPSEEK_API_KEY=` |
| Run local HEY intelligence | Already built in `src/core/localIntelligence.js` |
| Test local reflex commands | Volume, media, playback — works without API key |
| Test local arithmetic | `2 + 2` — works without API key |

---

## 7. What I Need From You To Proceed With Training

1. **The actual fine-tuning instructions** from your ChatGPT chats (paste them here — I cannot log in)
2. **Explicit authorization** for any item in Section 4 (API key, compute, deployment, contact)
3. **Training data** — what data should be used? (Must be rights-cleared, no student/PII data)
4. **Which measurable failure** should Step 1 target?

---

## 8. Risk Warnings

- **Fine-tuning 763B+ parameter models locally requires significant hardware.** The 8B/16B active
  parameter count does NOT reflect total memory requirements. Measure actual checkpoint size before
  estimating hardware.
- **API inference is not fine-tuning.** Calling `deepseek-flash` does not make it "HEY's own model."
- **No student data.** Leaders is a school project — pupil data must never be used for training
  without explicit consent and governance.
- **$0 budget.** No cloud GPU, no API training, no paid services without explicit authorization.

---

**Bottom line:** The HEY product is built and demo-ready for local use. The fine-tuning plan is
ready — but I need you to paste the actual ChatGPT instructions and authorize any spending/data
use before I can proceed with model training.
