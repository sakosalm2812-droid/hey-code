/**
 * HEY model registry — seed data (Part 3, stage 11).
 *
 * RULE THAT GOVERNS THIS FILE
 * ---------------------------
 * An entry exists here only because the model id appears as a string literal
 * in this repository. `evidence` cites the file and line where it was found.
 * That is what `verified: true` means here: "this id exists in the codebase",
 * NOT "this price is correct", NOT "this capability was benchmarked".
 *
 * Prices are deliberately -1 (unknown). No price list was ever verified
 * against a vendor, so none is asserted. -1 means unknown and is never free.
 * Context windows and output limits are copied from the code only where the
 * code declares them (src/lib/ai.ts MODEL_CONFIG, hardcoded max_tokens /
 * maxOutputTokens); otherwise they are 0 (unknown).
 *
 * Model ids from outside documents (including the V4 specification) are NOT
 * imported here. They are REPORTED, not verified.
 *
 * Regenerate the id inventory with:
 *   grep for model-family literals across src/ and supabase/functions/
 */

/** Cost sentinel: -1 means "unknown". It is never zero and never free. */
export const UNKNOWN_COST = -1;

/** The six providers that exist in this repository (Part 1 baseline). */
export const PROVIDER_IDS = Object.freeze([
  'openai',
  'anthropic',
  'openrouter',
  'groq',
  'gemini',
  'deepseek',
]);

/** Allowed capability labels. Anything outside this set is a validation error. */
export const CAPABILITIES = Object.freeze([
  'text',
  'code',
  'vision',
  'tools',
  'json',
  'long_context',
]);

export const REALIZATIONS = Object.freeze(['hosted', 'open-weight', 'adapter', 'local']);
export const STATUSES = Object.freeze(['active', 'degraded', 'deprecated', 'unavailable']);
export const REGIONS = Object.freeze(['global', 'us', 'eu', 'unverified']);

/** Observed date for every code-backed id in this file. */
const SEEN_AT = '2026-10-20';

function record(entry) {
  const provider = entry.provider;
  return {
    id: `${provider}:${entry.modelId}`,
    provider,
    modelId: entry.modelId,
    version: 1,
    verified: true,
    capabilities: entry.capabilities,
    contextTokens: entry.contextTokens ?? 0,
    maxOutputTokens: entry.maxOutputTokens ?? 0,
    inputCostPerMTokensCents: UNKNOWN_COST,
    outputCostPerMTokensCents: UNKNOWN_COST,
    expectedLatencyMs: 0,
    realization: 'hosted',
    license: entry.license ?? 'unknown',
    region: 'unverified',
    status: 'active',
    deprecatedAt: '',
    sourceUrl: entry.sourceUrl,
    verifiedAt: SEEN_AT,
    evidence: entry.evidence,
    ...(entry.outputModality ? { outputModality: entry.outputModality } : {}),
  };
}

const OPENAI_DOCS = 'https://platform.openai.com/docs/models';
const ANTHROPIC_DOCS = 'https://docs.anthropic.com/en/docs/about-claude/models';
const OPENROUTER_DOCS = 'https://openrouter.ai/models';
const GROQ_DOCS = 'https://console.groq.com/docs/models';
const GEMINI_DOCS = 'https://ai.google.dev/gemini-api/docs/models';
const DEEPSEEK_DOCS = 'https://api-docs.deepseek.com/quick_start/pricing';

