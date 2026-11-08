/**
 * HEY Response Pipeline
 *
 * Handles the final stages of response generation: synthesis, verification,
 * formatting, and delivery. Converts council decisions and evidence into
 * user-facing responses with proper citations and limitations.
 *
 * @module core/responsePipeline
 */

import { deepFreeze } from "./heyBrain.js";
import { getBoardSummary } from "./evidenceBoard.js";

/**
 * Response State
 * @typedef {Object} ResponseState
 * @property {string} id - Unique response ID
 * @property {string} requestId - Associated request
 * @property {string} sessionId - Associated reasoning session
 * @property {string} mode - Response mode: concise, standard, detailed
 * @property {string} format - Response format
 * @property {Object} content - Response content
 * @property {Object[]} claims - Claims made in response
 * @property {Object[]} citations - Citations for claims
 * @property {Object} limitations - Limitations and uncertainties
 * @property {Object} provenance - Response provenance
 * @property {string} status - Response status: drafting, reviewing, ready, delivered
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 */

/**
 * Create a new response pipeline
 * @param {Object} options - Configuration options
 * @param {string} options.requestId - Associated request
 * @param {string} options.sessionId - Associated session
 * @param {string} [options.mode=standard] - Response mode
 * @param {string} [options.format=prose] - Response format
 * @param {string} [options.id] - Optional response ID
 * @returns {ResponseState} New response pipeline
 */
