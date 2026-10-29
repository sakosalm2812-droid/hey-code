import { prisma } from '@/lib/prisma';
import { searchMemories, createMemory } from '@/lib/memory';
import type { AgentToolId, AgentPermission } from '@/lib/agents';
import { canUsePermission, hasChatProvider } from '@/lib/agents';
import { searchFiles, listFiles, listProjects } from '@/lib/files';
import { getPlanner } from '@/lib/tasks';
import { listHabits, listJournalEntries } from '@/lib/life';
import { searchWeb, fetchUrlText, WebSetupRequiredError } from '@/lib/web';
import { generateImage, isImageGenerationConfigured } from '@/lib/image';
import { completeWithFailover } from '@/lib/provider-router';
import type { ProviderMessage } from '@/lib/providers';
import type { ModelId } from '@/lib/ai';
import { computePrayerTimes, resolvePrayerLocation, PRAYER_LOCATIONS } from '@/lib/prayer';
import { computeHijriDate } from '@/lib/hijri';

export interface ToolCall {
  toolId: AgentToolId;
  input: Record<string, any>;
}

export interface ToolResult {
  toolId: AgentToolId;
  ok: boolean;
  output: string;
  requiresSetup?: boolean;
}

export function safeEvaluate(expression: string): { ok: boolean; result?: number; error?: string } {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: 'Empty expression' };
  if (!/^[0-9+\-*/().\s%^e]+$/.test(trimmed)) {
    return { ok: false, error: 'Calculator only accepts basic arithmetic (digits, + - * / ( ) . ^ %)' };
  }
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict"; return (${trimmed});`)();
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, error: 'Expression does not evaluate to a finite number' };
    }
    return { ok: true, result: value };
  } catch {
    return { ok: false, error: 'Could not evaluate expression' };
  }
}

async function runWebSearch(input: Record<string, any>): Promise<ToolResult> {
  const query = typeof input.query === 'string' ? input.query : '';
  if (!query) return { toolId: 'web_search', ok: false, output: 'web_search requires a "query" input.' };

  const limit = typeof input.limit === 'number' ? Math.min(Math.max(1, Math.floor(input.limit)), 8) : 5;
  try {
    const results = await searchWeb(query, limit);
    if (results.length === 0) {
      return { toolId: 'web_search', ok: true, output: `No web results for "${query}".` };
    }
    const lines = results.map(
      (r, i) => `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.snippet}`
    );
    return { toolId: 'web_search', ok: true, output: `Top ${results.length} results for "${query}":\n${lines.join('\n')}` };
  } catch (error) {
    if (error instanceof WebSetupRequiredError) {
      return {
        toolId: 'web_search',
        ok: false,
        output: 'Web search is not configured yet. Add a SERP_API_KEY to your .env file (see KEYS.md).',
        requiresSetup: true,
      };
    }
    return { toolId: 'web_search', ok: false, output: error instanceof Error ? error.message : 'Web search failed.' };
  }
}

async function runWebFetch(input: Record<string, any>): Promise<ToolResult> {
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  if (!/^https?:\/\//i.test(url)) {
    return { toolId: 'web_fetch', ok: false, output: 'web_fetch requires a valid http(s) "url" input.' };
  }
  try {
    const { title, text } = await fetchUrlText(url);
    const clipped = text.trim();
    if (!clipped) {
      return { toolId: 'web_fetch', ok: true, output: `[web_fetch] ${url} (${title}) — page returned no readable text.` };
    }
    return {
      toolId: 'web_fetch',
      ok: true,
      output: `[web_fetch] ${url} (${title})\n${clipped.slice(0, 4000)}`,
    };
  } catch (error) {
    return { toolId: 'web_fetch', ok: false, output: error instanceof Error ? error.message : 'Web fetch failed.' };
  }
}

