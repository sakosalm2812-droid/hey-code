We need answer user. Need parse. They gave format requirement file and current code. They want us as HEY Improver implement upgrades. Need output JSON tool call arrays wrapped in json code block. Need write_file for upgraded file. Need include entire file, no markdown? But format says wrap JSON in code block. User says "Output ONLY raw code. No markdown blocks." Conflict? The format requirement is critical: MUST wrap ALL JSON tool call arrays injson code block. The "Output ONLY the raw code. No markdown blocks" likely for file content? Hmm. We need follow format harness: output JSON tool call array in  code block. Inside content, output entire file code, not markdown blocks. We should not add extra prose. The final should be a JSON code block with one write_file tool call. Need escape content quotes and newlines. Need produce entire upgraded BaseAgent.ts. Need ensure valid JSON. We need write content as string with \n and escaped quotes. We need include code no markdown inside content. The file content can be TypeScript. Need decide path absolute with escaped backslashes: "C:\Users\DELL\Documents\hey\src\agents\BaseAgent.ts". In JSON, backslash must escape. We'll use double backslashes in JSON. Good.

Need craft upgraded file. We need be careful with JSON escaping. Content will be long. Need escape all double quotes as " and newlines as \n. Backslashes? We'll avoid. But path separate. Content may include backslash? Avoid. Use template literals? Backticks okay. No backslashes. Use no regex with backslash. Use \n? Inside content we might need newline escapes in JSON, not in code. The JSON string will contain actual escape sequence \n. We need write content as one JSON string with \n. We can include code line breaks as \n. Need escape all double quotes inside code. Single quotes fine. Backticks fine. Comments with double quotes need escape. Avoid double quotes in comments where possible. But code uses many double quotes. We'll escape.

Need build content carefully. Since final must be valid JSON. We can include a large JSON code block. Need ensure no unescaped newline inside string. The final code block can have actual newlines between JSON tokens? We'll output:

[{"tool":"write_file","path":"C:\\Users\\DELL\\Documents\\hey\\src\\agents\\BaseAgent.ts","content":"... \n ..."}]

The content string contains escaped \n sequences. We must not include literal newline inside the string. But we can format the JSON array with newlines outside strings. The content string will be one line with \n escapes. That's okay though long. Need ensure all double quotes in content escaped. We must avoid any unescaped double quote. We can use single quotes in code for strings to reduce escapes. But TypeScript interface property types no quotes. Use single quotes for string literals. Some object keys can be unquoted. Avoid double quotes entirely in code content where possible. That simplifies. Use single quotes for string literals. Comments can avoid quotes. Template literals with backticks fine. Use no double quotes. Great! Then content string only has no double quotes? It will have double quotes? The JSON content field is delimited by double quotes, so any double quote inside must escape. If code uses only single quotes and backticks, we can avoid escaping. But TypeScript may need double quotes? Not necessarily. We can use single quotes everywhere. Object keys can be identifiers. So content can have zero double quote characters. Then JSON string is easier. Need check comments: avoid double quotes. Use no double quotes. Good. We can also avoid backslashes. Use no regex. Great.

Need include code. Let's design complete BaseAgent.ts with abstract class. Need not import. Need ensure TypeScript valid enough. We'll include many interfaces and class. Need preserve existing interface? We can include exported interface BaseAgent? Current code is interface BaseAgent. But upgrade to class named BaseAgent. Could conflict if consumers import interface. But okay. We can also export a legacy interface? Hmm. The original file exports interface BaseAgent. If we change to abstract class BaseAgent, that's upgrade. Need maybe also export type AgentExecutor? We can include export interface BaseAgentContract? But file requested BaseAgent.ts. We'll implement abstract class BaseAgent. That changes public API; but directive says turn BaseAgent into full abstract base class. Good.

Need include lifecycle hooks: beforeExecute, afterExecute, onError, onCancel. Streaming: stream. Tool orchestration: registerTool, executeTool. Memory: uses MemoryStore. Retries: withRetry. Telemetry: withSpan. Permission guards: assertPermission. Model routing: callModel. Cancellation: AbortController and signal. Rate limiter. Circuit breaker? We can include simple. Event emitter. Validate. Need not too huge but comprehensive. Need compile? We can't run. Need make types coherent.