export function createResponsePipeline(options = {}) {
  const {
    requestId,
    sessionId,
    mode = "standard",
    format = "prose",
    id = `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  } = options || {};

  if (!requestId || typeof requestId !== "string") {
    throw new TypeError("Request ID must be a valid string");
  }

  if (!sessionId || typeof sessionId !== "string") {
    throw new TypeError("Session ID must be a valid string");
  }

  const response = {
    id,
    requestId,
    sessionId,
    mode,
    format,
    content: {
      text: "",
      sections: [],
      components: [],
      actions: [],
    },
    claims: [],
    citations: [],
    limitations: [],
    provenance: {
      model: null,
      provider: null,
      route: null,
      latencyMs: null,
      costCents: null,
    },
    status: "drafting",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return deepFreeze(response);
}

/**
 * Set response content
 * @param {ResponseState} response - Response to update
 * @param {Object} content - Content to set
 * @param {string} [content.text] - Main text content
 * @param {Object[]} [content.sections] - Response sections
 * @param {Object[]} [content.components] - UI components
 * @param {Object[]} [content.actions] - Available actions
 * @returns {ResponseState} Updated response
 */
export function setResponseContent(response, content) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const { text, sections = [], components = [], actions = [] } = content || {};

  const updatedContent = {
    text: text || "",
    sections: Array.isArray(sections) ? sections : [],
    components: Array.isArray(components) ? components : [],
    actions: Array.isArray(actions) ? actions : [],
  };

  const updatedResponse = {
    ...response,
    content: updatedContent,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Add a claim to the response
 * @param {ResponseState} response - Response to update
 * @param {Object} claim - Claim to add
 * @param {string} claim.text - Claim text
 * @param {string} claim.support - Support level: verified, inferred, unsupported
 * @param {string[]} claim.citations - Source IDs
 * @param {number} [confidence=100] - Confidence score
 * @param {string} [rationale] - Rationale for the claim
 * @returns {ResponseState} Updated response
 */
export function addResponseClaim(response, claim, confidence = 100, rationale) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const { text, support, citations = [] } = claim || {};

  if (!text || typeof text !== "string") {
    throw new TypeError("Claim must have valid text");
  }

  if (!["verified", "inferred", "unsupported"].includes(support)) {
    throw new TypeError("Claim support must be verified, inferred, or unsupported");
  }

  const newClaim = {
    id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    support,
    citations: Array.isArray(citations) ? citations : [],
    confidence: Math.min(Math.max(confidence, 0), 100),
    rationale,
    addedAt: Date.now(),
  };

  const updatedClaims = [...response.claims, newClaim];

  const updatedResponse = {
    ...response,
    claims: updatedClaims,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Add a citation to the response
 * @param {ResponseState} response - Response to update
 * @param {Object} citation - Citation to add
 * @param {string} citation.id - Source ID
 * @param {string} citation.type - Source type
 * @param {string} citation.description - Source description
 * @param {number} [relevance=100] - Relevance score
 * @returns {ResponseState} Updated response
 */
export function addResponseCitation(response, citation, relevance = 100) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const { id, type, description } = citation || {};

  if (!id || typeof id !== "string") {
    throw new TypeError("Citation must have a valid id");
  }

  if (!type || typeof type !== "string") {
    throw new TypeError("Citation must have a type");
  }

  if (!description || typeof description !== "string") {
    throw new TypeTypeError("Citation must have a description");
  }

  const existingCitationIndex = response.citations.findIndex(c => c.id === id);

  let updatedCitations;

  if (existingCitationIndex >= 0) {
    // Update existing citation
    const existing = response.citations[existingCitationIndex];
    updatedCitations = [...response.citations];
    updatedCitations[existingCitationIndex] = {
      ...existing,
      description,
      relevance: Math.min(Math.max(relevance, 0), 100),
      updatedAt: Date.now(),
    };
  } else {
    // Add new citation
    updatedCitations = [
      ...response.citations,
      {
        id,
        type,
        description: description.trim(),
        relevance: Math.min(Math.max(relevance, 0), 100),
        addedAt: Date.now(),
      },
    ];
  }

  const updatedResponse = {
    ...response,
    citations: updatedCitations,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Add a limitation to the response
 * @param {ResponseState} response - Response to update
 * @param {string} limitation - Limitation text
 * @param {string} [category=general] - Limitation category
 * @param {number} [severity=medium] - Severity: low, medium, high
 * @returns {ResponseState} Updated response
 */
export function addResponseLimitation(response, limitation, category = "general", severity = "medium") {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  if (!limitation || typeof limitation !== "string") {
    throw new TypeError("Limitation must be a valid string");
  }

  const validSeverities = ["low", "medium", "high"];

  if (!validSeverities.includes(severity)) {
    throw new TypeError(`Severity must be one of: ${validSeverities.join(", ")}`);
  }

  const newLimitation = {
    id: `limitation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: limitation.trim(),
    category,
    severity,
    reportedAt: Date.now(),
  };

  const updatedResponse = {
    ...response,
    limitations: [...response.limitations, newLimitation],
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Set response provenance
 * @param {ResponseState} response - Response to update
 * @param {Object} provenance - Provenance information
 * @param {string} [provenance.model] - Model used
 * @param {string} [provenance.provider] - Provider used
 * @param {string} [provenance.route] - Route used
 * @param {number} [provenance.latencyMs] - Latency in ms
 * @param {number} [provenance.costCents] - Cost in cents
 * @returns {ResponseState} Updated response
 */
export function setResponseProvenance(response, provenance) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const updatedProvenance = {
    model: provenance?.model || null,
    provider: provenance?.provider || null,
    route: provenance?.route || null,
    latencyMs: provenance?.latencyMs || null,
    costCents: provenance?.costCents || null,
  };

  const updatedResponse = {
    ...response,
    provenance: updatedProvenance,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Transition response status
 * @param {ResponseState} response - Response to update
 * @param {string} newStatus - New status
 * @returns {ResponseState} Updated response
 */
export function transitionResponseStatus(response, newStatus) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const validStatuses = ["drafting", "reviewing", "ready", "delivered"];

  if (!validStatuses.includes(newStatus)) {
    throw new TypeError(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const updatedResponse = {
    ...response,
    status: newStatus,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Synthesize response from evidence board
 * @param {ResponseState} response - Response to synthesize
 * @param {Object} evidenceBoard - Evidence board to use
 * @param {string} [mode] - Override mode
 * @param {string} [format] - Override format
 * @returns {ResponseState} Updated response with synthesized content
 */
export function synthesizeResponseFromEvidence(response, evidenceBoard, mode, format) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  if (!evidenceBoard || typeof evidenceBoard !== "object") {
    throw new TypeError("Evidence board must be a valid object");
  }

  const targetMode = mode || response.mode;
  const targetFormat = format || response.format;

  // Extract claims from evidence board
  const claims = evidenceBoard.claims || [];

  // Extract sources from evidence board
  const sources = evidenceBoard.sources || [];

  // Build response text based on mode
  let mainText = "";

  if (targetMode === "concise") {
    // Concise: Just the key findings
    const verifiedClaims = claims.filter(c => c.support === "verified");
    if (verifiedClaims.length > 0) {
      mainText = verifiedClaims.slice(0, 3).map(c => `- ${c.text}`).join("\n");
    }
  } else if (targetMode === "detailed") {
    // Detailed: Full explanation with all claims
    const sections = [];

    // Add verified claims section
    const verified = claims.filter(c => c.support === "verified");
    if (verified.length > 0) {
      sections.push({
        title: "Verified Information",
        content: verified.map(c => `- ${c.text}`).join("\n"),
        type: "verified",
      });
    }

    // Add inferred claims section
    const inferred = claims.filter(c => c.support === "inferred");
    if (inferred.length > 0) {
      sections.push({
        title: "Reasoning and Inferences",
        content: inferred.map(c => `- ${c.text}`).join("\n"),
        type: "inferred",
      });
    }

    // Add limitations section
    const limitations = evidenceBoard.limitations || [];
    if (limitations.length > 0) {
      sections.push({
        title: "Limitations and Uncertainties",
        content: limitations.map(l => `- ${l}`).join("\n"),
        type: "limitations",
      });
    }

    // Format as sections
    mainText = sections.map(s => `## ${s.title}\n\n${s.content}`).join("\n\n");
  } else {
    // Standard: Balanced approach
    const verified = claims.filter(c => c.support === "verified");
    const inferred = claims.filter(c => c.support === "inferred");

    mainText = [];

    if (verified.length > 0) {
      mainText.push("### Verified Information\n");
      mainText.push(verified.map(c => `- ${c.text}`).join("\n"));
    }

    if (inferred.length > 0) {
      mainText.push("\n### Reasoning\n");
      mainText.push(inferred.map(c => `- ${c.text}`).join("\n"));
    }

    mainText = mainText.join("\n\n");
  }

  // Build citations
  const citations = sources.map(source => ({
    id: source.id,
    type: source.type,
    description: source.description,
    relevance: source.reliability,
  }));

  // Build limitations from evidence board
  const limitations = evidenceBoard.limitations || [];

  const updatedResponse = {
    ...response,
    mode: targetMode,
    format: targetFormat,
    content: {
      ...response.content,
      text: mainText,
      sections: mainText ? [{ type: "text", content: mainText }] : [],
    },
    claims: claims.map(claim => ({
      ...claim,
      id: claim.id || `claim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
    citations,
    limitations: limitations.map((limitation, index) => ({
      id: `limitation-${index}-${Date.now()}`,
      text: limitation,
      category: "evidence",
      severity: "medium",
      reportedAt: Date.now(),
    })),
    status: "ready",
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Add disclaimer to response
 * @param {ResponseState} response - Response to update
 * @param {string} disclaimer - Disclaimer text
 * @returns {ResponseState} Updated response
 */
export function addResponseDisclaimer(response, disclaimer) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  if (!disclaimer || typeof disclaimer !== "string") {
    throw new TypeError("Disclaimer must be a valid string");
  }

  const updatedContent = {
    ...response.content,
    disclaimer: disclaimer.trim(),
  };

  const updatedResponse = {
    ...response,
    content: updatedContent,
    updatedAt: Date.now(),
  };

  return deepFreeze(updatedResponse);
}

/**
 * Get response summary
 * @param {ResponseState} response - Response to summarize
 * @returns {Object} Response summary
 */
export function getResponseSummary(response) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const claimSummary = {
    total: response.claims.length,
    verified: response.claims.filter(c => c.support === "verified").length,
    inferred: response.claims.filter(c => c.support === "inferred").length,
    unsupported: response.claims.filter(c => c.support === "unsupported").length,
  };

  const citationSummary = {
    total: response.citations.length,
    types: [...new Set(response.citations.map(c => c.type))],
  };

  const limitationSummary = {
    total: response.limitations.length,
    severities: {
      low: response.limitations.filter(l => l.severity === "low").length,
      medium: response.limitations.filter(l => l.severity === "medium").length,
      high: response.limitations.filter(l => l.severity === "high").length,
    },
  };

  return {
    id: response.id,
    requestId: response.requestId,
    sessionId: response.sessionId,
    mode: response.mode,
    format: response.format,
    status: response.status,
    contentLength: response.content.text.length,
    claimSummary,
    citationSummary,
    limitationSummary,
    provenance: response.provenance,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

/**
 * Export response to structured format
 * @param {ResponseState} response - Response to export
 * @returns {Object} Structured export
 */
export function exportResponse(response) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  return {
    id: response.id,
    requestId: response.requestId,
    sessionId: response.sessionId,
    mode: response.mode,
    format: response.format,
    content: response.content,
    claims: response.claims,
    citations: response.citations,
    limitations: response.limitations,
    provenance: response.provenance,
    status: response.status,
    createdAt: response.createdAt,
    updatedAt: Date.now(),
  };
}

/**
 * Import response from structured format
 * @param {Object} data - Import data
 * @returns {ResponseState} Response pipeline
 */
export function importResponse(data) {
  if (!data || typeof data !== "object") {
    throw new TypeError("Data must be a valid object");
  }

  const response = createResponsePipeline({
    requestId: data.requestId,
    sessionId: data.sessionId,
    mode: data.mode,
    format: data.format,
    id: data.id,
  });

  // Apply content
  let updatedResponse = setResponseContent(response, data.content);

  // Apply claims
  if (data.claims) {
    data.claims.forEach(claim => {
      updatedResponse = addResponseClaim(updatedResponse, claim, claim.confidence, claim.rationale);
    });
  }

  // Apply citations
  if (data.citations) {
    data.citations.forEach(citation => {
      updatedResponse = addResponseCitation(updatedResponse, citation, citation.relevance);
    });
  }

  // Apply limitations
  if (data.limitations) {
    data.limitations.forEach(limitation => {
      updatedResponse = addResponseLimitation(
        updatedResponse,
        limitation.text,
        limitation.category,
        limitation.severity
      );
    });
  }

  // Apply provenance
  if (data.provenance) {
    updatedResponse = setResponseProvenance(updatedResponse, data.provenance);
  }

  // Apply status
  if (data.status) {
    updatedResponse = transitionResponseStatus(updatedResponse, data.status);
  }

  return updatedResponse;
}

/**
 * Validate response structure
 * @param {ResponseState} response - Response to validate
 * @returns {{ok: boolean, errors: string[]}} Validation result
 */
export function validateResponse(response) {
  const errors = [];

  if (!response || typeof response !== "object") {
    return { ok: false, errors: ["Response must be an object"] };
  }

  if (!response.id || typeof response.id !== "string") {
    errors.push("Response must have a valid id");
  }

  if (!response.requestId || typeof response.requestId !== "string") {
    errors.push("Response must have a valid requestId");
  }

  if (!response.sessionId || typeof response.sessionId !== "string") {
    errors.push("Response must have a valid sessionId");
  }

  if (!response.content || typeof response.content !== "object") {
    errors.push("Response must have content");
  }

  if (!Array.isArray(response.claims)) {
    errors.push("Response claims must be an array");
  }

  if (!Array.isArray(response.citations)) {
    errors.push("Response citations must be an array");
  }

  if (!Array.isArray(response.limitations)) {
    errors.push("Response limitations must be an array");
  }

  if (response.status && typeof response.status !== "string") {
    errors.push("Response status must be a string");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

/**
 * Format response for user delivery
 * @param {ResponseState} response - Response to format
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.includeCitations=true] - Include citations
 * @param {boolean} [options.includeLimitations=true] - Include limitations
 * @param {string} [options.mode] - Override mode
 * @returns {string} Formatted response text
 */
export function formatResponseForDelivery(response, options = {}) {
  if (!response || typeof response !== "object") {
    throw new TypeError("Response must be a valid response pipeline");
  }

  const {
    includeCitations = true,
    includeLimitations = true,
    mode = response.mode,
  } = options || {};

  let text = response.content.text || "";

  // Add citations if requested
  if (includeCitations && response.citations.length > 0) {
    const citationText = response.citations
      .map(c => `[${c.id}: ${c.description.substring(0, 50)}...]`)
      .join(" ");
    text += `\n\nSources: ${citationText}`;
  }

  // Add limitations if requested
  if (includeLimitations && response.limitations.length > 0) {
    const limitationText = response.limitations
      .map(l => `- ${l.text}`)
      .join("\n");
    text += `\n\nLimitations:\n${limitationText}`;
  }

  // Add disclaimer if present
  if (response.content.disclaimer) {
    text += `\n\n${response.content.disclaimer}`;
  }

  return text;
}

// Export default with all functions
export default {
  createResponsePipeline,
  setResponseContent,
  addResponseClaim,
  addResponseCitation,
  addResponseLimitation,
  setResponseProvenance,
  transitionResponseStatus,
  synthesizeResponseFromEvidence,
  addResponseDisclaimer,
  getResponseSummary,
  exportResponse,
  importResponse,
  validateResponse,
  formatResponseForDelivery,
};
