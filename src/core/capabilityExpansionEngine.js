import { publish } from "./eventBus.js";
import {
  getAllAgents,
  registerCustomAgent,
} from "../../agents/agents.js";

const OWNER_NOTIFICATION_EVENT = "hey:owner-notification";
const AUTO_FORGE_STORAGE_KEY = "hey_auto_forge_history";

function normalize(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function keywords(text) {
  return normalize(text).split(" ").filter((token) => token.length >= 4);
}

function existingCoverageScore(agent, requestTokens) {
  const haystack = normalize([
    agent?.id,
    agent?.name,
    agent?.role,
    agent?.description,
    ...(agent?.capabilities || []),
    ...(agent?.keywords || []),
    ...(agent?.intents || []),
  ].filter(Boolean).join(" "));
  if (!haystack) return 0;
  return requestTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

export function findCapabilityCoverage(request) {
  const tokens = keywords(request);
  if (!tokens.length) return { covered: true, agent: null, score: 0 };

  const ranked = getAllAgents()
    .map((agent) => ({ agent, score: existingCoverageScore(agent, tokens) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0] || { agent: null, score: 0 };
  return {
    covered: best.score >= Math.min(2, tokens.length),
    agent: best.agent,
    score: best.score,
  };
}

function safeId(request) {
  return `auto-${normalize(request).split(" ").slice(0, 6).join("-") || "capability"}`.slice(0, 72);
}

function persistHistory(record) {
  try {
    const raw = localStorage.getItem(AUTO_FORGE_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(list) ? list : [];
    next.unshift(record);
    localStorage.setItem(AUTO_FORGE_STORAGE_KEY, JSON.stringify(next.slice(0, 100)));
  } catch {
    // Storage is optional.
  }
}

function notifyOwners(payload) {
  try {
    window.dispatchEvent(new CustomEvent(OWNER_NOTIFICATION_EVENT, { detail: payload }));
  } catch {
    // Non-browser runtime.
  }
  try {
    publish("forge.auto_expansion", payload);
  } catch {
    // Event bus should never block completion.
  }
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("HEY expanded itself", {
        body: payload.message,
      });
    }
  } catch {
    // Native/browser notification provider may not be available.
  }
}

function isHighRiskRequest(request) {
  const text = normalize(request);
  return [
    "password", "authentication", "authorization", "billing", "payment",
    "delete account", "security policy", "permission", "service role",
    "production deploy", "database migration", "secret", "token",
  ].some((term) => text.includes(term));
}

/**
 * Creates a low-risk specialist definition when HEY has no useful specialist.
 * This never grants tools, permissions, secrets or deployment authority.
 * High-risk capability gaps are proposed for owner review instead.
 */
export function ensureCapabilityAgent(request, options = {}) {
  const coverage = findCapabilityCoverage(request);
  if (coverage.covered) {
    return { status: "covered", agent: coverage.agent, created: false };
  }

  const highRisk = isHighRiskRequest(request);
  const now = new Date().toISOString();
  const candidate = {
    id: safeId(request),
    name: `Adaptive Specialist · ${String(request).trim().slice(0, 48) || "Capability"}`,
    role: "Auto-Forged Specialist",
    category: "Core Intelligence",
    description: `Created because HEY detected a capability gap for: ${String(request).trim().slice(0, 220)}`,
    capabilities: [String(request).trim().slice(0, 160)],
    intents: keywords(request).slice(0, 5),
    keywords: keywords(request).slice(0, 10),
    tools: [],
    requiredPermissions: [],
    riskLevel: highRisk ? "high" : "low",
    verificationMethod: "Validate output against the original request before use.",
    failureBehavior: "Fail closed and report the missing registered tool or permission.",
    source: "auto-forge",
    createdAt: now,
  };

  if (highRisk || options.approvalRequired === true) {
    const proposal = {
      status: "owner_review_required",
      candidate,
      created: false,
      message: `HEY found a missing high-impact capability and prepared ${candidate.name} for owner review.`,
      at: now,
    };
    persistHistory(proposal);
    notifyOwners(proposal);
    return proposal;
  }

  const result = registerCustomAgent(candidate);
  const record = result.success
    ? {
        status: "created",
        agent: result.agent,
        created: true,
        message: `HEY silently added ${result.agent.name}. It has no extra permissions and will use only already-registered tools.`,
        at: now,
      }
    : {
        status: "not_created",
        created: false,
        reason: result.reason,
        message: `HEY detected a capability gap but did not install a specialist: ${result.reason}`,
        at: now,
      };

  persistHistory(record);
  notifyOwners(record);
  return record;
}

export function getAutoForgeHistory() {
  try {
    const raw = localStorage.getItem(AUTO_FORGE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const OWNER_NOTIFICATION_EVENT_NAME = OWNER_NOTIFICATION_EVENT;
