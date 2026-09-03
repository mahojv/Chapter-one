/**
 * Tipos técnicos y genéricos para la fundación de Chapter One.
 * Los modelos específicos de dominio (Jugador, Estadísticas, Misiones, Entrenamientos, etc.)
 * se excluyen estrictamente en esta fase de fundación.
 */

// Estados de salud del sistema
export type HealthStatus = 'ok' | 'degraded' | 'error';
export type EstadoSalud = HealthStatus;

// Estructura de respuesta del endpoint de salud
export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment?: string;
  database?: 'connected' | 'disconnected';
}
export type RespuestaSalud = HealthResponse;

// Estructura para errores de la API
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
export type ErrorApi = ApiError;

// Estructura genérica para respuestas de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
export type RespuestaApi<T = unknown> = ApiResponse<T>;

// Parámetros estándar para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
}
export type ParametrosPaginacion = PaginationParams;

// Respuesta paginada estándar
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export type RespuestaPaginada<T> = PaginatedResponse<T>;

// -----------------------------------------------------------------------------
// Contratos genéricos de Progresión RPG
// -----------------------------------------------------------------------------

export interface ProgressionDetails {
  currentLevel: number;
  totalXp: number;
  currentLevelXpFloor: number;
  nextLevelXpThreshold: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
}
export type DetallesProgreso = ProgressionDetails;

export interface XpGainResult {
  previousTotalXp: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  xpGained: number;
  didLevelUp: boolean;
  levelsGained: number;
  progress: ProgressionDetails;
}
export type ResultadoGananciaXp = XpGainResult;

export type ProgressEventType =
  | 'WORKOUT_COMPLETED'
  | 'HABIT_COMPLETED'
  | 'QUEST_COMPLETED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'SKILL_XP_GAINED'
  | 'LEVEL_UP'
  | 'PERSONAL_RECORD'
  | 'REST_DAY_LOGGED'
  | 'SKILL_DECAY_CALCULATED'
  | 'ATTRIBUTE_PROGRESS';
export type TipoEventoProgreso = ProgressEventType;

export interface GrantXpInput {
  playerId: string;
  xpDelta: number;
  eventType?: ProgressEventType;
  sourceEntityType?: string;
  sourceEntityId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}
export type EntradaOtorgarXp = GrantXpInput;

export interface GrantXpResult {
  playerId: string;
  previousTotalXp: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  xpGained: number;
  didLevelUp: boolean;
  levelsGained: number;
  skillPointsGained: number;
  unspentSkillPoints: number;
  totalSkillPointsEarned: number;
  eventId: string;
  progress: ProgressionDetails;
}
export type ResultadoOtorgarXp = GrantXpResult;
