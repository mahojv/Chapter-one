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
