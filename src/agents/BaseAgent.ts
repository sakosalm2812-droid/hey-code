We need answer only JSON code block with write_file. Need complete file content. Need infer current BaseAgent.ts likely incomplete. Need produce robust upgraded complete file. Need escape JSON. Need no markdown outside? Final should be json code block. Need include one write_file array.

Need craft full BaseAgent.ts. Need "10x better" using skill library? Skill library is brainstorming, but file is code. We can incorporate design. Need output entire file.

Need ensure JSON valid. We can produce content as escaped string. Need be careful all double quotes escaped. Could use single quotes in TS mostly, but still template strings. JSON requires escape double quotes. We can avoid double quotes in code mostly, except maybe in strings. Use single quotes. But object keys can be unquoted. Type literals use single quotes. Need avoid double quotes entirely in content to simplify? We can use no double quotes in code by using single quotes and template literals. But some generic? No. We can use ' fine. There may be \" not needed. Need JSON string can include backticks/newlines escaped. We need encode newlines as \n. Very long.

Could make code moderately concise. Need complete. Let's design full BaseAgent.ts.

Features:

Types: AgentStatus, AgentErrorShape, AgentConfig, AgentContext, AgentResult, AgentEventMap, Hook.

AgentError with static helpers.

Abstract BaseAgent<TInput, TOutput>.

Private state: id, name, status, abortController, startedAt, endedAt, attempts, retryCount, metrics, listeners, rateLimiter, circuitBreaker.

Constructor config partial defaults: maxRetries, retryBaseDelayMs, retryMaxDelayMs, timeoutMs, rateLimitPerMinute, circuitFailureThreshold, circuitResetTimeoutMs, logger.

Public run(input, context?) returns Promise<TOutput>. Lifecycle: guard state idle/completed/failed? Should allow run once? Maybe reset? We can allow run if not running and not aborted. If completed, reset metrics? Better allow re-run with reset. But abort signal? Need new AbortController per run. Validate input via abstract validate. Check circuit, rate limit. Emit status. execute with timeout and retries. On success emit completed. On error classify. On abort. Finally cleanup.

Abstract methods: validate(input), execute(input, context), maybe plan? optional hooks. Need not too many.

Public abort(reason?). getStatus, getMetrics, on/off.

Protected emit? hooks? Protected log.

Implement retry with exponential backoff and jitter. Circuit breaker states closed/open/half-open. Rate limiter token bucket.

Timeout via Promise.race and AbortController.

Ensure AbortError? AgentError code ABORTED retryable false.

Use unknown and type guards.

Error normalization.

No external deps.

Use queueMicrotask? Event emission synchronous but safe. Could catch listener errors.

Metrics: startedAt, endedAt, durationMs, attempts, retries, status, errorCode.

Event map: status, attempt, retry, progress, log, metrics, error.

Hook? Optional onStatus? Maybe not.

Need ensure code compiles under strict TS. Let's write carefully.

Potential code:

export type AgentStatus = 'idle' | 'planning' | 'executing' | 'streaming' | 'completed' | 'failed' | 'aborted' | 'rate_limited' | 'circuit_open';

export interface AgentErrorShape {
string;
message: string;
retryable: boolean;
cause?: unknown;
details?: Record<string, unknown>;
}

