import dotenv from 'dotenv';
import pg, { type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

dotenv.config();

const { Pool } = pg;

/**
 * Configuración para la conexión con PostgreSQL
 */
export interface ConfiguracionBaseDatos {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}
export type DatabaseConfig = ConfiguracionBaseDatos;

/**
 * Obtiene la configuración de conexión desde las variables de entorno
 */
export function obtenerConfiguracionBaseDatos(): ConfiguracionBaseDatos {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT || 2000),
    };
  }

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5432),
    database: process.env.POSTGRES_DB || 'chapter_one_dev',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT || 30000),
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT || 2000),
  };
}
export const getDatabaseConfig = obtenerConfiguracionBaseDatos;

// Instancia única del pool de conexiones (Singleton)
let instanciaPool: pg.Pool | null = null;

/**
 * Retorna la instancia activa del pool de conexiones
 */
export function obtenerPool(configuracion: ConfiguracionBaseDatos = obtenerConfiguracionBaseDatos()): pg.Pool {
  if (!instanciaPool) {
    instanciaPool = new Pool(configuracion);

    instanciaPool.on('error', (error: Error) => {
      console.error('Error inesperado en cliente inactivo de PostgreSQL:', error);
    });
  }
  return instanciaPool;
}
export const getPool = obtenerPool;

/**
 * Ejecuta una consulta SQL parametrizada utilizando el pool
 */
export async function consultar<R extends QueryResultRow = QueryResultRow, I = unknown[]>(
  textoSql: string,
  parametros?: I,
): Promise<QueryResult<R>> {
  const pool = obtenerPool();
  return pool.query<R>(textoSql, parametros as unknown as unknown[]);
}
export const query = consultar;

/**
 * Adquiere un cliente dedicado del pool para transacciones
 */
export async function obtenerCliente(): Promise<PoolClient> {
  const pool = obtenerPool();
  return pool.connect();
}
export const getClient = obtenerCliente;

/**
 * Cierra todas las conexiones activas del pool
 */
export async function cerrarPool(): Promise<void> {
  if (instanciaPool) {
    await instanciaPool.end();
    instanciaPool = null;
  }
}
export const closePool = cerrarPool;

/**
 * Comprueba si la base de datos responde correctamente a una consulta básica
 */
export async function verificarSaludBaseDatos(): Promise<boolean> {
  try {
    const resultado = await consultar('SELECT 1 as salud');
    return resultado.rowCount === 1;
  } catch {
    return false;
  }
}
export const checkDatabaseHealth = verificarSaludBaseDatos;
