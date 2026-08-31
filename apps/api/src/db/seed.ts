import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cerrarPool, obtenerCliente } from './client.js';

const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

/**
 * Ejecuta los scripts de datos iniciales (seeds) de la base de datos
 */
export async function ejecutarSeeds(): Promise<void> {
  const cliente = await obtenerCliente();

  try {
    console.log('[Semillas] Iniciando inserción de datos iniciales...');

    const directorioSeeds = path.join(directorioActual, 'seeds');
    const archivos = fs
      .readdirSync(directorioSeeds)
      .filter((archivo) => archivo.endsWith('.sql'))
      .sort();

    for (const archivo of archivos) {
      console.log(`[Semillas] Aplicando ${archivo}...`);
      const consultaSql = fs.readFileSync(path.join(directorioSeeds, archivo), 'utf-8');

      await cliente.query('BEGIN');
      try {
        await cliente.query(consultaSql);
        await cliente.query('COMMIT');
        console.log(`[Semillas] ${archivo} aplicada exitosamente.`);
      } catch (errorSeed) {
        await cliente.query('ROLLBACK');
        console.error(`[Semillas] Error al aplicar ${archivo}:`, errorSeed);
        throw errorSeed;
      }
    }

    console.log('[Semillas] Todos los datos iniciales fueron aplicados con éxito.');
  } finally {
    cliente.release();
    await cerrarPool();
  }
}
export const runSeeds = ejecutarSeeds;

// Ejecución directa desde terminal/CLI
if (process.argv[1] === rutaArchivoActual) {
  ejecutarSeeds().catch((error) => {
    console.error('[Semillas] El proceso de seeds falló:', error);
    process.exit(1);
  });
}
