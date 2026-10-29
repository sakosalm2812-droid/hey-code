#!/usr/bin/env node
/**
 * HEY — agent snapshot.
 *
 * Reads the five `src/lib/agents/data-*.ts` files as TEXT, parses every `ag(...)`
 * record, and writes `docs/hey/agents.snapshot.json`.
 *
 * Why text and not an import:
 *   - the files are TypeScript with `import type`, which plain `node` cannot execute;
 *   - a parser is deterministic and does not need a TS toolchain;
 *   - a parser that fails loudly turns "silently dropped agents" into a build error,
 *     which is exactly the failure mode a 229-record registry is prone to.
 *
 * Guarantees:
 *   - every `ag(` call is parsed or the process exits non-zero with file:line;
 *   - unexpected syntax (spread, unknown seed key, unknown identifier, unknown tool)
 *     is an error, never a skip;
 *   - the output JSON contains no timestamps, so re-running on unchanged sources
 *     produces byte-identical output;
 *   - the effective contract (what `ag()` actually returns) is emitted alongside the
 *     declared contract, so "how many declare risk" and "what risk applies" are two
 *     distinct, measurable numbers.
 *
 * Usage:
 *   node scripts/snapshot-agents.mjs                 # write + report
 *   node scripts/snapshot-agents.mjs --check         # parse + compare, write nothing
 *   node scripts/snapshot-agents.mjs --allow-count-change
 *
 * Exit codes: 0 ok, 1 parse/validation failure or stale snapshot in --check mode.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Test seams. Both are ignored in normal use; the tests point them at a fixture
// directory to prove that a broken record fails loudly instead of being skipped.
const AGENT_DIR = process.env.HEY_AGENT_DIR
  ? resolve(process.env.HEY_AGENT_DIR)
  : join(ROOT, 'src', 'lib', 'agents');
const OUT_FILE = process.env.HEY_SNAPSHOT_OUT
  ? resolve(process.env.HEY_SNAPSHOT_OUT)
  : join(ROOT, 'docs', 'hey', 'agents.snapshot.json');

/** Registry order, matching `registry.ts`: core, dev, creative, knowledge, qa-forge. */
const SOURCE_FILES = [
  { file: 'data-core.ts', exportName: 'AGENTS_CORE' },
  { file: 'data-dev.ts', exportName: 'AGENTS_DEV' },
  { file: 'data-creative.ts', exportName: 'AGENTS_CREATIVE' },
  { file: 'data-knowledge.ts', exportName: 'AGENTS_KNOWLEDGE' },
  { file: 'data-qa-forge.ts', exportName: 'AGENTS_QA_FORGE' },
];

const EXPECTED_TOTAL = 229;

const RISK_CLASSES = ['minimal', 'low', 'medium', 'high', 'critical'];
const PRIVACY_CLASSES = ['global', 'project', 'private', 'sensitive', 'local'];
const MODEL_IDS = ['GPT_4O', 'GPT_4O_MINI', 'GPT_4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'CLAUDE_3_HAIKU'];

/** Every key `AgentSeed` allows. Anything else is a parse error, not an ignored option. */
const SEED_KEYS = new Set([
  'tools', 'permissions', 'model', 'fallbackModels', 'risk', 'privacy', 'timeoutMs',
  'retries', 'inputSchema', 'outputSchema', 'keywords', 'boundaries', 'platforms', 'version',
]);

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const ALLOW_COUNT_CHANGE = args.has('--allow-count-change');

/** Data-level defects found while parsing. Reported, never silently dropped. */
const anomalies = [];

class ParseError extends Error {
  constructor(file, line, message) {
    super(`${file}:${line}: ${message}`);
    this.name = 'ParseError';
    this.file = file;
    this.line = line;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. source scanning
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Blank out comments while preserving offsets and line numbers, and record the
 * offset of every string literal so that an `ag(` inside prose can never be
 * mistaken for a call.
 */
function scanSource(text) {
  let out = '';
  const stringSpans = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') { out += ' '; i += 1; }
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        out += text[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      if (i >= text.length) throw new Error('unterminated block comment');
      out += '  ';
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      const start = i;
      const quote = ch;
      out += ch;
      i += 1;
      while (i < text.length) {
        if (text[i] === '\\') { out += text[i] + (text[i + 1] ?? ''); i += 2; continue; }
        if (text[i] === quote) { out += quote; i += 1; break; }
        out += text[i];
        i += 1;
      }
      if (i > text.length) throw new Error('unterminated string literal');
      stringSpans.push([start, i]);
      continue;
    }
    out += ch;
    i += 1;
  }
  return { code: out, stringSpans };
}

function inAnySpan(index, spans) {
  let lo = 0;
  let hi = spans.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [start, end] = spans[mid];
    if (index < start) hi = mid - 1;
    else if (index >= end) lo = mid + 1;
    else return true;
  }
  return false;
}

/** Walk from an opening bracket to its match, ignoring brackets inside strings. */
function matchBracket(text, openIndex) {
  const open = text[openIndex];
  const close = open === '(' ? ')' : open === '[' ? ']' : '}';
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i += 1;
        i += 1;
      }
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth -= 1;
      if (depth === 0) {
        if (ch !== close) throw new Error(`bracket mismatch at offset ${i}`);
        return i;
      }
    }
  }
  throw new Error(`unbalanced ${open} at offset ${openIndex}`);
}

