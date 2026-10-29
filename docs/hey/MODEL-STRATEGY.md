# HEY — MODEL STRATEGY (Part 3, stage 15)

**Date:** 20 October 2026 · **Type:** decision record, not a training plan
**Budget reality:** $25–50/month for infrastructure `REPORTED` (owner constraint, Part 3 §2.5)
**Constraint:** no training, no fine-tuning, no weight download was performed or is proposed as an action here.

---

## 1. The four realizations, defined separately

| Realization | What it is | What it costs | What it requires | What it does **not** give you |
|---|---|---|---|---|
| **Hosted API** | Call a vendor's model over HTTPS, per token | Per-token fees, currently **`UNKNOWN`** — the registry prices are all `-1` because no vendor price was ever verified | A key, a network call, a budget cap | Ownership, price control, offline operation, or a guarantee the model stays available |
| **Licensed open weights** | Download a model whose licence permits use, run it on hardware you control | Storage + inference compute; **`UNKNOWN`** at HEY's scale because no measurement exists | GPU or CPU inference host, a serving stack, licence review | Quality parity with frontier APIs, or zero operational burden |
| **Trained adapter** | LoRA/QLoRA-style fine-tune on a base model you did not train | Rented GPU hours (one-off) + evaluation + hosting the adapter | A labelled dataset of HEY-specific examples, a base model that permits derivatives, an eval harness that can prove a delta | New knowledge, licence relief, or a small model that behaves like a large one |
| **Trained from scratch** | Pre-train a model on your own corpus | Rented compute at a scale that is **orders of magnitude above $50/month**; the honest answer is `UNKNOWN` until a budget exists | Data pipeline, tokenizer, training run, eval, serving | Anything a small team can afford this year |

The four are not a maturity ladder. They are four different purchases with different failure modes. HEY has
taken exactly one of them so far: hosted API, and only through four of its six registered providers.

## 2. What HEY can honestly claim, level by level

| Level | May claim | Must never claim |
|---|---|---|
| Hosted API | "HEY routes requests to configured providers and fails over between them" — after Part 4 wires the router | "HEY is powered by GPT-4o / Claude" as a product feature, or any quality claim without an eval |
| Open weights | "HEY can run a model locally where hardware allows" — only after it is measured on that hardware | "Private by default" (the route may still be hosted), "free" (compute is not free) |
| Adapter | "HEY's adapter improved task X by N points on HEY's own eval set" | "fine-tuned on your data" unless the data pipeline and consent exist; any benchmark number borrowed from a paper |
| From scratch | Nothing. `UNKNOWN` | "HEY has its own model" |

Two claims are banned outright in this repository: **"works when keys are added"** as a completion claim, and
any quality claim derived from `SYNTHETIC` fixtures. Fixtures prove the scorer works; they prove nothing
about a model.

## 3. The cheapest path to better quality, in order

Each level is cheaper than the one below it by roughly an order of magnitude. Do not descend without the
gate being met.

1. **Prompt + tools** — free. Gate to leave: the failure is *not* reproducible by rewriting the instruction
   or giving the model a tool it lacks. Evidence: 10 failing cases with prompt/tool fixes attempted.
2. **Retrieval** — near-free if it reuses existing storage. Gate: failures are "the model did not know HEY's
   own context", not "the model could not reason". Evidence: the answer exists in HEY's memory and was not
   supplied.
3. **Routing** — free, and already built in this part. Gate: quality is acceptable per task type but cost or
   latency is wrong. Routing does not raise the ceiling; it lowers the bill. Choose it when the eval says the
   *cheapest adequate* model is good enough for 80% of traffic.
4. **Adapter** — the first level that costs real money. Gate: a specific, repeatable behaviour gap survives
   1-3, affects at least 20% of a measured task set, and a base model with a permissive licence exists.
5. **Weights** — last. Gate: 1-4 have been exhausted, volume justifies a fixed cost, and licensing is
   resolved in writing.

The decision rule is deliberately conservative: **you may only move down a level when the level above has
been measured and failed.** HEY has not yet measured level 1, because no key exists.

## 4. Hardware reality

The owner's machine cannot train. It has no CUDA-capable GPU reported, `cargo`/`rustc` are absent
(`BASELINE.md`), and the repository's own distribution targets are blocked on tooling that is not installed.
Any training claim therefore implies **rented compute**, which implies a stated dollar budget before a single
job is launched. There is no path in which HEY trains a model on the owner's hardware this year. This is a
constraint, not a preference.

## 5. Licensing and data rights — verify before any weight is used

Before any open-weight or adapter work, all five must be answered in writing:

1. Does the licence permit **commercial** use and **derivative** models?
2. Does it permit **redistribution** of the weights, or only local use?
3. Does it impose **attribution** or **use-restriction** clauses that HEY's terms must mirror?
4. Is the **training data** provenance acceptable for HEY's jurisdiction and for its own privacy policy?
5. For an adapter: does the **base model** licence permit the adapter, and who owns the adapter weights?

Unanswered questions are a refusal, not a risk to accept. The registry already refuses `verified:false`
models when `requireVerified` is set; licensing should be treated the same way — a model with an
`unknown` licence is not usable, not "probably fine".

## 6. Recommendation, cost envelope, kill criterion

**Recommendation: stay at level 1-3. Do not train anything.**

- Keep hosted APIs as the only realization. Fix what is broken first: two of six providers are dormant, the
  vision path bypasses routing, and there is no budget enforcement anywhere (`PROVIDER-TRUTH.md` §4).
- Adopt the registry and the routing policy so cost decisions become explicit and testable.
- Spend the budget on **evaluation**, not on training. An eval set of 100 real HEY tasks is the asset that
  makes every later decision cheap.

**Cost envelope (a decision, not a measurement):**

| Item | Cap |
|---|---|
| Hosted inference | ≤ $30/month total, enforced by `costGovernor` envelopes, not by hope |
| Evaluation runs | ≤ $10/month |
| Contingency | ≤ $10/month |
| Rented GPU for an adapter | **$0** until the level-4 gate is met; then a single capped experiment, ≤ $25 one-off, requiring owner approval |

**Kill criterion.** Abandon the adapter track if, after a capped experiment, HEY's eval pass rate does not
improve by **at least 10 percentage points on the targeted task set, with no regression above 3 points
elsewhere**. Abandon the open-weight track if measured cost per 1,000 tasks on rented hardware exceeds the
hosted cost for the same task set. Both criteria are pre-registered here so the result cannot be
rationalised afterwards.

## 7. What remains UNKNOWN, and what resolves it

| Unknown | Why it matters | What resolves it |
|---|---|---|
| Vendor prices per million tokens | Routing cannot honour a budget without them | A verified price list, entered into the registry with `sourceUrl` and a date |
| Achievable latency per provider | Latency targets are unenforceable today | 20 timed requests per provider, recorded |
| Actual quality per task type | Every quality claim is currently unfounded | The evaluation harness on 100 real tasks |
| Whether free tiers stay free | Cost model depends on it | Vendor terms review, monthly |
| Base-model licence terms | Blocks level 4 entirely | Written licence review per candidate |
| Whether local inference is viable on owner hardware | Blocks open-weight level | A single measured inference run on the actual machine |

**Bottom line:** HEY's next quality gain is free — it is prompt, tools, retrieval, and the router this part
built. Anything beyond that is a purchase that must first be justified by a measurement HEY does not yet
have.