export const MODEL_SEED = Object.freeze([
  // ---------------------------------------------------------------- openai
  record({
    provider: 'openai',
    modelId: 'gpt-4o',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 128000,
    maxOutputTokens: 4096,
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/lib/ai.ts:15',
  }),
  record({
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    capabilities: ['text', 'code', 'vision', 'long_context'],
    contextTokens: 128000,
    maxOutputTokens: 4096,
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/lib/ai.ts:16, src/lib/providers.ts:458, src/lib/files.ts:105',
  }),
  record({
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 128000,
    maxOutputTokens: 4096,
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/lib/ai.ts:17',
  }),
  record({
    provider: 'openai',
    modelId: 'gpt-4.1',
    capabilities: ['text', 'code', 'vision'],
    sourceUrl: OPENAI_DOCS,
    evidence: 'supabase/functions/hey/index.ts:89,449',
  }),
  record({
    provider: 'openai',
    modelId: 'gpt-image-1.5',
    capabilities: [],
    outputModality: 'image',
    sourceUrl: OPENAI_DOCS,
    evidence: 'supabase/functions/hey-studio/index.ts:111',
  }),
  record({
    provider: 'openai',
    modelId: 'dall-e-3',
    capabilities: [],
    outputModality: 'image',
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/lib/image.ts:83',
  }),
  record({
    provider: 'openai',
    modelId: 'dall-e-2',
    capabilities: [],
    outputModality: 'image',
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/lib/image.ts:12',
  }),
  record({
    provider: 'openai',
    modelId: 'whisper-1',
    capabilities: [],
    outputModality: 'transcript',
    sourceUrl: OPENAI_DOCS,
    evidence: 'src/app/api/voice/route.ts:42',
  }),

  // ------------------------------------------------------------- anthropic
  record({
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 200000,
    maxOutputTokens: 4096,
    sourceUrl: ANTHROPIC_DOCS,
    evidence: 'src/lib/ai.ts:18',
  }),
  record({
    provider: 'anthropic',
    modelId: 'claude-3-sonnet-20240229',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 200000,
    maxOutputTokens: 4096,
    sourceUrl: ANTHROPIC_DOCS,
    evidence: 'src/lib/ai.ts:19',
  }),
  record({
    provider: 'anthropic',
    modelId: 'claude-3-haiku-20240307',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 200000,
    maxOutputTokens: 4096,
    sourceUrl: ANTHROPIC_DOCS,
    evidence: 'src/lib/ai.ts:20, src/lib/providers.ts:459',
  }),

  // ------------------------------------------------------------ openrouter
  record({
    provider: 'openrouter',
    modelId: 'meta-llama/llama-3.3-70b-instruct:free',
    capabilities: ['text', 'code'],
    maxOutputTokens: 4096,
    sourceUrl: OPENROUTER_DOCS,
    evidence: 'src/lib/providers.ts:460',
  }),
  record({
    provider: 'openrouter',
    modelId: 'qwen/qwen3-next-80b-a3b-instruct:free',
    capabilities: ['text', 'code'],
    sourceUrl: OPENROUTER_DOCS,
    evidence: 'supabase/functions/hey/index.ts:90',
  }),
  record({
    provider: 'openrouter',
    modelId: 'qwen/qwen2.5-vl-72b-instruct:free',
    capabilities: ['text', 'vision'],
    sourceUrl: OPENROUTER_DOCS,
    evidence: 'supabase/functions/hey/index.ts:449',
  }),

  // ------------------------------------------------------------------ groq
  record({
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    capabilities: ['text', 'code'],
    maxOutputTokens: 4096,
    sourceUrl: GROQ_DOCS,
    evidence: 'src/lib/providers.ts:462, supabase/functions/hey/index.ts:92',
  }),
  record({
    provider: 'groq',
    modelId: 'llama-3.2-90b-vision-preview',
    capabilities: ['text', 'vision'],
    sourceUrl: GROQ_DOCS,
    evidence: 'supabase/functions/hey/index.ts:449',
  }),
  record({
    provider: 'groq',
    modelId: 'whisper-large-v3',
    capabilities: [],
    outputModality: 'transcript',
    sourceUrl: GROQ_DOCS,
    evidence: 'src/app/api/voice/route.ts:9',
  }),

  // ---------------------------------------------------------------- gemini
  record({
    provider: 'gemini',
    modelId: 'gemini-1.5-flash',
    capabilities: ['text', 'code'],
    maxOutputTokens: 4096,
    sourceUrl: GEMINI_DOCS,
    evidence: 'src/lib/providers.ts:461',
  }),
  record({
    provider: 'gemini',
    modelId: 'gemini-2.0-flash',
    capabilities: ['text', 'vision'],
    sourceUrl: GEMINI_DOCS,
    evidence: 'src/lib/files.ts:4',
  }),
  record({
    provider: 'gemini',
    modelId: 'gemini-2.5-flash',
    capabilities: ['text', 'code', 'vision'],
    sourceUrl: GEMINI_DOCS,
    evidence: 'supabase/functions/hey/index.ts:91',
  }),
  record({
    provider: 'gemini',
    modelId: 'imagen-3.0-generate-002',
    capabilities: [],
    outputModality: 'image',
    sourceUrl: GEMINI_DOCS,
    evidence: 'src/lib/image.ts:20',
  }),

  // -------------------------------------------------------------- deepseek
  record({
    provider: 'deepseek',
    modelId: 'deepseek-flash',
    capabilities: ['text', 'code', 'long_context'],
    contextTokens: 128000,
    maxOutputTokens: 4096,
    sourceUrl: DEEPSEEK_DOCS,
    evidence: 'src/lib/ai.ts:21, src/lib/providers.ts:463, src/core/providerRouter.js:44',
  }),
]);

/** Provenance for the seed set, quoted verbatim in docs/hey/PROVIDER-TRUTH.md. */
export const REGISTRY_META = Object.freeze({
  generatedAt: SEEN_AT,
  providerCount: PROVIDER_IDS.length,
  modelCount: MODEL_SEED.length,
  pricingSource: 'none — every price is -1 (unknown)',
  verificationRule: 'verified:true means the id appears in repository code, nothing more',
});

export default { MODEL_SEED, REGISTRY_META, PROVIDER_IDS, CAPABILITIES, UNKNOWN_COST };