/** Split on commas that are not inside brackets or strings. */
function splitTopLevel(text, delimiter = ',') {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i += 1;
        i += 1;
      }
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    else if (ch === delimiter && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function unescapeLiteral(raw) {
  return raw.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_m, seq) => {
    if (seq.startsWith('u')) return String.fromCharCode(parseInt(seq.slice(1), 16));
    if (seq.startsWith('x')) return String.fromCharCode(parseInt(seq.slice(1), 16));
    if (seq === 'n') return '\n';
    if (seq === 't') return '\t';
    if (seq === 'r') return '\r';
    return seq;
  });
}

function parseStringLiteral(raw, ctx) {
  const text = raw.trim();
  const quote = text[0];
  if (quote !== "'" && quote !== '"') {
    throw new ParseError(ctx.file, ctx.line, `expected a string literal, found: ${shorten(text)}`);
  }
  if (text.length < 2 || text[text.length - 1] !== quote) {
    throw new ParseError(ctx.file, ctx.line, `unterminated string literal: ${shorten(text)}`);
  }
  return unescapeLiteral(text.slice(1, -1));
}

function shorten(text, max = 60) {
  const oneLine = String(text).replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. the two helper constants the dev data file uses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `data-dev.ts` passes `DEV_TOOLS` and `DEV_KEYWORDS([...])` instead of literals.
 * Rather than hard-coding what they mean, read them from `factory.ts` and refuse to
 * continue if the shape is not the one this resolver understands.
 */
function readSeedConstants(factorySource, file) {
  const toolsMatch = factorySource.match(
    /export const DEV_TOOLS:\s*AgentToolId\[\]\s*=\s*\[([^\]]*)\]/
  );
  if (!toolsMatch) {
    throw new ParseError(file, 1, 'could not find `DEV_TOOLS` in factory.ts — resolver needs updating');
  }
  const devTools = splitTopLevel(toolsMatch[1])
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => parseStringLiteral(part, { file, line: 1 }));

  const keywordsMatch = factorySource.match(
    /export const DEV_KEYWORDS\s*=\s*\(\s*(\w+)[^)]*\)\s*=>\s*\[([^\]]*)\]/
  );
  if (!keywordsMatch) {
    throw new ParseError(file, 1, 'could not find `DEV_KEYWORDS` in factory.ts — resolver needs updating');
  }
  const [, paramName, body] = keywordsMatch;
  const bodyParts = splitTopLevel(body).map((part) => part.trim()).filter(Boolean);
  const spreadIndex = bodyParts.findIndex((part) => part === `...${paramName}`);
  if (spreadIndex !== bodyParts.length - 1) {
    throw new ParseError(file, 1, `\`DEV_KEYWORDS\` must end with \`...${paramName}\` — resolver needs updating`);
  }
  const prefix = bodyParts
    .slice(0, spreadIndex)
    .map((part) => parseStringLiteral(part, { file, line: 1 }));

  return { devTools, devKeywordPrefix: prefix, devKeywordParam: paramName };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. the tool/permission table and default contract, read from types.ts
// ─────────────────────────────────────────────────────────────────────────────

function readToolTable(typesSource, file) {
  const arrayMatch = typesSource.match(/export const AGENT_TOOLS:\s*AgentToolDefinition\[\]\s*=\s*\[/);
  if (!arrayMatch) throw new ParseError(file, 1, 'could not find `AGENT_TOOLS` in types.ts');
  const openIndex = arrayMatch.index + arrayMatch[0].length - 1;
  const closeIndex = matchBracket(typesSource, openIndex);
  const body = typesSource.slice(openIndex + 1, closeIndex);

  const entryRe = /\{\s*id:\s*'([a-z_]+)',\s*label:\s*'((?:[^'\\]|\\.)*)',\s*description:\s*'((?:[^'\\]|\\.)*)',\s*permissions:\s*\[([^\]]*)\]\s*\}/g;
  const tools = [];
  let match = entryRe.exec(body);
  while (match) {
    tools.push({
      id: match[1],
      label: unescapeLiteral(match[2]),
      description: unescapeLiteral(match[3]),
      permissions: splitTopLevel(match[4])
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => parseStringLiteral(part, { file, line: 1 })),
    });
    match = entryRe.exec(body);
  }
  if (tools.length === 0) throw new ParseError(file, 1, 'parsed zero AGENT_TOOLS entries');
  const ids = new Set(tools.map((t) => t.id));
  if (ids.size !== tools.length) throw new ParseError(file, 1, 'duplicate tool ids in AGENT_TOOLS');
  return tools;
}