Let's write code content with single quotes. Need be careful TypeScript generics and AsyncGenerator. Use AsyncGenerator<AgentStreamEvent, AgentResult, void>. Need define AgentStreamEvent union. Need define AgentResult. Need define AgentContext. Need AgentDependencies. Need ToolDefinition. Need MemoryStore, Logger, Telemetry, Span, ModelRouter, RateLimiter. Need AgentPlan, AgentStep, AgentExecutionOptions. Need ToolCallRecord. Need AgentError. Need CircuitBreakerState.

Class properties:

protected readonly config: AgentConfig

protected readonly deps: AgentDependencies

protected status: AgentStatus = 'idle'

protected readonly tools = new Map<string, ToolDefinition>()

protected readonly listeners = new Set<(event: AgentStreamEvent) => void>()

protected abortController: AbortController | null = null

protected readonly startedAt = new Map<string, number>()? maybe not.

protected readonly circuit = new Map<string, CircuitBreakerState>()

private readonly retryDefaults = { maxRetries: 3, baseDelayMs: 100 }

Constructor:
constructor(config: AgentConfig, deps: AgentDependencies) {
this.config = { maxRetries: 3, timeoutMs: 60000, memoryNamespace: config.id, temperature: 0.2, ...config } as AgentConfig;
this.deps = deps;
for (const tool of config.tools ?? []) { /* tools are names; actual registration later */ }
}
Need config.tools required? AgentConfig has tools: string[]; permissions: string[]. We'll make optional? Better required. Use tools: string[]; permissions: string[];. In constructor, if missing? config.tools ?? [].

Register tools:
registerTool(tool: ToolDefinition): this { this.tools.set(tool.name, tool); return this; }
registerTools(tools: ToolDefinition[]): this { for ...; return this; }

