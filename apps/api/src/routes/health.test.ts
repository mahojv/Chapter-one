import { healthResponseSchema } from '@chapter-one/validation';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';

describe('GET /health', () => {
  const app = buildApp({ logger: false });

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 OK with valid health status payload', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    expect(typeof body.timestamp).toBe('string');
    expect(body.version).toBe('0.1.0');

    // Schema validation through shared @chapter-one/validation package
    const parseResult = healthResponseSchema.safeParse(body);
    expect(parseResult.success).toBe(true);
  });
});