function readDefaultContract(typesSource, file) {
  const marker = typesSource.indexOf('export const DEFAULT_CONTRACT');
  if (marker < 0) throw new ParseError(file, 1, 'could not find `DEFAULT_CONTRACT` in types.ts');
  const braceIndex = typesSource.indexOf('{', marker);
  const closeIndex = matchBracket(typesSource, braceIndex);
  const body = typesSource.slice(braceIndex + 1, closeIndex);
  const props = parseObjectBody(body, { file, line: 1 });
  return props;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. value parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArrayLiteral(raw, ctx) {
  const text = raw.trim();
  if (!text.startsWith('[') || !text.endsWith(']')) {
    throw new ParseError(ctx.file, ctx.line, `expected an array literal, found: ${shorten(text)}`);
  }
  const inner = text.slice(1, -1).trim();
  if (!inner) return [];
  return splitTopLevel(inner).map((part) => {
    const item = part.trim();
    if (!item) throw new ParseError(ctx.file, ctx.line, 'empty array item');
    if (item.startsWith('...')) {
      throw new ParseError(ctx.file, ctx.line, `spread in array literal is not supported: ${shorten(item)}`);
    }
    return parseStringLiteral(item, ctx);
  });
}

function parseValue(raw, ctx, seedConstants) {
  const text = raw.trim();
  if (!text) throw new ParseError(ctx.file, ctx.line, 'empty value');
  if (text.startsWith('[')) return { kind: 'array', value: parseArrayLiteral(text, ctx) };
  if (text.startsWith("'") || text.startsWith('"')) {
    return { kind: 'string', value: parseStringLiteral(text, ctx) };
  }
  if (/^-?\d[\d_]*$/.test(text)) return { kind: 'number', value: Number(text.replace(/_/g, '')) };
  if (text === 'true') return { kind: 'boolean', value: true };
  if (text === 'false') return { kind: 'boolean', value: false };
  if (text === 'DEV_TOOLS') return { kind: 'array', value: [...seedConstants.devTools] };

  const devKeywords = text.match(/^DEV_KEYWORDS\s*\(([\s\S]*)\)$/);
  if (devKeywords) {
    const inner = devKeywords[1].trim();
    const extra = inner.startsWith('[') ? parseArrayLiteral(inner, ctx) : [];
    return { kind: 'array', value: [...seedConstants.devKeywordPrefix, ...extra] };
  }
  throw new ParseError(ctx.file, ctx.line, `unsupported expression: ${shorten(text)}`);
}

function parseObjectBody(body, ctx) {
  const props = new Map();
  const parts = splitTopLevel(body);
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    if (text.startsWith('...')) {
      throw new ParseError(ctx.file, ctx.line, `spread in options is not supported: ${shorten(text)}`);
    }
    const colon = text.indexOf(':');
    if (colon < 0) throw new ParseError(ctx.file, ctx.line, `expected \`key: value\`, found: ${shorten(text)}`);
    const key = text.slice(0, colon).trim();
    if (!/^[A-Za-z_$][\w$]*$/.test(key)) {
      throw new ParseError(ctx.file, ctx.line, `unsupported key: ${shorten(key)}`);
    }
    if (props.has(key)) throw new ParseError(ctx.file, ctx.line, `duplicate option \`${key}\``);
    props.set(key, text.slice(colon + 1));
  }
  return props;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. `ag(...)` extraction
// ─────────────────────────────────────────────────────────────────────────────

function parseAgentFile({ file, exportName }, seedConstants, toolTable, defaults) {
  const path = join(AGENT_DIR, file);
  const source = readFileSync(path, 'utf8');
  const hash = createHash('sha256').update(source, 'utf8').digest('hex');
  const { code, stringSpans } = scanSource(source);

  const exportRe = new RegExp(`export const ${exportName}\\s*:[^=]*=\\s*\\[`);
  const exportMatch = exportRe.exec(code);
  if (!exportMatch) throw new ParseError(file, 1, `could not find \`export const ${exportName}\``);
  const arrayOpen = exportMatch.index + exportMatch[0].length - 1;
  const arrayClose = matchBracket(code, arrayOpen);

  const callRe = /\bag\s*\(/g;
  const records = [];
  let match = callRe.exec(code);
  while (match) {
    const callStart = match.index;
    const openIndex = callStart + match[0].length - 1;
    if (inAnySpan(callStart, stringSpans)) { match = callRe.exec(code); continue; }
    if (callStart < arrayOpen || callStart > arrayClose) {
      throw new ParseError(file, lineOf(code, callStart), '`ag(` call outside the export array');
    }
    const closeIndex = matchBracket(code, openIndex);
    const line = lineOf(code, callStart);
    const inner = code.slice(openIndex + 1, closeIndex);
    const rawArgs = splitTopLevel(inner).map((part) => part.trim());
    if (rawArgs.length !== 5) {
      throw new ParseError(file, line, `\`ag()\` takes 4 positional arguments plus options; found ${rawArgs.length} argument(s)`);
    }
    const ctx = { file, line };
    const id = parseStringLiteral(rawArgs[0], ctx);
    const name = parseStringLiteral(rawArgs[1], ctx);
    const category = parseStringLiteral(rawArgs[2], ctx);
    const description = parseStringLiteral(rawArgs[3], ctx);

    const optsRaw = rawArgs[4];
    if (!optsRaw.startsWith('{') || !optsRaw.endsWith('}')) {
      throw new ParseError(file, line, `options must be an object literal, found: ${shorten(optsRaw)}`);
    }
    const optProps = parseObjectBody(optsRaw.slice(1, -1), ctx);
    const opts = {};
    const declared = { tools: false, permissions: false, risk: false, privacy: false, keywords: false, model: false };
    for (const [key, raw] of optProps) {
      if (!SEED_KEYS.has(key)) {
        throw new ParseError(file, line, `unknown agent option \`${key}\` — add it to SEED_KEYS deliberately`);
      }
      const value = parseValue(raw, ctx, seedConstants);
      opts[key] = value.value;
      if (key in declared) declared[key] = true;
    }

    // Shape validation — a record that parses but is wrong is still a failure.
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new ParseError(file, line, `invalid agent id: ${shorten(id)}`);
    if (!name.trim()) throw new ParseError(file, line, `agent ${id} has an empty name`);
    if (!/^[A-R]$/.test(category)) throw new ParseError(file, line, `agent ${id} has invalid category: ${category}`);
    if (!description.trim()) throw new ParseError(file, line, `agent ${id} has an empty description`);

    const tools = opts.tools ?? [];
    const toolIds = new Set(toolTable.map((t) => t.id));
    for (const tool of tools) {
      if (!toolIds.has(tool)) throw new ParseError(file, line, `agent ${id} declares unknown tool: ${tool}`);
    }
    if (opts.risk !== undefined && !RISK_CLASSES.includes(opts.risk)) {
      throw new ParseError(file, line, `agent ${id} has unknown risk: ${opts.risk}`);
    }
    if (opts.privacy !== undefined && !PRIVACY_CLASSES.includes(opts.privacy)) {
      throw new ParseError(file, line, `agent ${id} has unknown privacy: ${opts.privacy}`);
    }
    if (opts.model !== undefined && !MODEL_IDS.includes(opts.model)) {
      throw new ParseError(file, line, `agent ${id} has unknown model: ${opts.model}`);
    }
    const keywords = opts.keywords ?? [];
    if (new Set(keywords).size !== keywords.length) {
      // A data defect, not a parse failure: `src/lib/agents/` is read-only in this
      // part, so it is recorded and reported rather than thrown.
      anomalies.push({
        kind: 'duplicate-keyword-in-record',
        agentId: id,
        file,
        line,
        keywords,
      });
    }

    records.push({
      id,
      name,
      category,
      description,
      tools: [...tools],
      permissions: [...(opts.permissions ?? inferPermissions(tools, toolTable))],
      risk: opts.risk ?? defaults.risk,
      privacy: opts.privacy ?? defaults.privacy,
      keywords: [...keywords],
      model: opts.model ?? defaults.model,
      timeoutMs: opts.timeoutMs ?? defaults.timeoutMs,
      retries: opts.retries ?? defaults.retries,
      declared,
      source: { file, line },
    });
    match = callRe.exec(code);
  }

  if (records.length === 0) throw new ParseError(file, 1, `parsed zero agents from ${file}`);
  return { file, exportName, hash, bytes: Buffer.byteLength(source, 'utf8'), lines: source.split('\n').length, records };
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text.charCodeAt(i) === 10) line += 1;
  return line;
}

/** Mirror of `inferPermissions()` in factory.ts. */
function inferPermissions(tools, toolTable) {
  const byId = new Map(toolTable.map((t) => [t.id, t]));
  const perms = new Set();
  for (const tool of tools) {
    const def = byId.get(tool);
    if (def) def.permissions.forEach((p) => perms.add(p));
  }
  if (perms.size === 0) perms.add('compute');
  return Array.from(new Set(['compute', ...Array.from(perms)]));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. routing reachability — a faithful re-implementation of router.ts
// ─────────────────────────────────────────────────────────────────────────────

function cleanToken(word) {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F]+/g, ' ')
    .trim();
}