Event:
on(listener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
protected emit(event: AgentStreamEvent): void { for (const listener of this.listeners) { try { listener(event); } catch (err) { this.deps.logger.error('Agent event listener failed', { error: String(err) }); } } }

Status:
protected setStatus(status: AgentStatus, context?: AgentContext): void { this.status = status; this.emit({ type: 'status', status, at: Date.now() }); }

Lifecycle hooks:
protected async beforeExecute(context: AgentContext): Promise<void> {}
protected async afterExecute(context: AgentContext, result: AgentResult): Promise<void> {}
protected async onError(context: AgentContext, error: AgentError): Promise<void> {}
protected async onCancel(context: AgentContext, reason: string): Promise<void> {}

Main execute:
async execute<TInput = unknown, TOutput = unknown>(context: AgentContext<TInput>, options: AgentExecutionOptions = {}): Promise<AgentResult<TOutput>> {
const started = Date.now();
const traceId = context.traceId || this.newId('trace');
const effectiveContext = { ...context, traceId, memory: context.memory ?? this.deps.memory, logger: context.logger ?? this.deps.logger, emit: context.emit ?? ((event) => this.emit(event)) };
this.abortController = new AbortController();
const signal = options.signal ?? context.signal ?? this.abortController.signal;
const timeoutMs = options.timeoutMs ?? this.config.timeoutMs ?? 60000;
let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
const timeoutPromise = new Promise<never>((_, reject) => { timeoutHandle = setTimeout(() => { this.abortController?.abort(); reject(new AgentError('AGENT_TIMEOUT', 'Agent execution timed out', true)); }, timeoutMs); });
try {
this.setStatus('running', effectiveContext);
await this.beforeExecute(effectiveContext);
this.assertPermission('agent:execute', effectiveContext);
const rateLimit = this.config.rateLimit;
if (rateLimit && this.deps.rateLimiter) {
const allowed = await this.deps.rateLimiter.check(effectiveContext.userId + ':' + this.config.id, rateLimit);
if (!allowed) throw new AgentError('RATE_LIMITED', 'Rate limit exceeded', true);
}
const span = this.deps.telemetry.startSpan('agent.execute', { agentId: this.config.id, traceId, tenantId: effectiveContext.tenantId });
let result: AgentResult<TOutput>;
try {
result = await this.withRetry(async () => {
const plan = await this.plan(effectiveContext);
const output = await this.act(plan, effectiveContext) as TOutput;
return { status: 'completed' as AgentStatus, agentId: this.config.id, output, durationMs: Date.now() - started, traceId };
}, options.maxRetries ?? this.config.maxRetries ?? 3, signal, effectiveContext);
} finally { span.end(); }
this.setStatus(result.status, effectiveContext);
await this.afterExecute(effectiveContext, result);
effectiveContext.emit({ type: 'done', result, at: Date.now() });
return result;
} catch (error) {
const agentError = this.toAgentError(error);
this.setStatus(agentError.code === 'AGENT_CANCELLED' ? 'cancelled' : 'failed', effectiveContext);
this.deps.telemetry.recordMetric('agent.errors', 1, { agentId: this.config.id, code: agentError.code });
this.deps.logger.error('Agent execution failed', { agentId: this.config.id, code: agentError.code, message: agentError.message });
await this.onError(effectiveContext, agentError);
effectiveContext.emit({ type: 'error', error: agentError.message, at: Date.now() });
return { status: agentError.code === 'AGENT_CANCELLED' ? 'cancelled' : 'failed', agentId: this.config.id, error: { code: agentError.code, message: agentError.message, retryable: agentError.retryable }, durationMs: Date.now() - started, traceId };
} finally { if (timeoutHandle) clearTimeout(timeoutHandle); this.abortController = null; }
}

Need withRetry generic:
protected async withRetry<T>(operation: () => Promise<T>, maxRetries: number, signal: AbortSignal, context: AgentContext): Promise<T> {
let attempt = 0; let lastError: unknown;
while (attempt <= maxRetries) {
if (signal.aborted) throw new AgentError('AGENT_CANCELLED', 'Execution cancelled', false);
try { return await operation(); } catch (error) {
lastError = error;
const agentError = this.toAgentError(error);
if (!agentError.retryable || attempt === maxRetries) throw agentError;
const delay = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.floor(Math.random() * 100);
this.deps.logger.warn('Retrying agent operation', { agentId: this.config.id, attempt: attempt + 1, delay, code: agentError.code });
await this.sleep(delay, signal);
attempt += 1;
}
}
throw this.toAgentError(lastError);
}

sleep:
protected sleep(ms: number, signal: AbortSignal): Promise<void> {
return new Promise((resolve, reject) => {
if (signal.aborted) { reject(new AgentError('AGENT_CANCELLED', 'Execution cancelled', false)); return; }
const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(); }, ms);
const onAbort = () => { clearTimeout(timer); reject(new AgentError('AGENT_CANCELLED', 'Execution cancelled', false)); };
signal.addEventListener('abort', onAbort, { once: true });
});
}

Need AbortSignal type. Good.

Abstract methods:
protected abstract plan(context: AgentContext): Promise<AgentPlan>;
protected abstract act(plan: AgentPlan, context: AgentContext): Promise<unknown>;

