import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, incrementApiCalls, createRateLimiter, authRateLimiter, apiRateLimiter, chatRateLimiter } from '@/lib/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', async () => {
      const result = await checkRateLimit('test-user', { maxRequests: 5, windowMs: 60000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('blocks requests over limit', async () => {
      for (let i = 0; i < 5; i++) {
        await checkRateLimit('test-user-2', { maxRequests: 5, windowMs: 60000 });
      }
      const result = await checkRateLimit('test-user-2', { maxRequests: 5, windowMs: 60000 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('resets after window expires', async () => {
      await checkRateLimit('test-user-3', { maxRequests: 2, windowMs: 1000 });
      await checkRateLimit('test-user-3', { maxRequests: 2, windowMs: 1000 });
      
      vi.advanceTimersByTime(1100);
      
      const result = await checkRateLimit('test-user-3', { maxRequests: 2, windowMs: 1000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('uses different keys for different identifiers', async () => {
      await checkRateLimit('user-a', { maxRequests: 1, windowMs: 60000 });
      const result = await checkRateLimit('user-b', { maxRequests: 1, windowMs: 60000 });
      expect(result.allowed).toBe(true);
    });
  });

  describe('createRateLimiter', () => {
    it('creates a rate limiter with custom config', async () => {
      const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60000, keyPrefix: 'custom' });
      const result = await limiter('test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('predefined limiters', () => {
    it('authRateLimiter has correct config', async () => {
      const result = await authRateLimiter('test');
      expect(result.allowed).toBe(true);
    });

    it('apiRateLimiter has correct config', async () => {
      const result = await apiRateLimiter('test');
      expect(result.allowed).toBe(true);
    });

    it('chatRateLimiter has correct config', async () => {
      const result = await chatRateLimiter('test');
      expect(result.allowed).toBe(true);
    });
  });
});