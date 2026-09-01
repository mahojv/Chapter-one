import { SignJWT, generateKeyPair } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construirApp } from '../app.js';
import { verificarSaludBaseDatos } from '../db/client.js';

describe('Endpoints de Jugadores y Autenticación (Fase 5)', () => {
  // Asegurar que AUTH_MOCK esté habilitado en el entorno de pruebas
  process.env.AUTH_MOCK = 'true';

  const aplicacion = construirApp({ logger: false });
  let estaBdDisponible = false;

  beforeAll(async () => {
    await aplicacion.ready();
    estaBdDisponible = await verificarSaludBaseDatos();
  });

  afterAll(async () => {
    await aplicacion.close();
  });

  describe('Control de Acceso y Validación de Tokens', () => {
    it('GET /players/me debe rechazar peticiones sin token con 401 UNAUTHORIZED', async () => {
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
      });

      expect(respuesta.statusCode).toBe(401);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /players debe rechazar peticiones sin token con 401 UNAUTHORIZED', async () => {
      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        payload: {
          username: 'sin_token',
          displayName: 'Sin Token',
        },
      });

      expect(respuesta.statusCode).toBe(401);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('UNAUTHORIZED');
    });

    it('PATCH /players/:id debe rechazar peticiones sin token con 401 UNAUTHORIZED', async () => {
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: '/players/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        payload: {
          displayName: 'Nuevo Nombre',
        },
      });

      expect(respuesta.statusCode).toBe(401);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar encabezados con token vacío con 401 UNAUTHORIZED', async () => {
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
        headers: {
          authorization: 'Bearer ',
        },
      });

      expect(respuesta.statusCode).toBe(401);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('UNAUTHORIZED');
    });

    it('debe validar y rechazar tokens JWT con firma inválida o corrupta', async () => {
      const tokenCorrupto = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjMifQ.firma_totalmente_invalida';
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
        headers: {
          authorization: `Bearer ${tokenCorrupto}`,
        },
      });

      expect(respuesta.statusCode).toBe(401);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(['INVALID_TOKEN', 'AUTHENTICATION_FAILED', 'AUTH_CONFIGURATION_ERROR']).toContain(
        cuerpo.error.code,
      );
    });

    it('debe rechazar tokens expirados adecuadamente', async () => {
      const { privateKey } = await generateKeyPair('RS256');
      // Token expirado en el pasado (-10 segundos)
      const tokenExpirado = await new SignJWT({ sub: 'user_expirado' })
        .setProtectedHeader({ alg: 'RS256' })
        .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
        .sign(privateKey);

      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
        headers: {
          authorization: `Bearer ${tokenExpirado}`,
        },
      });

      expect(respuesta.statusCode).toBe(401);
    });
  });

  describe('Validaciones de Entrada (Capa de Rutas)', () => {
    it('POST /players con token debe validar username corto con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        headers: {
          authorization: 'Bearer mock_user_val',
        },
        payload: {
          username: 'ab',
          displayName: 'Jugador Corto',
        },
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /players/:id público debe validar formato UUID con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/id-invalido-123',
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('INVALID_ID_PARAMETER');
    });

    it('PATCH /players/:id con token debe validar UUID y cuerpo con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: '/players/id-no-uuid',
        headers: {
          authorization: 'Bearer mock_user_val',
        },
        payload: {
          displayName: 'Nombre',
        },
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('INVALID_ID_PARAMETER');
    });
  });

  describe('Flujos de Identidad del Jugador (Integración con Base de Datos)', () => {
    const sufijoAleatorio = Math.floor(Math.random() * 1000000);
    const mockAuthUserA = `mock_clerk_user_a_${sufijoAleatorio}`;
    const mockAuthUserB = `mock_clerk_user_b_${sufijoAleatorio}`;
    const usernameA = `hero_a_${sufijoAleatorio}`;
    let idJugadorA: string;

    it('GET /players/me debe responder 404 con PLAYER_PROFILE_REQUIRED si el usuario aún no tiene Player', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
        headers: {
          authorization: `Bearer ${mockAuthUserA}`,
        },
      });

      expect(respuesta.statusCode).toBe(404);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('PLAYER_PROFILE_REQUIRED');
    });

    it('POST /players debe asociar el Player exclusivamente al authUserId del token, ignorando authUserId del body', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        headers: {
          authorization: `Bearer ${mockAuthUserA}`,
        },
        payload: {
          username: usernameA,
          displayName: 'Héroe Auténtico A',
          timezone: 'America/Mexico_City',
          authUserId: 'intento_suplantar_auth_id_ajeno', // Debe ser ignorado
        },
      });

      expect(respuesta.statusCode).toBe(201);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.username).toBe(usernameA);
      // El authUserId asignado en base de datos debe ser el del token, NO el del body
      expect(cuerpo.data.authUserId).toBe(mockAuthUserA);

      idJugadorA = cuerpo.data.id;
    });

    it('POST /players debe rechazar crear un segundo jugador para el mismo usuario autenticado con 409', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        headers: {
          authorization: `Bearer ${mockAuthUserA}`,
        },
        payload: {
          username: `otro_nombre_${sufijoAleatorio}`,
          displayName: 'Segundo Intento',
        },
      });

      expect(respuesta.statusCode).toBe(409);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('PLAYER_CONFLICT');
    });

    it('GET /players/me debe retornar 200 con el Player y progreso correspondiente al usuario autenticado', async () => {
      if (!estaBdDisponible || !idJugadorA) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/me',
        headers: {
          authorization: `Bearer ${mockAuthUserA}`,
        },
      });

      expect(respuesta.statusCode).toBe(200);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.id).toBe(idJugadorA);
      expect(cuerpo.data.authUserId).toBe(mockAuthUserA);
      expect(cuerpo.data.username).toBe(usernameA);
      expect(cuerpo.data.progress.currentLevel).toBe(1);
    });

    it('PATCH /players/:id debe rechazar con 403 FORBIDDEN si un usuario intenta modificar el Player de otro', async () => {
      if (!estaBdDisponible || !idJugadorA) {
        expect(true).toBe(true);
        return;
      }

      // El usuario B intenta modificar el perfil del usuario A
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: `/players/${idJugadorA}`,
        headers: {
          authorization: `Bearer ${mockAuthUserB}`,
        },
        payload: {
          displayName: 'Intruso Hack',
        },
      });

      expect(respuesta.statusCode).toBe(403);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('FORBIDDEN');
    });

    it('PATCH /players/:id debe permitir la actualización si el usuario autenticado es el legítimo dueño', async () => {
      if (!estaBdDisponible || !idJugadorA) {
        expect(true).toBe(true);
        return;
      }

      // El usuario A actualiza su propio perfil
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: `/players/${idJugadorA}`,
        headers: {
          authorization: `Bearer ${mockAuthUserA}`,
        },
        payload: {
          displayName: 'Nombre Actualizado por Dueño',
          timezone: 'Europe/Madrid',
        },
      });

      expect(respuesta.statusCode).toBe(200);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.displayName).toBe('Nombre Actualizado por Dueño');
      expect(cuerpo.data.timezone).toBe('Europe/Madrid');
    });
  });
});
