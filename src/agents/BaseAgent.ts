We need answer only JSON code block with write_file. Need complete file content. Need escape JSON. Need produce entire BaseAgent.ts. Need ensure no markdown outside? User says output only raw code but format requirement says wrap JSON in code block. We must obey format requirement. Final should be json ... only. Need include one write_file array. Need content string valid JSON. Need avoid double quotes in TS. Need complete file. Need not truncate. Need craft fully. Need include all code. Need ensure JSON valid. Need escape path backslashes. Need escape newlines as \n. Need no actual newline inside content string. Need avoid double quotes in content. Need maybe content includes backticks? Fine. Need ensure no double quotes. Let's design code carefully and then encode.

Need produce complete BaseAgent.ts with upgrades. We can include no imports? Might be okay. Need complete file content. Let's write TS code using only single quotes. Need avoid double quotes everywhere. Comments no double quotes. Strings single quotes. Need avoid double quotes in template? no templates. Need avoid backslashes. Need include maybe type definitions. Need ensure syntactically valid. Need not include " in content. Need no \" either because no quotes. But JSON content string has \n escapes. The final code block will have JSON array with content string containing \n. This is acceptable. Need no raw newlines inside content. But final answer can have line breaks outside JSON? The code block can contain array one line. Fine.

Need ensure content string doesn't contain unescaped backslash. We may write path only in JSON path, not content. Content no backslashes. Good.

Need include complete code. Need check TS for possible errors. Let's craft robust code. Need maybe include export type etc. Use AbortSignal built-in. Good.

Potential issue: private readonly circuit = new Map<string, CircuitBreakerState>(); okay.

Potential issue: protected readonly config: AgentConfigNormalized; with AgentConfigNormalized type. Good.

Potential issue: AgentContext<TInput> with emit?: (event: AgentStreamEvent) => void; references AgentStreamEvent declared later? We'll declare AgentStreamEvent before AgentContext. Need order. Let's order:

AgentStatus

AgentErrorShape

AgentError class

Logger etc

RateLimitConfig

Model types

MemoryStore

AgentDependencies

AgentConfig

AgentResult? Actually AgentResult uses AgentStatus, AgentErrorShape. Define before AgentStreamEvent. Then AgentStreamEvent uses AgentResult. Then AgentContext uses AgentStreamEvent. Good. AgentPlan etc. ToolDefinition uses AgentContext, so after AgentContext. Good.

Order:
export type AgentStatus...
export interface AgentErrorShape...
export class AgentError...
Logger, TelemetrySpan, Telemetry, RateLimitConfig, RateLimiter, ModelMessage, ModelRouteRequest, ModelRouteResponse, ModelRouter, MemoryStore, AgentDependencies, AgentConfig, AgentResult, AgentStreamEvent, AgentContext, AgentExecutionOptions, AgentPlanStep, AgentPlan, ToolDefinition, CircuitBreakerState, AgentConfigNormalized. Then class.

Need AgentResult uses AgentErrorShape. Good.

Need AgentStreamEvent uses AgentResult. Good.

Need AgentContext uses AgentStreamEvent. Good.

Need AgentDependencies uses ModelRouter etc. Good.

Need AgentConfigNormalized type. Good.

Need class constructor. Good.

Need methods. Need check this.config.rateLimit property: AgentConfigNormalized extends AgentConfig, so rateLimit optional. Good.

Need effectiveContext type. We can avoid explicit type to reduce errors:
const effectiveContext = { ...context, traceId, memory: context.memory ?? this.deps.memory, logger: context.logger ?? this.deps.logger, emit: context.emit ?? ((event: AgentStreamEvent) => this.emit(event)) };
Then effectiveContext.input is TInput. Good. But type inferred emit: ((event: AgentStreamEvent) => void). Good. memory: MemoryStore. logger: Logger. traceId: string. Good. It includes all context. Fine.

Need const timeoutPromise = new Promise<never>((_resolve, reject) => { ... }); okay. Need use it. In execute:
const executionPromise = this.withSpan(...);
const result = await Promise.race([executionPromise, timeoutPromise]) as AgentResult<TOutput>;
Need timeoutPromise rejects; if operation resolves first, timeout still pending but cleared in finally. Good. If timeout fires, abort and reject. Good. But Promise.race will reject, caught. Good. Need timeoutPromise used. Good.

Need ensure timeout abort affects signal if options.signal provided? No, but race rejects. Fine.

Need in execute, this.abortController = new AbortController(); If options.signal provided, signal is options.signal. Timeout aborts abortController but not signal; race rejects. Fine.