async function runImageGenerate(input: Record<string, any>): Promise<ToolResult> {
  const prompt = typeof input.prompt === 'string' ? input.prompt : '';
  if (!prompt) return { toolId: 'image_generate', ok: false, output: 'image_generate requires a "prompt" input.' };
  if (!isImageGenerationConfigured()) {
    return {
      toolId: 'image_generate',
      ok: false,
      output: 'Image generation is not configured yet. Add an OPENAI_API_KEY to your .env file (see KEYS.md).',
      requiresSetup: true,
    };
  }
  try {
    const result = await generateImage({
      prompt,
      size: typeof input.size === 'string' && ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'].includes(input.size)
        ? (input.size as any)
        : '1024x1024',
      quality: input.quality === 'hd' ? 'hd' : 'standard',
      style: input.style === 'natural' ? 'natural' : 'vivid',
    });
    const revised = result.revisedPrompt ? `\nRevised prompt: ${result.revisedPrompt}` : '';
    return {
      toolId: 'image_generate',
      ok: true,
      output: `Generated image: ${result.url}${revised}`,
    };
  } catch (error) {
    return { toolId: 'image_generate', ok: false, output: error instanceof Error ? error.message : 'Image generation failed.' };
  }
}

async function runMemorySearch(userId: string, input: Record<string, any>): Promise<ToolResult> {
  const query = typeof input.query === 'string' ? input.query : '';
  if (!query) return { toolId: 'memory_search', ok: false, output: 'memory_search requires a "query" input.' };
  const memory = await searchMemories(userId, query, 5);
  const lines = memory.map((m) => `[${m.category || m.type}] ${m.content}`);
  return {
    toolId: 'memory_search',
    ok: true,
    output: lines.length
      ? `Memories found:\n${lines.join('\n')}`
      : 'No matching memories found.',
  };
}

async function runMemorySave(userId: string, input: Record<string, any>): Promise<ToolResult> {
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  if (!content) return { toolId: 'memory_save', ok: false, output: 'memory_save requires a "content" input.' };
  const category = typeof input.category === 'string' ? input.category : 'AGENT';
  await createMemory({ userId, type: 'FACT', content, category });
  return { toolId: 'memory_save', ok: true, output: 'Memory saved.' };
}

async function runFileSearch(userId: string, input: Record<string, any>): Promise<ToolResult> {
  const query = typeof input.query === 'string' ? input.query.trim() : '';
  if (!query) return { toolId: 'file_search', ok: false, output: 'file_search requires a "query" input.' };

  const [files, projects] = await Promise.all([
    searchFiles(userId, query, 8),
    listProjects(userId),
  ]);

  const lines = files.map((f) => `[${f.name}] (${f.mimeType}) ${f.summary ? `summary: ${f.summary}` : ''}`);
  const projectHits = projects
    .filter((p) => (p.name + ' ' + (p.description ?? '')).toLowerCase().includes(query.toLowerCase()))
    .map((p) => `project:${p.name}`);

  const output = [...lines, ...projectHits];
  return {
    toolId: 'file_search',
    ok: true,
    output: output.length ? `Files matching "${query}":\n${output.join('\n')}` : `No files found matching "${query}".`,
  };
}

async function runPlanner(userId: string): Promise<ToolResult> {
  const now = new Date();
  const [planner, habits, journal] = await Promise.all([
    getPlanner(userId, now),
    listHabits(userId),
    listJournalEntries(userId, { from: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() }),
  ]);

  const bestStreak = habits.reduce((best, h) => Math.max(best, h.streak), 0);
  const journalDays = journal.length;

  const parts: string[] = [];
  parts.push(`Overdue tasks (${planner.overdue.length}): ${planner.overdue.map((t: any) => t.title).join(', ') || 'none'}`);
  parts.push(`Due today (${planner.dueToday.length}): ${planner.dueToday.map((t: any) => t.title).join(', ') || 'none'}`);
  parts.push(`Completed today (${planner.completedToday.length}): ${planner.completedToday.map((t: any) => t.title).join(', ') || 'none'}`);
  parts.push(`${planner.summary.pending} open tasks total (${planner.summary.focus} high priority).`);
  parts.push(`Best habit streak: ${bestStreak} day${bestStreak === 1 ? '' : 's'}.`);
  parts.push(`Journal entries in the last 7 days: ${journalDays}.`);

  return { toolId: 'planner', ok: true, output: parts.join('\n') };
}

const TRANSLATION_TARGETS = ['english', 'kurdish', 'arabic', 'french', 'spanish', 'german', 'italian', 'portuguese', 'turkish', 'persian', 'dutch'];

async function llmComplete(system: string, user: string, maxTokens = 1024): Promise<string> {
  const messages: ProviderMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const result = await completeWithFailover(messages, 'GPT_4O_MINI' as ModelId, maxTokens);
  return result.content.trim();
}

