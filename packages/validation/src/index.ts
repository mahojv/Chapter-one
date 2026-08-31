import { z } from 'zod';

/**
 * Technical and generic validation schemas for Chapter One foundation.
 */

export const healthStatusSchema = z.enum(['ok', 'degraded', 'error']);

export const healthResponseSchema = z.object({
  status: healthStatusSchema,
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
  version: z.string().min(1),
  environment: z.string().optional(),
});

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type HealthResponseSchema = z.infer<typeof healthResponseSchema>;
export type PaginationParamsSchema = z.infer<typeof paginationParamsSchema>;
