import type { RespuestaSalud } from '@chapter-one/types';
import type { FastifyPluginAsync } from 'fastify';

/**
 * Rutas de comprobación de estado de salud del backend
 */
export const rutasSalud: FastifyPluginAsync = async (servidor) => {
  servidor.get('/health', async (): Promise<RespuestaSalud> => {
    let bdConectada = false;

    try {
      bdConectada = await servidor.db.checkHealth();
    } catch {
      bdConectada = false;
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '0.1.0',
      environment: process.env.NODE_ENV ?? 'development',
      database: bdConectada ? 'connected' : 'disconnected',
    };
  });
};

// Alias para compatibilidad
export const healthRoutes = rutasSalud;