/**
 * Exactly `INDEX` in router.ts: name words, purpose words, keywords. A set, so
 * duplicates collapse. Entries of length <= 1 are dropped.
 */
function routerWords(agent) {
  const words = new Set();
  const add = (word) => {
    const cleaned = cleanToken(word);
    if (cleaned.length > 1) words.add(cleaned);
  };
  agent.name.toLowerCase().split(/\s+/).forEach(add);
  agent.description.toLowerCase().split(/\s+/).forEach(add);
  agent.keywords.forEach(add);
  return words;
}

const wordWeight = (word) => (word.includes(' ') ? 3 : word.length >= 5 ? 2 : 1);

function scoreInput(input, words) {
  const matched = [];
  let total = 0;
  for (const word of words) {
    if (input.includes(word)) {
      matched.push(word);
      total += wordWeight(word);
    }
  }
  return { matched, total };
}

function routeOnce(input, index) {
  let best = null;
  for (const entry of index) {
    const { total, matched } = scoreInput(input, entry.words);
    if (total > 0 && (!best || total > best.total)) {
      best = { id: entry.id, total, matched };
    }
  }
  return best ?? { id: 'intent', total: 0, matched: [] };
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'with', 'for', 'in', 'on', 'it', 'is', 'that', 'this', 'your', 'my', 'its', 'their', 'or', 'as', 'by', 'from']);