async function runTranslate(input: Record<string, any>): Promise<ToolResult> {
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  const target = typeof input.target === 'string' && TRANSLATION_TARGETS.includes(input.target.toLowerCase())
    ? input.target.toLowerCase()
    : 'english';
  if (!text) return { toolId: 'translate', ok: false, output: 'translate requires a "text" input (and optional "target").' };
  if (!hasChatProvider()) {
    return {
      toolId: 'translate',
      ok: false,
      output: 'Translation needs a chat provider key. Add GROQ_API_KEY and/or GEMINI_API_KEY (see KEYS.md).',
      requiresSetup: true,
    };
  }
  try {
    const translated = await llmComplete(
      'You are a precise translator. Translate the user text into the requested language. Preserve tone and meaning. Output ONLY the translation, no quotes, no explanations.',
      `Language: ${target}\n\nText:\n${text.slice(0, 4000)}`
    );
    return { toolId: 'translate', ok: true, output: `[${target}] ${translated}` };
  } catch (error) {
    return { toolId: 'translate', ok: false, output: error instanceof Error ? error.message : 'Translation failed.' };
  }
}

function extractiveSummary(text: string, maxSentences = 3): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.slice(0, 280);
  return sentences.slice(0, maxSentences).join(' ').trim();
}

async function runSummarize(input: Record<string, any>): Promise<ToolResult> {
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text) return { toolId: 'summarize', ok: false, output: 'summarize requires a "text" input.' };
  if (!hasChatProvider()) {
    const fallback = extractiveSummary(text);
    return {
      toolId: 'summarize',
      ok: true,
      output: `[extractive summary — add GROQ_API_KEY/GEMINI_API_KEY for an LLM summary]\n${fallback}`,
    };
  }
  try {
    const summary = await llmComplete(
      'You are a concise summarizer. Capture the key points in 3-5 bullet lines. Output only the summary.',
      text.slice(0, 8000)
    );
    return { toolId: 'summarize', ok: true, output: summary };
  } catch (error) {
    return { toolId: 'summarize', ok: false, output: error instanceof Error ? error.message : 'Summarization failed.' };
  }
}

async function runPrayerTimes(input: Record<string, any>): Promise<ToolResult> {
  const location = typeof input.location === 'string' ? input.location : '';
  const coords = resolvePrayerLocation(location);
  if (Number.isNaN(coords.latitude)) {
    const cities = Object.keys(PRAYER_LOCATIONS).join(', ');
    return {
      toolId: 'prayer_times',
      ok: false,
      output: `Location not recognized. Known locations: ${cities}. Or provide input as { location, date? } with a known city.`,
    };
  }
  const methods = ['MWL', 'ISNA', 'EGYPT', 'MAKKAH', 'KARACHI', 'UMMA_AL_QURA', 'TEHRAN', 'JAFARI'] as const;
  const method = typeof input.method === 'string' && methods.includes(input.method as any)
    ? (input.method as 'MWL' | 'ISNA' | 'EGYPT' | 'MAKKAH' | 'KARACHI' | 'UMMA_AL_QURA' | 'TEHRAN' | 'JAFARI')
    : undefined;
  try {
    const result = computePrayerTimes({
      date: typeof input.date === 'string' ? input.date : undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: coords.timezone,
      method,
    });
    if (!result.valid) {
      return {
        toolId: 'prayer_times',
        ok: true,
        output: `Prayer times for ${location || `${result.latitude}, ${result.longitude}`} on ${result.date}: the sun does not reach the required angles (high-latitude day). Consider a high-latitude method.`,
      };
    }
    const lines = [
      `Prayer times for ${location || `${result.latitude}, ${result.longitude}`} on ${result.date}`,
      `  Fajr     ${result.fajr}`,
      `  Sunrise  ${result.sunrise}`,
      `  Dhuhr    ${result.dhuhr}`,
      `  Asr      ${result.asr}`,
      `  Maghrib  ${result.maghrib}`,
      `  Isha     ${result.isha}`,
      `Method: ${result.methodLabel}`,
    ];
    return { toolId: 'prayer_times', ok: true, output: lines.join('\n') };
  } catch (error) {
    return { toolId: 'prayer_times', ok: false, output: error instanceof Error ? error.message : 'Could not compute prayer times.' };
  }
}