export class AgentError extends Error implements AgentErrorShape {
readonly code: string;
readonly retryable: boolean;
readonly details?: Record<string, unknown>;

constructor(code: string, message: string, options: { retryable?: boolean; cause?: unknown; details?: Record<string, unknown> } = {}) {
super(message);
this.name = 'AgentError';
this.code = code;
this.retryable = options.retryable ?? false;
this.details = options.details;
if (options.cause !== undefined) {
Object.defineProperty(this, 'cause', { value: options.cause, enumerable: false, configurable: true, writable: true });
}
Object.setPrototypeOf(this, new.target.prototype);
}

static from(error: unknown, fallbackCode = 'UNKNOWN'): AgentError {
if (error instanceof AgentError) return error;
if (error instanceof Error) {
return new AgentError(fallbackCode, error.message, { cause: error, retryable: false });
}
return new AgentError(fallbackCode, typeof error === 'string' ? error : 'Unknown agent error', { cause: error });
}

static aborted(message = 'Agent execution aborted'): AgentError { return new AgentError('ABORTED', message, { retryable: false }); }
static timeout(ms: number): AgentError { return new AgentError('TIMEOUT', Agent execution timed out after ${ms}ms, { retryable: true }); }
static rateLimited(retryAfterMs?: number): AgentError { return new AgentError('RATE_LIMITED', 'Agent rate limit exceeded', { retryable: true, details: { retryAfterMs } }); }
static circuitOpen(resetAfterMs?: number): AgentError { return new AgentError('CIRCUIT_OPEN', 'Agent circuit breaker is open', { retryable: true, details: { resetAfterMs } }); }
}

