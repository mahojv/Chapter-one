import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  checkDatabaseHealth,
  closePool,
  getClient,
  getPool,
  query,
} from '../db/client.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: {
      query: typeof query;
      getClient: typeof getClient;
      getPool: typeof getPool;
      checkHealth: typeof checkDatabaseHealth;
    };
  }
}

/**
 * Plugin de integración para la base de datos PostgreSQL con Fastify
 */
const pluginBaseDatosAsync: FastifyPluginAsync = async (servidor) => {
  servidor.decorate('db', {
    query,
    getClient,
    getPool,
    checkHealth: checkDatabaseHealth,
  });

  // Cierre limpio del pool al apagar el servidor
  servidor.addHook('onClose', async () => {
    await closePool();
  });
};

export const pluginBaseDatos = fp(pluginBaseDatosAsync, {
  name: 'plugin-base-datos',
});

// Alias para compatibilidad
export const databasePlugin = pluginBaseDatos;
