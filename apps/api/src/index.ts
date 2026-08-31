import dotenv from 'dotenv';
import { construirApp } from './app.js';

// Cargar variables de entorno desde .env si existe
dotenv.config();

const puerto = Number(process.env.API_PORT || process.env.PORT || 3001);
const anfitrion = process.env.API_HOST || '0.0.0.0';

const aplicacion = construirApp({
  logger: process.env.NODE_ENV !== 'test',
});

async function iniciarServidor() {
  try {
    await aplicacion.listen({ port: puerto, host: anfitrion });
    aplicacion.log.info(`Servidor API de Chapter One escuchando en http://${anfitrion}:${puerto}`);
  } catch (error) {
    aplicacion.log.error(error);
    process.exit(1);
  }
}

// Cierre ordenado y controlado (graceful shutdown)
const senalesTerminacion = ['SIGINT', 'SIGTERM'] as const;
for (const senal of senalesTerminacion) {
  process.on(senal, async () => {
    aplicacion.log.info(`Señal ${senal} recibida, cerrando servidor...`);
    await aplicacion.close();
    process.exit(0);
  });
}

iniciarServidor();
