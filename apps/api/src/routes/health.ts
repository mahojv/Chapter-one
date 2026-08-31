import type { HealthResponse } from '@chapter-one/types';
import type { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (): Promise<HealthResponse> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
    };
  });
};
