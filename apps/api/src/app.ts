import cors from '@fastify/cors';
import fastify, { type FastifyInstance } from 'fastify';
import { pluginAutenticacion } from './plugins/auth.js';
import { pluginBaseDatos } from './plugins/database.js';
import { rutasSalud } from './routes/health.js';
import { rutasJugadores } from './routes/players.js';

export interface OpcionesConstruccionApp {
  logger?: boolean;
}
export type BuildAppOptions = OpcionesConstruccionApp;

/**
 * Factoría para inicializar y configurar la aplicación Fastify
 */
export function construirApp(opciones: OpcionesConstruccionApp = { logger: true }): FastifyInstance {
  const aplicacion = fastify({
    logger: opciones.logger,
  });

  // Habilitar CORS para permitir solicitudes del cliente frontend
  aplicacion.register(cors, {
    origin: true,
  });

  // Registrar plugin de conexión a PostgreSQL
  aplicacion.register(pluginBaseDatos);

  // Registrar plugin de autenticación (JWKS / Clerk)
  aplicacion.register(pluginAutenticacion);

  // Registrar rutas del sistema
  aplicacion.register(rutasSalud);
  aplicacion.register(rutasJugadores);

  return aplicacion;
}

// Alias para compatibilidad
export const buildApp = construirApp;
