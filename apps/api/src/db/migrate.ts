import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cerrarPool, obtenerCliente } from './client.js';

const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

/**
 * Ejecuta todas las migraciones SQL pendientes en orden cronológico
 */
export async function ejecutarMigraciones(): Promise<void> {
  const cliente = await obtenerCliente();

  try {
    console.log('[Migración] Iniciando proceso de migración de base de datos...');

    // Crear tabla de control de migraciones si no existe
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const directorioMigraciones = path.join(directorioActual, 'migrations');
    if (!fs.existsSync(directorioMigraciones)) {
      console.log('[Migración] No se encontró el directorio de migraciones.');
      return;
    }

    const archivos = fs
      .readdirSync(directorioMigraciones)
      .filter((archivo) => archivo.endsWith('.sql'))
      .sort();

    for (const archivo of archivos) {
      const yaEjecutada = await cliente.query(
        'SELECT 1 FROM _schema_migrations WHERE name = $1',
        [archivo],
      );

      if (yaEjecutada.rowCount && yaEjecutada.rowCount > 0) {
        console.log(`[Migración] Omitiendo ${archivo} (ya fue ejecutada).`);
        continue;
      }

      console.log(`[Migración] Ejecutando ${archivo}...`);
      const consultaSql = fs.readFileSync(path.join(directorioMigraciones, archivo), 'utf-8');

      await cliente.query('BEGIN');
      try {
        await cliente.query(consultaSql);
        await cliente.query('INSERT INTO _schema_migrations (name) VALUES ($1)', [archivo]);
        await cliente.query('COMMIT');
        console.log(`[Migración] ${archivo} ejecutada exitosamente.`);
      } catch (errorMigracion) {
        await cliente.query('ROLLBACK');
        console.error(`[Migración] Error al ejecutar ${archivo}:`, errorMigracion);
        throw errorMigracion;
      }
    }

    console.log('[Migración] Todas las migraciones se completaron con éxito.');
  } finally {
    cliente.release();
    await cerrarPool();
  }
}
export const runMigrations = ejecutarMigraciones;

// Ejecución directa desde terminal/CLI
if (process.argv[1] === rutaArchivoActual) {
  ejecutarMigraciones().catch((error) => {
    console.error('[Migración] El proceso de migración falló:', error);
    process.exit(1);
  });
}
