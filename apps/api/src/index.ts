import dotenv from 'dotenv';
import { buildApp } from './app.js';

// Load environment variables from .env if present
dotenv.config();

const port = Number(process.env.API_PORT || process.env.PORT || 3001);
const host = process.env.API_HOST || '0.0.0.0';

const app = buildApp({
  logger: process.env.NODE_ENV !== 'test',
});

async function start() {
  try {
    await app.listen({ port, host });
    app.log.info(`Chapter One API server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, closing server...`);
    await app.close();
    process.exit(0);
  });
}

start();