Need in catch, await this.onError(effectiveContext, agentError); If onError throws, it will escape catch? It would reject execute, not return result. Better wrap in try? Could do try { await this.onError(...); } catch (hookError) { this.deps.logger.error(...); }. Need robust. We'll implement.

Need afterExecute may throw; would be caught by catch and turn completed into failed? Actually afterExecute called before return inside try; if throws, catch returns failed. Okay.

Need effectiveContext.emit({ type: 'done', result, at: Date.now() }); result is AgentResult<TOutput>. Good.

Need stream while loop. Need ensure no hang if execution settles but wake never resolves? The promise execution.then sets settled and calls wake. Good. If execute throws? execute catches and returns result, so resolves. Good.

Need stream returns result. Good.

Need withRetry uses context parameter maybe unused? We can remove context param to avoid noUnused? Not necessarily. We can use context in logging. We'll include tenantId: context.tenantId in warn. Good.

Need withSpan uses span.setAttribute? Not used. Could set attributes? Fine.

Need callModel options. Good.

Need executeTool uses this.tools.get(toolName) as ToolDefinition<TArgs, TResult> | undefined. Good.

Need registerTool<TArgs = unknown, TResult = unknown>(tool: ToolDefinition<TArgs, TResult>): this { this.tools.set(tool.name, tool as ToolDefinition); ... } Good.

Need registerTools(tools: ToolDefinition[]): this good.

Need getState returns config: AgentConfig. Return { ...this.config } okay.

Need cancel reason default. Good.

Need newId uses Math.random. Good.

Need assertPermission context optional. Good.

Need toAgentError if error is Error. Good.

Need sleep with let timer. Good.

Need recordToolFailure telemetry. Good.

Need getCircuit existing state half-open? If open and reset elapsed sets half-open. On failure in half-open, failures >= threshold? It increments and opens again. On success closes. Good.

Need execute rate limit before plan. Good.

Need assertPermission('agent:execute', effectiveContext) after beforeExecute. Good.

Need validateInput called before beforeExecute. Good.

Need setStatus('running') emits status. Good.

Need if this.abortController null in cancel? Fine.

Need TypeScript issue: const timeoutPromise = new Promise<never>((_resolve, reject) => { timeoutHandle = setTimeout(() => { ... reject(new AgentError(...)); }, timeoutMs); }); reject type (reason?: any) => void; okay.

Need Promise.race([executionPromise, timeoutPromise]) as AgentResult<TOutput>; executionPromise is Promise<AgentResult<TOutput>>? Let's check withSpan returns Promise<T>. The callback returns this.withRetry(operation,...). operation returns Promise<{ status: AgentStatus; agentId: string; output: TOutput; durationMs: number; traceId: string }>. withRetry returns Promise<that>. So withSpan returns Promise<that>. Type inference T = { status: AgentStatus; agentId: string; output: TOutput; durationMs: number; traceId: string }. This is structurally AgentResult<TOutput> because status AgentStatus, output TOutput. Good. Cast okay.

Need this.setStatus(result.status); result.status is AgentStatus. Good.

Need await this.afterExecute(effectiveContext, result); result type AgentResult<TOutput>. Good.

Need catch returns AgentResult<TOutput> with status failed/cancelled. Good.

Need effectiveContext.emit({ type: 'error', error: agentError.message, at: Date.now() }); good.

Need stream queue. If event listener receives done and queue push. Good.

Need maybe this.listeners Set iteration. Good.

Need final JSON: [{"tool":"write_file","path":"C:\\Users\\DELL\\Documents\\hey\\src\\agents\\BaseAgent.ts","content":"...escaped..."}] Need JSON keys double quotes yes. Content string double quoted. Path has double backslashes. Need ensure content has no double quote. Good.

Need encode content as one line with \n. This will be long. Need ensure no accidental actual newline inside content string. In final, I can write entire array on one line. It will be very long but okay. Need ensure all newline escapes are \n two chars. Need not escape single quotes. Need avoid \ in content. We may use Array.from etc no backslash. Good.

Need verify content doesn't contain ". We'll use single quotes. Comments no double quotes. But typeof setTimeout no. '*' single quotes. Good.

Need ensure no double quotes in string literals like 'agent.execute'. Good.

Need potential TypeScript issue: AgentError class extends Error, but no Object.setPrototypeOf needed for ES2015. Fine.

Need potential TS issue: private readonly circuit = new Map<string, CircuitBreakerState>(); uses CircuitBreakerState declared before class. Good.