But act might need streaming. We can have default act that iterates steps and executes. But abstract? To make useful, make plan abstract, act optional? If abstract, class remains abstract. Good. But we can provide protected async executeStep. We'll define act abstract. But to allow subclass, okay. We can also provide stream default implementation that calls execute and emits tokens? Hmm. Need streaming. We can define async *stream(context, options): AsyncGenerator<AgentStreamEvent, AgentResult, void> { ... } But AsyncGenerator return type. Implementation can call execute and yield events via event queue? Simpler: stream registers listener, pushes events into queue, starts execute, yields events. Need avoid complexity. We can implement a basic generator that yields status and done, and forwards emitted events. But asynchronous queue. Could be lengthy. Maybe define stream as abstract? No, need implementation. Could implement:
async *stream<TInput = unknown, TOutput = unknown>(context: AgentContext<TInput>, options: AgentExecutionOptions = {}): AsyncGenerator<AgentStreamEvent, AgentResult<TOutput>, void> {
const queue: AgentStreamEvent[] = [];
let resolveNext: (() => void) | null = null;
const unsubscribe = this.on((event) => { queue.push(event); if (resolveNext) { resolveNext(); resolveNext = null; } });
try {
const execution = this.execute<TInput, TOutput>(context, options);
while (true) {
if (queue.length === 0) {
const done = await Promise.race([execution.then(() => true), new Promise<boolean>((resolve) => { resolveNext = () => resolve(false); })]);
if (done) break;
}
while (queue.length > 0) { const event = queue.shift(); if (event) yield event; }
}
const result = await execution;
yield { type: 'done', result, at: Date.now() };
return result;
} finally { unsubscribe(); }
}
But Promise.race with execution.then returns true, and resolveNext. Need if execution rejects? execute catches and returns result, so okay. But potential duplicate done event: execute emits done and then we yield done again. We can avoid yield done at end if already emitted? Not critical. But this code maybe not perfectly correct: if execution resolves while queue empty, done true; break; then yield done. Fine. If queue has events, yield. Good.

Tool orchestration:
protected async executeTool<TArgs = unknown, TResult = unknown>(toolName: string, args: TArgs, context: AgentContext): Promise<TResult> {
this.assertPermission('tool:' + toolName, context);
const tool = this.tools.get(toolName);
if (!tool) throw new AgentError('TOOL_NOT_FOUND', 'Tool not registered: ' + toolName, false);
for (const permission of tool.permissions) this.assertPermission(permission, context);
const circuit = this.getCircuit(toolName);
if (circuit.state === 'open') throw new AgentError('CIRCUIT_OPEN', 'Tool circuit is open: ' + toolName, true);
this.emit({ type: 'tool_start', tool: toolName, args, at: Date.now() });
try {
const result = await tool.execute(args, context);
this.emit({ type: 'tool_result', tool: toolName, result, at: Date.now() });
this.recordToolSuccess(toolName);
return result as TResult;
} catch (error) {
this.recordToolFailure(toolName);
throw this.toAgentError(error);
}
}

Need assertPermission(permission: string, context: AgentContext): void { if (!this.config.permissions.includes(permission) && !this.config.permissions.includes('*')) throw new AgentError('PERMISSION_DENIED', 'Missing permission: ' + permission, false); }

Model routing:
protected async callModel(prompt: string, context: AgentContext, options: { stream?: boolean } = {}): Promise<string> {
const messages = [{ role: 'system', content: this.config.systemPrompt ?? '' }, { role: 'user', content: prompt }];
const response = await this.deps.modelRouter.route({ model: this.config.model, messages, temperature: this.config.temperature, signal: context.signal });
return response.content;
}
Could return usage? Not needed.

Circuit breaker:
private getCircuit(toolName: string): CircuitBreakerState { let state = this.circuit.get(toolName); if (!state) { state = { failures: 0, state: 'closed', openedAt: 0 }; this.circuit.set(toolName, state); } if (state.state === 'open' && Date.now() - state.openedAt > 30000) { state.state = 'half-open'; } return state; }
private recordToolSuccess(toolName: string): void { const state = this.getCircuit(toolName); state.failures = 0; state.state = 'closed'; }
private recordToolFailure(toolName: string): void { const state = this.getCircuit(toolName); state.failures += 1; if (state.failures >= 5) { state.state = 'open'; state.openedAt = Date.now(); } }

Need define CircuitBreakerState type.

Cancellation:
cancel(reason = 'cancelled'): void { this.abortController?.abort(); this.setStatus('cancelled'); this.deps.logger.warn('Agent cancelled', { agentId: this.config.id, reason }); }

getState(): AgentStatus { return this.status; }

Validation:
protected validateInput(input: unknown): void { if (input === undefined || input === null) throw new AgentError('INVALID_INPUT', 'Input is required', false); }

Maybe in execute call this.validateInput(context.input) before beforeExecute. Good.

Memory helpers