function contentTokens(text) {
  return new Set(
    cleanToken(text).split(' ').filter((t) => t.length > 2 && !STOPWORDS.has(t))
  );
}

function jaccard(a, b) {
  let shared = 0;
  for (const t of a) if (b.has(t)) shared += 1;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const factorySource = readFileSync(join(AGENT_DIR, 'factory.ts'), 'utf8');
  const typesSource = readFileSync(join(AGENT_DIR, 'types.ts'), 'utf8');
  const seedConstants = readSeedConstants(factorySource, 'factory.ts');
  const toolTable = readToolTable(typesSource, 'types.ts');
  const defaultsRaw = readDefaultContract(typesSource, 'types.ts');

  const defaults = {
    risk: defaultsRaw.has('risk') ? parseStringLiteral(defaultsRaw.get('risk'), { file: 'types.ts', line: 1 }) : 'low',
    privacy: defaultsRaw.has('privacy') ? parseStringLiteral(defaultsRaw.get('privacy'), { file: 'types.ts', line: 1 }) : 'private',
    model: defaultsRaw.has('model') ? parseStringLiteral(defaultsRaw.get('model'), { file: 'types.ts', line: 1 }) : 'GPT_4O_MINI',
    timeoutMs: defaultsRaw.has('timeoutMs') ? Number(defaultsRaw.get('timeoutMs')) : 30000,
    retries: defaultsRaw.has('retries') ? Number(defaultsRaw.get('retries')) : 2,
  };

  const files = SOURCE_FILES.map((spec) => parseAgentFile(spec, seedConstants, toolTable, defaults));
  const all = files.flatMap((f) => f.records);

  // ---- integrity gates -----------------------------------------------------
  const seen = new Map();
  const duplicateIds = [];
  for (const record of all) {
    if (seen.has(record.id)) {
      duplicateIds.push(`${record.id} (${seen.get(record.id)} + ${record.source.file}:${record.source.line})`);
    } else {
      seen.set(record.id, `${record.source.file}:${record.source.line}`);
    }
  }
  if (duplicateIds.length) {
    throw new Error(`duplicate agent ids: ${duplicateIds.join(', ')}`);
  }
  if (all.length !== EXPECTED_TOTAL && !ALLOW_COUNT_CHANGE) {
    throw new Error(
      `parsed ${all.length} agents, expected ${EXPECTED_TOTAL}. ` +
      'If the registry changed on purpose, re-run with --allow-count-change.'
    );
  }

  // ---- routing analysis ----------------------------------------------------
  const index = all.map((a) => ({ id: a.id, words: routerWords(a) }));

  // Probe corpus: every distinct router token as a standalone input, plus each
  // agent's own maximal input (all of its words at once). Deterministic, derived
  // only from the registry, and identical on every run.
  const probes = new Set();
  for (const entry of index) for (const word of entry.words) probes.add(word);
  for (const entry of index) probes.add([...entry.words].sort().join(' '));

  const winners = new Map();
  for (const probe of probes) {
    const decision = routeOnce(probe, index);
    if (decision.total > 0 && !winners.has(decision.id)) winners.set(decision.id, probe);
  }

  // Rigorous upper bound: if another agent's word set is a superset of this one,
  // no input can make this agent strictly outrank it, and ties go to the earlier
  // registry entry. Such an agent is provably unreachable by this router.
  const dominatedBy = new Map();
  for (let i = 0; i < index.length; i += 1) {
    const candidate = index[i];
    for (let j = 0; j < i; j += 1) {
      const earlier = index[j];
      if (candidate.words.size > earlier.words.size) continue;
      let subset = true;
      for (const word of candidate.words) {
        if (!earlier.words.has(word)) { subset = false; break; }
      }
      if (subset) { dominatedBy.set(candidate.id, earlier.id); break; }
    }
  }

  const reachable = [];
  const unreachable = [];
  for (const entry of index) {
    if (winners.has(entry.id)) reachable.push(entry.id);
    else unreachable.push({ id: entry.id, dominatedBy: dominatedBy.get(entry.id) ?? null, witnessedBy: null });
  }
  const undetermined = unreachable.filter((u) => !u.dominatedBy);

  // The most favourable realistic case: the user types the agent's own declared
  // trigger phrase, verbatim. Any agent that cannot win even here has no route from
  // real language, only from a synthetic probe.
  const triggerWinners = new Map();
  for (const agent of all) {
    for (const keyword of agent.keywords) {
      const decision = routeOnce(keyword, index);
      if (decision.id === agent.id) {
        if (!triggerWinners.has(agent.id)) triggerWinners.set(agent.id, keyword);
      }
    }
  }
  const triggerUnreachable = all
    .filter((agent) => !triggerWinners.has(agent.id))
    .map((agent) => ({ id: agent.id, bestTrigger: null, losesTo: routeOnce(agent.keywords[0] ?? agent.name, index).id }));

  // Canonical probes, cross-checked against the (unrunnable) vitest expectations
  // in src/lib/__tests__/registry.test.ts.
  const canonicalInputs = [
    'what are prayer times in London?',
    'implement the new feature end to end and add tests to the frontend and backend',
    'zzzzqqqq',
  ];
  const collisionInputs = [
    'agent',
    'help me plan my day',
    'write code for my app',
    'find the latest news and verify the facts',
  ];
  const collisionProbes = collisionInputs.map((input) => {
    const scores = index.map((entry) => ({ id: entry.id, total: scoreInput(input, entry.words).total }));
    const matched = scores.filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);
    const decision = routeOnce(input, index);
    return {
      input,
      matchingAgents: matched.length,
      winner: decision.id,
      winnerScore: decision.total,
      runnerUp: matched.find((entry) => entry.id !== decision.id)?.id ?? null,
      runnerUpScore: matched.find((entry) => entry.id !== decision.id)?.total ?? 0,
    };
  });
  const canonical = canonicalInputs.map((input) => ({ input, decision: routeOnce(input, index) }));

  // ---- reporting -----------------------------------------------------------
  const byCategory = {};
  const byRisk = {};
  const byDeclaredRisk = {};
  const byTool = {};
  for (const a of all) {
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    byRisk[a.risk] = (byRisk[a.risk] ?? 0) + 1;
    if (a.declared.risk) byDeclaredRisk[a.risk] = (byDeclaredRisk[a.risk] ?? 0) + 1;
    for (const t of a.tools) byTool[t] = (byTool[t] ?? 0) + 1;
  }

  const keywordOwners = new Map();
  for (const a of all) {
    for (const k of a.keywords) {
      if (!keywordOwners.has(k)) keywordOwners.set(k, []);
      keywordOwners.get(k).push(a.id);
    }
  }
  const sharedKeywords = [...keywordOwners.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));

  // Near-duplicate descriptions: Jaccard over content tokens, threshold disclosed.
  const DUPLICATE_THRESHOLD = 0.5;
  const tokenSets = new Map(all.map((a) => [a.id, contentTokens(a.description)]));
  const nearPairs = [];
  for (let i = 0; i < all.length; i += 1) {
    for (let j = i + 1; j < all.length; j += 1) {
      const score = jaccard(tokenSets.get(all[i].id), tokenSets.get(all[j].id));
      if (score >= 0.3) nearPairs.push({ a: all[i].id, b: all[j].id, score: Number(score.toFixed(3)) });
    }
  }
  nearPairs.sort((x, y) => y.score - x.score || (x.a < y.a ? -1 : 1));

  const parent = new Map(all.map((a) => [a.id, a.id]));
  const find = (id) => (parent.get(id) === id ? id : (parent.set(id, find(parent.get(id))), parent.get(id)));
  for (const pair of nearPairs) {
    if (pair.score < DUPLICATE_THRESHOLD) continue;
    const ra = find(pair.a);
    const rb = find(pair.b);
    if (ra !== rb) parent.set(ra, rb);
  }
  const clusterMap = new Map();
  for (const a of all) {
    const root = find(a.id);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root).push(a.id);
  }
  const duplicateClusters = [...clusterMap.values()].filter((ids) => ids.length > 1);

  const tightPairs = (threshold) => nearPairs.filter((p) => p.score >= threshold);

  const idPrefixFamilies = new Map();
  for (const a of all) {
    const prefix = a.id.split('-')[0];
    if (!idPrefixFamilies.has(prefix)) idPrefixFamilies.set(prefix, []);
    idPrefixFamilies.get(prefix).push(a.id);
  }
  const prefixFamilies = [...idPrefixFamilies.entries()].filter(([, ids]) => ids.length > 1);

  const snapshot = {
    metadata: {
      generator: 'scripts/snapshot-agents.mjs',
      description: 'Every ag() record in src/lib/agents/data-*.ts, parsed from text.',
      registryOrder: SOURCE_FILES.map((f) => f.file),
      totals: { agents: all.length, tools: toolTable.length },
      files: files.map((f) => ({
        file: `src/lib/agents/${f.file}`,
        exportName: f.exportName,
        sha256: f.hash,
        bytes: f.bytes,
        lines: f.lines,
        agents: f.records.length,
        firstLine: Math.min(...f.records.map((r) => r.source.line)),
        lastLine: Math.max(...f.records.map((r) => r.source.line)),
      })),
      toolTable,
    },
    router: {
      algorithm: 'router.ts routeRequest(): score = sum of weights (phrase 3, token length>=5 2, else 1) for every index word that is a substring of the lowercased input; highest total wins, ties to registry order; fallback id "intent".',
      probeCorpus: { distinctTokens: probes.size, definition: 'every distinct index token as a standalone input, plus each agent\'s full sorted word set as one input' },
      reachableByConstruction: reachable.length,
      unreachable: unreachable.map((u) => ({ id: u.id, dominatedBy: u.dominatedBy })),
      undetermined: undetermined.map((u) => u.id),
      reachableOnOwnTrigger: triggerWinners.size,
      notReachableOnOwnTrigger: triggerUnreachable,
      collisionProbes,
      canonicalProbes: canonical,
    },
    analysis: {
      byCategory,
      byRisk,
      byDeclaredRisk,
      byTool,
      withTools: all.filter((a) => a.tools.length > 0).length,
      withPermissions: all.filter((a) => a.declared.permissions).length,
      withPermissionsEffective: all.filter((a) => a.permissions.length > 0).length,
      withDeclaredRisk: all.filter((a) => a.declared.risk).length,
      withNoKeywords: all.filter((a) => a.keywords.length === 0).length,
      withoutTools: all.filter((a) => a.tools.length === 0).map((a) => a.id),
      sharedKeywords: sharedKeywords.map(([keyword, ids]) => ({ keyword, ids })),
      duplicateThreshold: DUPLICATE_THRESHOLD,
      duplicateClusters,
      nearPairsAtOrAbove: {
        '0.7': tightPairs(0.7).length,
        '0.6': tightPairs(0.6).length,
        '0.5': tightPairs(0.5).length,
        '0.4': tightPairs(0.4).length,
        '0.3': tightPairs(0.3).length,
      },
      strongestPairs: nearPairs.slice(0, 20),
      idPrefixFamilies: prefixFamilies.map(([prefix, ids]) => ({ prefix, ids })),
      anomalies,
    },
    agents: all,
  };

  // ---- console report ------------------------------------------------------
  const lines = [];
  const say = (line = '') => lines.push(line);
  say('=== AGENT SNAPSHOT ===');
  for (const f of files) {
    say(`${f.file.padEnd(20)} ${String(f.records.length).padStart(3)} agents  sha256=${f.hash.slice(0, 16)}…  ${f.lines} lines`);
  }
  say(`TOTAL                 ${String(all.length).padStart(3)} agents  (expected ${EXPECTED_TOTAL})`);
  say('');
  say('By category:');
  say('  ' + Object.keys(byCategory).sort().map((c) => `${c}=${byCategory[c]}`).join(' '));
  say('');
  say(`By risk (effective): ${Object.entries(byRisk).sort().map(([r, n]) => `${r}=${n}`).join(' ')}`);
  say(`By risk (declared):  ${Object.entries(byDeclaredRisk).sort().map(([r, n]) => `${r}=${n}`).join(' ')}  (${all.filter((a) => a.declared.risk).length} agents declare a risk; the rest inherit the factory default)`);
  say('');
  say(`Agents with tools:        ${all.filter((a) => a.tools.length > 0).length}/${all.length}`);
  say(`Agents with permissions:  ${all.filter((a) => a.declared.permissions).length} declared, ${all.filter((a) => a.permissions.length > 0).length} effective (factory infers from tools)`);
  say(`Agents with no keywords:  ${all.filter((a) => a.keywords.length === 0).length}`);
  if (anomalies.length) {
    say(`Data anomalies:           ${anomalies.length}`);
    for (const a of anomalies) say(`  ${a.kind}: ${a.agentId} (${a.file}:${a.line}) ${JSON.stringify(a.keywords)}`);
  }
  say('');
  say('Tool usage:');
  for (const def of toolTable) {
    say(`  ${def.id.padEnd(14)} ${String(byTool[def.id] ?? 0).padStart(3)}  [${def.permissions.join(',')}]`);
  }
  for (const [tool, count] of Object.entries(byTool).sort()) {
    if (!toolTable.some((d) => d.id === tool)) say(`  ${tool.padEnd(14)} ${String(count).padStart(3)}  UNKNOWN TOOL`);
  }
  say('');
  say(`Duplicate keywords (shared by >1 agent): ${sharedKeywords.length}`);
  for (const [keyword, ids] of sharedKeywords.slice(0, 12)) {
    say(`  "${keyword}" -> ${ids.length}: ${ids.join(', ')}`);
  }
  say('');
  say(`Near-duplicate descriptions (Jaccard >= ${DUPLICATE_THRESHOLD} on content tokens): ${duplicateClusters.length} cluster(s), ${duplicateClusters.reduce((n, c) => n + c.length, 0)} agents`);
  for (const cluster of duplicateClusters) {
    say(`  [${cluster.length}] ${cluster.join(' | ')}`);
  }
  for (const pair of nearPairs.slice(0, 8)) {
    say(`  ${pair.score.toFixed(3)}  ${pair.a} ~ ${pair.b}`);
  }
  say('');
  say(`ID prefix families: ${prefixFamilies.length}`);
  for (const [prefix, ids] of prefixFamilies.sort((a, b) => b[1].length - a[1].length).slice(0, 10)) {
    say(`  ${prefix}-* ${ids.length}: ${ids.join(', ')}`);
  }
  say('');
  say(`Router reachability (probe corpus of ${probes.size} inputs):`);
  say(`  reachable by construction:  ${reachable.length}/${all.length}`);
  say(`  reachable on own trigger:   ${triggerWinners.size}/${all.length}  (user types the agent's own keyword verbatim)`);
  for (const u of triggerUnreachable) {
    say(`    NOT REACHABLE EVEN ON ITS OWN KEYWORDS: ${u.id} (loses to ${u.losesTo})`);
  }
  say(`  not demonstrated:           ${unreachable.length}`);
  say(`    dominated (provable):     ${unreachable.filter((u) => u.dominatedBy).length}`);
  say(`    undetermined:             ${undetermined.length}`);
  for (const u of unreachable) {
    say(`    ${u.id}  ${u.dominatedBy ? `dominated by ${u.dominatedBy}` : 'NOT DOMINATED — needs manual review'}`);
  }
  for (const probe of canonical) {
    say(`  probe "${probe.input}" -> ${probe.decision.id} (score ${probe.decision.total})`);
  }
  say('  collision width (agents matching the same input):');
  for (const probe of collisionProbes) {
    say(`    "${probe.input}" -> ${probe.matchingAgents} agents match; ${probe.winner} wins ${probe.winnerScore} vs ${probe.runnerUp} ${probe.runnerUpScore}`);
  }

  const report = lines.join('\n');
  console.log(report);

  // ---- output --------------------------------------------------------------
  if (CHECK_ONLY) {
    if (!existsSync(OUT_FILE)) {
      console.error(`\n--check: ${OUT_FILE} does not exist`);
      process.exit(1);
    }
    const existing = readFileSync(OUT_FILE, 'utf8');
    const next = JSON.stringify(snapshot, null, 2) + '\n';
    if (existing !== next) {
      console.error(`\n--check: ${OUT_FILE} is stale; re-run without --check`);
      process.exit(1);
    }
    console.error(`\n--check: ${OUT_FILE} is current`);
    return;
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.error(`\nwrote ${OUT_FILE}`);
  console.error(`agents=${all.length} reachable=${reachable.length} duplicateClusters=${duplicateClusters.length}`);
}

try {
  main();
} catch (error) {
  console.error(`\nSNAPSHOT FAILED: ${error.message}`);
  process.exit(1);
}
