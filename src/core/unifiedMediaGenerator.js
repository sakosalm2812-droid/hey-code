import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { defaultModelRouter } from './modelRouter.js';
import { log as auditLog } from './auditLogger.js';

export const SUPPORTED_MODALITIES = Object.freeze(['image', 'video', 'audio', '3d', 'music']);

export const MODALITY_TIMEOUTS_MS = Object.freeze({
  image: 60 * 1000,
  video: 600 * 1000,
  audio: 120 * 1000,
  '3d': 300 * 1000,
  music: 120 * 1000,
});

export class UnifiedMediaGenerator {
  constructor(options = {}) {
    this.router = options.modelRouter || defaultModelRouter;
    this.auditLogger = options.auditLogger || auditLog;
    this.artifactDir = options.artifactDir || path.resolve(process.cwd(), 'data', 'artifacts');
    this.jobs = new Map();
    this.dispatchers = options.dispatchers || {};

    try {
      if (!fs.existsSync(this.artifactDir)) {
        fs.mkdirSync(this.artifactDir, { recursive: true });
      }
    } catch {}
  }

  registerDispatcher(modality, fn) {
    this.dispatchers[modality] = fn;
  }

  async generate({ modality, prompt, params = {}, scope, actor = 'user', timeoutMs = null }) {
    // 1. Validate inputs
    if (!scope || typeof scope !== 'string' || scope.trim() === '') {
      throw new Error('UnifiedMediaGenerator: scope is mandatory for all generations');
    }

    if (!modality || !SUPPORTED_MODALITIES.includes(modality)) {
      throw new Error(`UnifiedMediaGenerator: Invalid modality "${modality}". Supported: ${SUPPORTED_MODALITIES.join(', ')}`);
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('UnifiedMediaGenerator: Prompt must be a non-empty string');
    }

    const jobId = `job_${crypto.randomUUID()}`;
    const startTime = Date.now();
    const activeTimeout = timeoutMs ?? (MODALITY_TIMEOUTS_MS[modality] || 60000);

    // 2. Route provider via ModelRouter
    const routeDecision = this.router.route({
      task_type: modality,
      privacy_level: params.privacy_level || 0,
      budget_remaining: params.budget_remaining || Infinity,
    });

    const provider = routeDecision.provider || 'default_generator';
    const estimatedCost = routeDecision.estimated_cost || 0.01;

    const jobRecord = {
      id: jobId,
      modality,
      provider,
      status: 'running',
      cost: estimatedCost,
      output_url: null,
      artifact_id: null,
      effect_unknown: false,
      error: null,
      scope,
      created_at: new Date(startTime).toISOString(),
    };

    this.jobs.set(jobId, jobRecord);

    // 3. Execute generation with timeout
    try {
      const dispatcher =
        this.dispatchers[modality] ||
        (async (p) => {
          // Default mock generator for testing
          const filePath = path.join(this.artifactDir, `${jobId}.${modality === 'image' ? 'png' : 'bin'}`);
          fs.writeFileSync(filePath, Buffer.from(`generated_${modality}_data_${p.prompt}`));
          return { output_url: filePath, cost: estimatedCost };
        });

      const execPromise = dispatcher({ prompt, params, scope, provider });
      const timeoutPromise = new Promise((resolve) => {
        const timer = setTimeout(() => resolve({ __timedOut: true }), activeTimeout);
        timer.unref?.();
      });

      const result = await Promise.race([execPromise, timeoutPromise]);

      if (result && result.__timedOut) {
        jobRecord.status = 'failed';
        jobRecord.effect_unknown = true;
        jobRecord.error = 'timeout_exceeded';
        jobRecord.duration_ms = activeTimeout;
        return { ...jobRecord };
      }

      const outputUrl = result.output_url || result.url || result.filePath;

      // 4. Verify output exists and is valid (non-zero size)
      if (!outputUrl) {
        throw new Error('Generation completed without producing an output URL or file path');
      }

      if (fs.existsSync(outputUrl)) {
        const stats = fs.statSync(outputUrl);
        if (stats.size === 0) {
          throw new Error('Generated output file is empty (0 bytes)');
        }
      }

      // 5. Store in artifact system with provenance
      const artifactId = `art_${crypto.randomUUID()}`;
      const provenance = {
        source_type: 'generate',
        job_id: jobId,
        modality,
        prompt,
        actor,
        provider,
        scope,
        timestamp: new Date().toISOString(),
      };

      jobRecord.status = 'completed';
      jobRecord.output_url = outputUrl;
      jobRecord.artifact_id = artifactId;
      jobRecord.cost = result.cost ?? estimatedCost;
      jobRecord.duration_ms = Date.now() - startTime;
      jobRecord.provenance = provenance;

      // 6. Emit generate:completed to audit log
      if (typeof this.auditLogger === 'function') {
        this.auditLogger({
          event_type: 'generate:completed',
          actor,
          correlation_id: jobId,
          payload: {
            jobId,
            modality,
            provider,
            cost: jobRecord.cost,
            output_url: outputUrl,
            artifact_id: artifactId,
            provenance,
          },
        });
      }

      return { ...jobRecord };
    } catch (err) {
      jobRecord.status = 'failed';
      jobRecord.error = err.message;
      jobRecord.duration_ms = Date.now() - startTime;
      return { ...jobRecord };
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }
}

export const defaultMediaGenerator = new UnifiedMediaGenerator();

export function generate(input) {
  return defaultMediaGenerator.generate(input);
}

export default {
  UnifiedMediaGenerator,
  defaultMediaGenerator,
  generate,
  SUPPORTED_MODALITIES,
  MODALITY_TIMEOUTS_MS,
};
