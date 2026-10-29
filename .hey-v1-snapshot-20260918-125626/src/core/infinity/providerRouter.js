const providers = new Map();
const telemetry = new Map();

function normalizeProvider(input) {
  if (!input?.id) throw new Error("Provider id is required");
  return {
    id: input.id,
    label: input.label || input.id,
    modalities: new Set(input.modalities || ["text"]),
    capabilities: new Set(input.capabilities || []),
    plans: new Set(input.plans || ["free", "pro", "elite"]),
    privacy: Number(input.privacy ?? 0.5),
    quality: Number(input.quality ?? 0.5),
    speed: Number(input.speed ?? 0.5),
    estimatedCost: Number(input.estimatedCost ?? 0),
    local: Boolean(input.local),
    enabled: input.enabled !== false,
    execute: input.execute || null,
  };
}

export function registerProvider(input) {
  const provider = normalizeProvider(input);
  providers.set(provider.id, provider);
  if (!telemetry.has(provider.id)) telemetry.set(provider.id, { health: 1, latencyMs: null, failures: 0, successes: 0 });
  return provider;
}

export function unregisterProvider(id) {
  providers.delete(id);
  telemetry.delete(id);
}

export function getProviders() {
  return Array.from(providers.values()).map((provider) => ({ ...provider, modalities: [...provider.modalities], capabilities: [...provider.capabilities], plans: [...provider.plans], telemetry: telemetry.get(provider.id) }));
}

export function updateProviderTelemetry(id, patch = {}) {
  const current = telemetry.get(id) || { health: 1, latencyMs: null, failures: 0, successes: 0 };
  const next = { ...current, ...patch };
  telemetry.set(id, next);
  return next;
}

function score(provider, request) {
  const t = telemetry.get(provider.id) || {};
  const modality = request.modality || "text";
  if (!provider.enabled || !provider.modalities.has(modality)) return -Infinity;
  if (request.plan && !provider.plans.has(request.plan)) return -Infinity;
  if (request.capability && provider.capabilities.size && !provider.capabilities.has(request.capability)) return -Infinity;
  if (request.localOnly && !provider.local) return -Infinity;
  if (request.exclude?.includes(provider.id)) return -Infinity;
  if (request.preferredProvider === provider.id) return 10000;
  let value = 0;
  value += provider.quality * Number(request.qualityWeight ?? 35);
  value += provider.speed * Number(request.speedWeight ?? 20);
  value += provider.privacy * Number(request.privacyWeight ?? 20);
  value += Number(t.health ?? 1) * 20;
  value -= provider.estimatedCost * Number(request.costWeight ?? 15);
  if (provider.local) value += Number(request.localBonus ?? 5);
  if (t.latencyMs != null) value -= Math.min(10, t.latencyMs / 1000);
  value -= Number(t.failures || 0) * 0.25;
  return value;
}

export function routeProvider(request = {}) {
  const ranked = Array.from(providers.values())
    .map((provider) => ({ provider, score: score(provider, request) }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score);
  return { selected: ranked[0]?.provider || null, ranked: ranked.map((entry) => ({ id: entry.provider.id, label: entry.provider.label, score: entry.score })) };
}

export async function executeWithFailover(request = {}, payload) {
  const attempted = [];
  let excluded = [...(request.exclude || [])];
  while (attempted.length < Math.max(1, providers.size)) {
    const route = routeProvider({ ...request, exclude: excluded });
    const provider = route.selected;
    if (!provider) break;
    attempted.push(provider.id);
    excluded = [...excluded, provider.id];
    if (typeof provider.execute !== "function") continue;
    const started = Date.now();
    try {
      const result = await provider.execute(payload, request);
      if (result?.ok === false || result?.success === false || result?.error) throw new Error(result.error || 'Provider reported failure');
      const current = telemetry.get(provider.id) || {};
      updateProviderTelemetry(provider.id, { health: Math.min(1, Number(current.health ?? 1) + 0.03), latencyMs: Date.now() - started, successes: Number(current.successes || 0) + 1 });
      return { ok: true, providerId: provider.id, result, attempted };
    } catch {
      const current = telemetry.get(provider.id) || {};
      updateProviderTelemetry(provider.id, { health: Math.max(0, Number(current.health ?? 1) - 0.2), latencyMs: Date.now() - started, failures: Number(current.failures || 0) + 1 });
    }
  }
  return { ok: false, attempted, error: "No compatible provider completed the request." };
}

