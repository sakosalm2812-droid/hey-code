export const PLAN_ORDER = Object.freeze(["free", "pro", "elite"]);

export const PLAN_CATALOG = Object.freeze({
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "A complete introduction to HEY.",
    highlights: [
      "Chat + Voice",
      "229-role agent orchestration",
      "Core memory",
      "Core Dynamic Island",
      "Basic computer + gesture control where supported",
      "Limited research, projects and creation",
      "Core customization",
    ],
    limits: {
      projects: 3,
      automations: 5,
      deviceFabric: 1,
      priority: "standard",
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 15,
    tagline: "The full personal intelligence system.",
    popular: true,
    highlights: [
      "Everything in Free",
      "Full Cosmos and advanced memory",
      "Expanded projects, files and research",
      "Full Forge agents + workflows",
      "Background automations and missions",
      "HEY Live + richer Dynamic Island",
      "Full customization",
      "Higher provider and creation allowances",
      "Multi-device continuity",
    ],
    limits: {
      projects: 50,
      automations: 100,
      deviceFabric: 5,
      priority: "high",
    },
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 45,
    tagline: "Maximum capability, limits and early access.",
    highlights: [
      "Everything in Pro",
      "Highest research and generation allowances",
      "Advanced capability creation",
      "Highest automation and mission limits",
      "Advanced Device Fabric",
      "Premium provider routing where configured",
      "Earliest experimental features",
      "Highest priority execution",
    ],
    limits: {
      projects: -1,
      automations: -1,
      deviceFabric: 20,
      priority: "highest",
    },
  },
});

export function getPlan(planId = "free") {
  return PLAN_CATALOG[planId] || PLAN_CATALOG.free;
}

export function planAtLeast(current, required) {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}
