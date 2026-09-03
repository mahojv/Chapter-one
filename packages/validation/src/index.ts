import { z } from 'zod';

/**
 * Esquemas de validación técnicos y de dominio para Chapter One.
 */

// -----------------------------------------------------------------------------
// 1. Esquemas de Salud y Técnicos
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// 2. Esquemas de Jugadores (Players) - Fase 4
// -----------------------------------------------------------------------------

// Esquema para creación de jugador: POST /players
export const esquemaCrearJugador = z.object({
  username: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .trim()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
    .max(50, { message: 'El nombre de usuario no puede exceder 50 caracteres' })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos',
    }),
  displayName: z
    .string({ required_error: 'El nombre visible es obligatorio' })
    .trim()
    .min(1, { message: 'El nombre visible no puede estar vacío' })
    .max(100, { message: 'El nombre visible no puede exceder 100 caracteres' }),
  timezone: z
    .string()
    .trim()
    .min(1, { message: 'La zona horaria no puede estar vacía' })
    .max(50, { message: 'La zona horaria no puede exceder 50 caracteres' })
    .optional()
    .default('UTC'),
  authUserId: z
    .string()
    .trim()
    .min(1, { message: 'El identificador de autenticación no puede estar vacío' })
    .max(255, { message: 'El identificador de autenticación no puede exceder 255 caracteres' })
    .optional(),
});
export const createPlayerSchema = esquemaCrearJugador;

// Esquema para actualización parcial de jugador: PATCH /players/:id
export const esquemaActualizarJugador = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, { message: 'El nombre visible no puede estar vacío' })
      .max(100, { message: 'El nombre visible no puede exceder 100 caracteres' })
      .optional(),
    timezone: z
      .string()
      .trim()
      .min(1, { message: 'La zona horaria no puede estar vacía' })
      .max(50, { message: 'La zona horaria no puede exceder 50 caracteres' })
      .optional(),
    authUserId: z
      .string()
      .trim()
      .min(1, { message: 'El identificador de autenticación no puede estar vacío' })
      .max(255, { message: 'El identificador de autenticación no puede exceder 255 caracteres' })
      .optional(),
  })
  .refine(
    (datos) =>
      datos.displayName !== undefined ||
      datos.timezone !== undefined ||
      datos.authUserId !== undefined,
    {
      message: 'Debe proporcionar al menos un campo para actualizar (displayName, timezone o authUserId)',
    },
  );
export const updatePlayerSchema = esquemaActualizarJugador;

// Esquema para el parámetro de ruta ID de jugador (UUID v4)
export const esquemaParametroIdJugador = z.object({
  id: z
    .string({ required_error: 'El ID es obligatorio' })
    .uuid({ message: 'El identificador del jugador debe ser un UUID válido' }),
});
export const playerIdParamSchema = esquemaParametroIdJugador;

// Esquema para otorgar XP: POST /players/me/xp
export const esquemaOtorgarXp = z.object({
  xpDelta: z
    .number({ required_error: 'La cantidad de XP (xpDelta) es obligatoria' })
    .int({ message: 'La XP debe ser un número entero' })
    .positive({ message: 'La XP debe ser un número mayor a cero' }),
  reason: z.string().max(200, 'La razón no puede exceder 200 caracteres').optional(),
  eventType: z
    .enum([
      'WORKOUT_COMPLETED',
      'HABIT_COMPLETED',
      'QUEST_COMPLETED',
      'ACHIEVEMENT_UNLOCKED',
      'SKILL_XP_GAINED',
      'LEVEL_UP',
      'PERSONAL_RECORD',
      'REST_DAY_LOGGED',
      'SKILL_DECAY_CALCULATED',
      'ATTRIBUTE_PROGRESS',
    ])
    .optional(),
  sourceEntityType: z.string().max(50).optional(),
  sourceEntityId: z.string().uuid({ message: 'sourceEntityId debe ser un UUID válido' }).optional(),
});
export const grantXpSchema = esquemaOtorgarXp;

// -----------------------------------------------------------------------------
// 3. Tipos Inferidos
// -----------------------------------------------------------------------------

export type EsquemaRespuestaSalud = z.infer<typeof esquemaRespuestaSalud>;
export type HealthResponseSchema = EsquemaRespuestaSalud;

export type EsquemaParametrosPaginacion = z.infer<typeof esquemaParametrosPaginacion>;
export type PaginationParamsSchema = EsquemaParametrosPaginacion;

export type EntradaCrearJugador = z.infer<typeof esquemaCrearJugador>;
export type CreatePlayerInput = EntradaCrearJugador;

export type EntradaActualizarJugador = z.infer<typeof esquemaActualizarJugador>;
export type UpdatePlayerInput = EntradaActualizarJugador;

export type ParametroIdJugador = z.infer<typeof esquemaParametroIdJugador>;
export type PlayerIdParam = ParametroIdJugador;

export type EntradaOtorgarXpValidada = z.infer<typeof esquemaOtorgarXp>;
export type GrantXpValidatedInput = EntradaOtorgarXpValidada;