async function runHijriDate(input: Record<string, any>): Promise<ToolResult> {
  try {
    const date = typeof input.date === 'string' && input.date ? input.date : undefined;
    const result = computeHijriDate(date);
    return {
      toolId: 'hijri_date',
      ok: true,
      output: `${result.weekday}, ${result.gregorian} is ${result.formatted} AH in the tabular (Umm al-Qura-aligned) Islamic calendar.`,
    };
  } catch (error) {
    return { toolId: 'hijri_date', ok: false, output: error instanceof Error ? error.message : 'Could not compute the Hijri date.' };
  }
}

export async function executeAgentTool(
  userId: string,
  call: ToolCall,
  permissions: AgentPermission[],
  agentId = 'general'
): Promise<ToolResult> {
  const startedAt = Date.now();

  const run = async (): Promise<ToolResult> => {
    switch (call.toolId) {
      case 'calculator': {
        const expression = typeof call.input.expression === 'string' ? call.input.expression : '';
        const evaluated = safeEvaluate(expression);
        return evaluated.ok
          ? { toolId: 'calculator', ok: true, output: `${expression} = ${evaluated.result}` }
          : { toolId: 'calculator', ok: false, output: evaluated.error || 'Calculator error' };
      }
      case 'current_time': {
        const message = `It is ${new Date().toISOString()} (UTC).`;
        return { toolId: 'current_time', ok: true, output: message };
      }
      case 'web_search':
        return runWebSearch(call.input);
      case 'web_fetch':
        return runWebFetch(call.input);
      case 'memory_search':
        return runMemorySearch(userId, call.input);
      case 'memory_save':
        return runMemorySave(userId, call.input);
      case 'file_search':
        return runFileSearch(userId, call.input);
      case 'planner':
        return runPlanner(userId);
      case 'image_generate':
        return runImageGenerate(call.input);
      case 'translate':
        return runTranslate(call.input);
      case 'summarize':
        return runSummarize(call.input);
      case 'prayer_times':
        return runPrayerTimes(call.input);
      case 'hijri_date':
        return runHijriDate(call.input);
      default:
        return { toolId: call.toolId, ok: false, output: `Unknown tool: ${call.toolId}` };
    }
  };

  const permissionRequiredByTool: Partial<Record<AgentToolId, AgentPermission>> = {
    web_search: 'web',
    web_fetch: 'web',
    memory_search: 'memory',
    memory_save: 'memory',
    calculator: 'compute',
    current_time: 'compute',
    image_generate: 'media',
    file_search: 'files',
    planner: 'data',
    translate: 'compute',
    summarize: 'compute',
    prayer_times: 'compute',
    hijri_date: 'compute',
  };

  const required = permissionRequiredByTool[call.toolId];
  if (required && !canUsePermission(permissions, required)) {
    const result: ToolResult = {
      toolId: call.toolId,
      ok: false,
      output: `Tool "${call.toolId}" requires the "${required}" permission, which the current agent does not have.`,
    };
    await logAgentRun(userId, call, result, startedAt, agentId);
    return result;
  }

  try {
    const result = await run();
    await logAgentRun(userId, call, result, startedAt, agentId);
    return result;
  } catch (error) {
    const result: ToolResult = {
      toolId: call.toolId,
      ok: false,
      output: error instanceof Error ? error.message : 'Tool execution failed',
    };
    await logAgentRun(userId, call, result, startedAt, agentId);
    return result;
  }
}

async function logAgentRun(
  userId: string,
  call: ToolCall,
  result: ToolResult,
  startedAt: number,
  agentId = 'general'
) {
  try {
    await prisma.agentRun.create({
      data: {
        userId,
        agentId,
        tool: call.toolId,
        input: call.input,
        output: result.output,
        ok: result.ok,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch {
    // Best-effort logging; never fail the tool call on it.
  }
}

export async function runAgentTools(
  userId: string,
  calls: ToolCall[],
  permissions: AgentPermission[],
  agentId = 'general'
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];
  for (const call of calls) {
    results.push(await executeAgentTool(userId, call, permissions, agentId));
  }
  return results;
}

export function formatToolResultsForPrompt(results: ToolResult[]): string {
  if (!results.length) return '';
  return results
    .map((r) => `[tool:${r.toolId}] (${r.ok ? 'ok' : 'error'}) ${r.output}`)
    .join('\n');
}