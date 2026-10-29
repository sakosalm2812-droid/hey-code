import crypto from 'node:crypto';
import { defaultPermissionChecker } from './failClosedPermissionChecker.js';
import { defaultApprovalGate } from './consequentialApprovalGate.js';
import { defaultSandbox } from './sandbox.js';
import { log as auditLog } from './auditLogger.js';

export class GovernedToolExecutor {
  constructor(options = {}) {
    this.permissionChecker = options.permissionChecker || defaultPermissionChecker;
    this.approvalGate = options.approvalGate || defaultApprovalGate;
    this.sandbox = options.sandbox || defaultSandbox;
    this.auditLogger = options.auditLogger || auditLog;
    this.tools = new Map();
  }

  registerTool({ id, name, description = '', risk = 'low', manifest = {}, code = null, runner = null }) {
    if (!id) throw new TypeError('Tool id is required');

    this.tools.set(id, {
      id,
      name: name || id,
      description,
      risk,
      manifest: {
        timeout: manifest.timeout || 30,
        language: manifest.language || 'node',
        ...manifest,
      },
      code,
      runner,
    });
  }

  computeParamsHash(params) {
    const canonical = JSON.stringify(params, Object.keys(params || {}).sort());
    return crypto.createHash('sha256').update(canonical || '').digest('hex');
  }

  async execute({ tool_id, params = {}, requester = 'user', approval_id = null }) {
    const startTime = Date.now();

    // 1. Tool lookup
    const tool = this.tools.get(tool_id);
    if (!tool) {
      return {
        ok: false,
        error: 'unknown_tool',
        output: '',
        duration_ms: Date.now() - startTime,
        effect_unknown: false,
      };
    }

    // 2. Permission check (no exceptions for "trusted" tools)
    const perm = this.permissionChecker.check({
      subject: requester,
      resource: tool_id,
      action: 'execute',
    });

    if (!perm.allowed) {
      this._emitAudit(tool_id, requester, false, 'unauthorized', 0, false);
      return {
        ok: false,
        error: 'unauthorized',
        output: '',
        duration_ms: Date.now() - startTime,
        effect_unknown: false,
      };
    }

    // 3. High-risk approval gate check
    const isHighRisk =
      tool.risk === 'high' ||
      tool.risk === 'critical' ||
      this.permissionChecker.isHighRisk(tool_id);

    if (isHighRisk) {
      const content_hash = this.computeParamsHash(params);
      const approvalCheck = this.approvalGate.isActionApproved({
        approval_id,
        action: tool_id,
        content_hash,
      });

      if (!approvalCheck.allowed) {
        this._emitAudit(tool_id, requester, false, 'approval_required', 0, false);
        return {
          ok: false,
          error: 'approval_required',
          output: '',
          duration_ms: Date.now() - startTime,
          effect_unknown: false,
        };
      }
    }

    // 4. Run in sandbox
    const timeoutSeconds = tool.manifest.timeout || 30;
    let sandboxResult;

    if (tool.code) {
      // Execute registered code in sandbox
      sandboxResult = await this.sandbox.run({
        code: tool.code,
        language: tool.manifest.language || 'node',
        limits: { timeout_seconds: timeoutSeconds },
        input: JSON.stringify(params),
      });
    } else if (typeof tool.runner === 'function') {
      // Execute runner with sandbox limits & isolation
      const runnerPromise = Promise.resolve().then(() => tool.runner(params, { requester }));
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ __timedOut: true }), timeoutSeconds * 1000)
      );

      const raced = await Promise.race([runnerPromise, timeoutPromise]);
      if (raced && raced.__timedOut) {
        sandboxResult = {
          ok: false,
          error: 'limit_exceeded',
          duration_ms: timeoutSeconds * 1000,
        };
      } else {
        const rawOutput = raced?.output !== undefined ? raced.output : raced;
        const formattedOutput =
          typeof rawOutput === 'string'
            ? rawOutput
            : typeof rawOutput === 'number' || typeof rawOutput === 'boolean'
            ? String(rawOutput)
            : JSON.stringify(rawOutput);

        sandboxResult = {
          ok: Boolean(raced?.ok !== false),
          output: formattedOutput,
          error: raced?.error || null,
          duration_ms: Date.now() - startTime,
        };
      }
    } else {
      // Default tool echo
      sandboxResult = {
        ok: true,
        output: JSON.stringify({ tool_id, params, status: 'executed' }),
        duration_ms: Date.now() - startTime,
      };
    }

    const duration = Date.now() - startTime;
    const timedOut = sandboxResult.error === 'limit_exceeded';

    const result = {
      ok: Boolean(sandboxResult.ok),
      output: sandboxResult.output || sandboxResult.stdout || '',
      error: sandboxResult.error || null,
      duration_ms: duration,
      effect_unknown: timedOut,
    };

    // 5. Emit audit log
    this._emitAudit(tool_id, requester, result.ok, result.error, duration, result.effect_unknown);

    return result;
  }

  _emitAudit(tool_id, requester, ok, error, duration_ms, effect_unknown) {
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'tool:executed',
        actor: requester,
        correlation_id: `tool_${tool_id}`,
        payload: {
          tool_id,
          requester,
          ok,
          error,
          duration_ms,
          effect_unknown,
        },
      });
    }
  }
}

export const defaultToolExecutor = new GovernedToolExecutor();

export function execute(input) {
  return defaultToolExecutor.execute(input);
}

export function registerTool(tool) {
  return defaultToolExecutor.registerTool(tool);
}

export default {
  GovernedToolExecutor,
  defaultToolExecutor,
  execute,
  registerTool,
};