export interface AgentContext {
readonly runId: string;
readonly signal: AbortSignal;
readonly attempt: number;
readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AgentResult<TOutput> {
readonly output: TOutput;
readonly attempts: number;
readonly durationMs: number;
}

export interface AgentMetrics {
status: AgentStatus;
attempts: number;
retries: number;
startedAt?: number;
endedAt?: number;
durationMs?: number;
errorCode?: string;
}

export type AgentEventMap<TInput, TOutput> = {
status: { status: AgentStatus; previous: AgentStatus };
attempt: { attempt: number; input: TInput };
retry: { attempt: number; error: AgentError; delayMs: number };
progress: { message: string; percent?: number; data?: unknown };
log: { level: 'debug' | 'info' | 'warn' | 'error'; message: string; data?: unknown };
metrics: AgentMetrics;
completed: { output: TOutput; attempts: number; durationMs: number };
error: { error: AgentError; attempts: number };
};

export type AgentEventListener<T> = (event: T) => void;

export interface AgentConfig {
maxRetries: number;
retryBaseDelayMs: number;
retryMaxDelayMs: number;
timeoutMs: number;
rateLimitPerMinute: number;
circuitFailureThreshold: number;
circuitResetTimeoutMs: number;
jitterRatio: number;
logger?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => void;
}

const DEFAULT_CONFIG: AgentConfig = { ... };

Need AgentConfig with required fields but constructor accepts Partial<AgentConfig>. Good.

Need BaseAgent:

export abstract class BaseAgent<TInput, TOutput> {
readonly id: string;
readonly name: string;
protected readonly config: AgentConfig;
private _status: AgentStatus = 'idle';
private _abortController = new AbortController();
private _listeners = new Map<keyof AgentEventMap<TInput, TOutput>, Set<AgentEventListener<any>>>();
private _metrics: AgentMetrics = { status: 'idle', attempts: 0, retries: 0 };
private _runId = 0;
private _running = false;
private _rateTokens: number;
private _rateUpdatedAt = Date.now();
private _circuitFailures = 0;
private _circuitOpenedAt = 0;
private _lastError?: AgentError;

constructor(name: string, config: Partial<AgentConfig> = {}) {
this.id = ${name}-${Math.random().toString(36).slice(2, 10)};
this.name = name;
this.config = { ...DEFAULT_CONFIG, ...config };
this._rateTokens = this.config.rateLimitPerMinute;
this.assertConfig();
}

get status(): AgentStatus { return this._status; }
get metrics(): AgentMetrics { return { ...this._metrics }; }
get lastError(): AgentError | undefined { return this._lastError; }

on<K extends keyof AgentEventMap<TInput, TOutput>>(event: K, listener: AgentEventListener<AgentEventMap<TInput, TOutput>[K]>): () => void { ... }
off...
abort(reason = 'Agent execution aborted'): void { if (this._running) { this._abortController.abort(reason); this.setStatus('aborted'); } }

async run(input: TInput, metadata: Record<string, unknown> = {}): Promise<TOutput> {
if (this._running) throw new AgentError('ALREADY_RUNNING', ...);
this._running = true;
this._lastError = undefined;
const runId = ++this._runId;
this._abortController = new AbortController();
const startedAt = Date.now();
this._metrics = { status: 'idle', attempts: 0, retries: 0, startedAt };
this.emit('metrics', this.metrics);
try {
this.setStatus('planning');
await this.validate(input);
this.checkCircuit();
this.consumeRateLimit();
this.setStatus('executing');
let attempt = 0;
let lastError: AgentError | undefined;
while (attempt <= this.config.maxRetries) {
this.throwIfAborted();
attempt += 1;
this._metrics.attempts = attempt;
this.emit('attempt', { attempt, input });
const context: AgentContext = { runId: ${this.id}:${runId}:${attempt}, signal: this._abortController.signal, attempt, metadata: Object.freeze({ ...metadata }) };
try {
const output = await this.withTimeout(() => this.execute(input, context), this.config.timeoutMs, this._abortController.signal);
this._circuitFailures = 0;
const durationMs = Date.now() - startedAt;
this._metrics = { ...this._metrics, status: 'completed', endedAt: Date.now(), durationMs };
this.setStatus('completed');
this.emit('completed', { output, attempts: attempt, durationMs });
this.emit('metrics', this.metrics);
return output;
} catch (error) {
lastError = AgentError.from(error, 'EXECUTION_FAILED');
if (this._abortController.signal.aborted || lastError.code === 'ABORTED') {
this._lastError = AgentError.aborted(lastError.message);
this._metrics = { ...this._metrics, status: 'aborted', endedAt: Date.now(), durationMs: Date.now() - startedAt, errorCode: 'ABORTED' };
this.setStatus('aborted');
this.emit('error', { error: this._lastError, attempts: attempt });
throw this._lastError;
}
const retryable = lastError.retryable && attempt <= this.config.maxRetries;
if (!retryable) break;
this._metrics.retries += 1;
this.recordCircuitFailure();
const delayMs = this.backoffDelay(attempt);
this.emit('retry', { attempt, error: lastError, delayMs });
await this.sleep(delayMs, this._abortController.signal);
}
}
const finalError = lastError ?? new AgentError('EXECUTION_FAILED', 'Agent execution failed');
this._lastError = finalError;
this.recordCircuitFailure();
const status: AgentStatus = finalError.code === 'RATE_LIMITED' ? 'rate_limited' : finalError.code === 'CIRCUIT_OPEN' ? 'circuit_open' : 'failed';
this._metrics = { ...this._metrics, status, endedAt: Date.now(), durationMs: Date.now() - startedAt, errorCode: finalError.code };
this.setStatus(status);
this.emit('error', { error: finalError, attempts: attempt });
this.emit('metrics', this.metrics);
throw finalError;
} catch (error) {
const agentError = AgentError.from(error, 'AGENT_FAILED');
if (!this._lastError) {
this._lastError = agentError;
this._metrics = { ...this._metrics, status: 'failed', endedAt: Date.now(), durationMs: Date.now() - startedAt, errorCode: agentError.code };
this.setStatus('failed');
this.emit('error', { error: agentError, attempts: this._metrics.attempts });
this.emit('metrics', this.metrics);
}
throw agentError;
} finally {
this._running = false;
}
}

Need careful: In catch if already emitted and thrown, catch will catch and if _lastError set, throw agentError (same). Good.

But in inner catch we record circuit failure even for retryable errors. For non-retryable break then outer records again. Could double count. Need adjust: record circuit failure only final? Actually circuit should track failures. Could increment on each failed attempt? Better on final failure. In inner catch, if retryable we don't record? Could record at final. Let's simplify: remove recordCircuitFailure in inner ret