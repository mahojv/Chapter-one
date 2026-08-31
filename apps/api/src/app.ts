import cors from '@fastify/cors';
import fastify, { type FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';

export interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = { logger: true }): FastifyInstance {
  const app = fastify({
    logger: options.logger,
  });

  // Enable Cross-Origin Resource Sharing for frontend communication
  app.register(cors, {
    origin: true,
  });

  // Register routes
  app.register(healthRoutes);

  return app;
}