Need potential TS issue: protected readonly config: AgentConfigNormalized; type declared before class. Good.

Need potential TS issue: AgentConfigNormalized includes temperature: number; maxRetries: number; timeoutMs: number; memoryNamespace: string; tools: string[]; permissions: string[]; and AgentConfig has optional same. Intersection okay.

Need potential TS issue: this.config = { ...config, temperature: ..., maxRetries: ..., timeoutMs: ..., memoryNamespace: ..., tools: ..., permissions: ... }; rateLimit maybe undefined. Good.

Need potential TS issue: protected readonly tools = new Map<string, ToolDefinition>(); ToolDefinition default generics. Good.

Need potential TS issue: protected readonly listeners = new Set<(event: AgentStreamEvent) => void>(); good.

Need potential TS issue: this.tools.set(tool.name, tool as ToolDefinition); okay.

Need potential TS issue: const tool = this.tools.get(toolName) as ToolDefinition<TArgs, TResult> | undefined; okay.

Need potential TS issue: this.config.permissions.includes('*') permissions string[]. Good.

Need potential TS issue: context?.tenantId context type AgentContext. Good.

Need potential TS issue: const traceId = context.traceId ?? this.newId('trace'); good.

Need potential TS issue: const signal = options.signal ?? context.signal ?? this.abortController.signal; this.abortController just assigned non-null. Good.

Need potential TS issue: let timeoutHandle: ReturnType<typeof setTimeout> | undefined; good. In finally if (timeoutHandle) clearTimeout(timeoutHandle); okay.

Need potential TS issue: const executionPromise = this.withSpan(... async () => { ... return this.withRetry(...); }); The callback returns Promise<...>. Good.

Need potential TS issue: Promise.race([executionPromise, timeoutPromise]) as AgentResult<TOutput> okay.

Need potential TS issue: effectiveContext.emit is defined. Good.

Need potential TS issue: async *stream... uses yield event; event type AgentStreamEvent. Good.

Need potential TS issue: const result = await execution; return result; in async generator, return type AgentResult<TOutput>. Good.

Need potential TS issue: execution.then(() => { ... }).catch(() => { ... }); no await. Good. But if execution resolves, .then handler runs microtask; while loop may check settled false then await new Promise setting wake; then then runs and resolves. Good.

Need potential TS issue: let wake: (() => void) | null = null; then inside if (wake) { const current = wake; wake = null; current(); } TS may complain current possibly null? Since if (wake) narrows, assigning const current = wake should be function. Good.

Need potential TS issue: queue.shift(); if (event) yield event; Good.

Need maybe include export abstract class BaseAgent only. Good.

Need final content. Need produce JSON with content string. Since content is huge, I need be careful. I can formulate final with one line. Need no markdown except code block. The code block content should be JSON. It can be multi-line? The JSON array can be one line. If I include line breaks inside code block outside string, JSON parser okay? It can parse whitespace. But content string must not have raw newline. I can put array with content on one line. Let's produce one line. Need ensure all newlines in code represented as \n. I will manually encode. This is long but doable. Need avoid mistakes. I'll write content with \n at line breaks. Need ensure at end content string closed. Need ensure path backslashes. Need ensure no double quotes in content. Let's craft.

Need maybe not include too many comments. Use no comments. Good.

Let's write final JSON. Need include {"tool":"write_file","path":"C:\\Users\\DELL\\Documents\\hey\\src\\agents\\BaseAgent.ts","content":"..."}. Since path in JSON, backslashes escaped. Good.

Now craft content string. I must include all code. I'll encode newlines as \n. Need no actual newline in content. In final answer, I can have the code block with one line. It will be very long. Need ensure I don't accidentally put actual newline inside string. I'll write continuous. Need track quotes. Content string starts after "content":" and ends before "}]. No double quotes inside. Good.

Let's assemble code with \n. I'll write here first mentally then final. Need be exact.

Content:
export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';\n\nexport interface AgentErrorShape {\n code: string;\n message: string;\n retryable: boolean;\n details?: unknown;\n}\n\nexport class AgentError extends Error {\n public readonly code: string;\n public readonly retryable: boolean;\n public readonly details?: unknown;\n\n constructor(code: string, message: string, retryable = false, details?: unknown) {\n super(message);\n this.name = 'AgentError';\n this.code = code;\n this.retryable = retryable;\n this.details = details;\n }\n}\n\n... etc.

Need ensure no double quotes. Good.

Need include 
Record
<string, unknown>
 no quotes. Good.

Need include 
Promise