import { esquemaRespuestaSalud } from '@chapter-one/validation';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construirApp } from '../app.js';

describe('Endpoint GET /health', () => {
  const aplicacion = construirApp({ logger: false });

  beforeAll(async () => {
    await aplicacion.ready();
  });

  afterAll(async () => {
    await aplicacion.close();
  });

  it('debe responder 200 OK con una carga útil válida de estado de salud', async () => {
    const respuesta = await aplicacion.inject({
      method: 'GET',
      url: '/health',
    });

    expect(respuesta.statusCode).toBe(200);

    const cuerpo = JSON.parse(respuesta.body);
    expect(cuerpo.status).toBe('ok');
    expect(typeof cuerpo.uptime).toBe('number');
    expect(typeof cuerpo.timestamp).toBe('string');
    expect(cuerpo.version).toBe('0.1.0');

    // Validación de esquema mediante el paquete compartido @chapter-one/validation
    const resultadoValidacion = esquemaRespuestaSalud.safeParse(cuerpo);
    expect(resultadoValidacion.success).toBe(true);
  });
});
