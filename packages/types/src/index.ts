/**
 * Technical and generic types for Chapter One foundation.
 * Domain-specific models (Player, Stats, Quests, Workouts, etc.) are strictly excluded
 * in this foundation phase.
 */

export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
