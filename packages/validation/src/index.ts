import { z } from 'zod';

/**
 * Esquemas de validación técnicos y genéricos para la fundación de Chapter One.
 */

// Esquema de estados de salud
export const esquemaEstadoSalud = z.enum(['ok', 'degraded', 'error']);
export const healthStatusSchema = esquemaEstadoSalud;

// Esquema de validación para la respuesta de salud
export const esquemaRespuestaSalud = z.object({
  status: esquemaEstadoSalud,
  timestamp: z.string().datetime(),
  uptime: z.number().nonnegative(),
  version: z.string().min(1),
  environment: z.string().optional(),
  database: z.enum(['connected', 'disconnected']).optional(),
});
export const healthResponseSchema = esquemaRespuestaSalud;

// Esquema de validación para paginación
export const esquemaParametrosPaginacion = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export const paginationParamsSchema = esquemaParametrosPaginacion;

// Tipos inferidos de los esquemas
export type EsquemaRespuestaSalud = z.infer<typeof esquemaRespuestaSalud>;
export type HealthResponseSchema = EsquemaRespuestaSalud;

export type EsquemaParametrosPaginacion = z.infer<typeof esquemaParametrosPaginacion>;
export type PaginationParamsSchema = EsquemaParametrosPaginacion;
