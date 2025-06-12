import { config } from './config';
import { edgeLogger } from './edge-logger';

interface RateLimitConfig {
  rateLimitPerMinute: number;
  burstLimit: number;
  windowSeconds: number;
}

class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.store = new Map();
  }

  private getKey(apiKey: string): string {
    return `rate_limit:${apiKey}`;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  async checkRateLimit(apiKey: string, config: RateLimitConfig): Promise<boolean> {
    try {
      this.cleanup();
      const key = this.getKey(apiKey);
      const now = Date.now();
      const windowMs = config.windowSeconds * 1000;

      const current = this.store.get(key);
      if (!current) {
        this.store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return true;
      }

      if (current.resetTime <= now) {
        this.store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return true;
      }

      if (current.count >= config.rateLimitPerMinute) {
        edgeLogger.warn('Rate limit exceeded', { apiKey });
        return false;
      }

      current.count++;
      return true;
    } catch (error) {
      edgeLogger.error('Rate limit check failed:', error);
      return true; // Fail open in case of errors
    }
  }

  async checkBurstLimit(apiKey: string, config: RateLimitConfig): Promise<boolean> {
    try {
      this.cleanup();
      const key = this.getKey(apiKey);
      const now = Date.now();
      const windowMs = config.windowSeconds * 1000;

      const current = this.store.get(key);
      if (!current) {
        this.store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return true;
      }

      if (current.resetTime <= now) {
        this.store.set(key, {
          count: 1,
          resetTime: now + windowMs,
        });
        return true;
      }

      if (current.count >= config.burstLimit) {
        edgeLogger.warn('Burst limit exceeded', { apiKey });
        return false;
      }

      current.count++;
      return true;
    } catch (error) {
      edgeLogger.error('Burst limit check failed:', error);
      return true; // Fail open in case of errors
    }
  }
}

export const rateLimiter = new RateLimiter(); 