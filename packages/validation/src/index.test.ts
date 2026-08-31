import { describe, expect, it } from 'vitest';
import { healthResponseSchema, paginationParamsSchema } from './index.js';

describe('Validation Schemas', () => {
  describe('healthResponseSchema', () => {
    it('should validate a correct health response', () => {
      const validPayload = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 10.5,
        version: '0.1.0',
        environment: 'test',
      };

      const result = healthResponseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid health status', () => {
      const invalidPayload = {
        status: 'unknown-status',
        timestamp: new Date().toISOString(),
        uptime: 10.5,
        version: '0.1.0',
      };

      const result = healthResponseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationParamsSchema', () => {
    it('should parse and apply default pagination values', () => {
      const result = paginationParamsSchema.parse({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it('should coerce query string numbers', () => {
      const result = paginationParamsSchema.parse({ page: '3', limit: '50' });
      expect(result).toEqual({ page: 3, limit: 50 });
    });
  });
});
