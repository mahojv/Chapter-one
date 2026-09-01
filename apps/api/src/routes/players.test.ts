import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construirApp } from '../app.js';
import { verificarSaludBaseDatos } from '../db/client.js';

describe('Endpoints de Jugadores (Players API)', () => {
  const aplicacion = construirApp({ logger: false });
  let estaBdDisponible = false;

  beforeAll(async () => {
    await aplicacion.ready();
    estaBdDisponible = await verificarSaludBaseDatos();
  });

  afterAll(async () => {
    await aplicacion.close();
  });

  describe('Validaciones HTTP (Capa de Rutas)', () => {
    it('POST /players debe rechazar username con menos de 3 caracteres con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
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

    it('POST /players debe rechazar payload sin displayName con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        payload: {
          username: 'jugador_valido',
        },
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('VALIDATION_ERROR');
    });

    it('GET /players/:id debe rechazar ID que no sea UUID con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: '/players/id-invalido-123',
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('INVALID_ID_PARAMETER');
    });

    it('PATCH /players/:id debe rechazar ID que no sea UUID con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: '/players/id-no-uuid',
        payload: {
          displayName: 'Nuevo Nombre',
        },
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('INVALID_ID_PARAMETER');
    });

    it('PATCH /players/:id debe rechazar payload vacío con 400', async () => {
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: '/players/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        payload: {},
      });

      expect(respuesta.statusCode).toBe(400);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Operaciones con Base de Datos (Integración)', () => {
    const sufijoAleatorio = Math.floor(Math.random() * 1000000);
    const nombreUsuarioPrueba = `test_hero_${sufijoAleatorio}`;
    let idJugadorCreado: string;

    it('POST /players debe crear un jugador e inicializar su progreso atómicamente con 201', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        payload: {
          username: nombreUsuarioPrueba,
          displayName: 'Héroe de Prueba',
          timezone: 'America/Mexico_City',
        },
      });

      expect(respuesta.statusCode).toBe(201);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.id).toBeDefined();
      expect(cuerpo.data.username).toBe(nombreUsuarioPrueba);
      expect(cuerpo.data.displayName).toBe('Héroe de Prueba');
      expect(cuerpo.data.timezone).toBe('America/Mexico_City');

      // Verificar progreso inicial generado automáticamente
      expect(cuerpo.data.progress).toBeDefined();
      expect(cuerpo.data.progress.currentLevel).toBe(1);
      expect(cuerpo.data.progress.totalXp).toBe(0);
      expect(cuerpo.data.progress.unspentSkillPoints).toBe(0);
      expect(cuerpo.data.progress.totalSkillPointsEarned).toBe(0);

      idJugadorCreado = cuerpo.data.id;
    });

    it('POST /players debe rechazar username duplicado con 409 Conflict', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const respuestaDuplicada = await aplicacion.inject({
        method: 'POST',
        url: '/players',
        payload: {
          username: nombreUsuarioPrueba,
          displayName: 'Intento Duplicado',
        },
      });

      expect(respuestaDuplicada.statusCode).toBe(409);
      const cuerpo = JSON.parse(respuestaDuplicada.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('PLAYER_CONFLICT');
    });

    it('GET /players/:id debe retornar 200 con el jugador y su progreso si existe', async () => {
      if (!estaBdDisponible || !idJugadorCreado) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: `/players/${idJugadorCreado}`,
      });

      expect(respuesta.statusCode).toBe(200);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.id).toBe(idJugadorCreado);
      expect(cuerpo.data.username).toBe(nombreUsuarioPrueba);
      expect(cuerpo.data.progress.currentLevel).toBe(1);
    });

    it('GET /players/:id debe retornar 404 si el jugador no existe', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const uuidInexistente = '00000000-0000-0000-0000-000000000000';
      const respuesta = await aplicacion.inject({
        method: 'GET',
        url: `/players/${uuidInexistente}`,
      });

      expect(respuesta.statusCode).toBe(404);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('PLAYER_NOT_FOUND');
    });

    it('PATCH /players/:id debe actualizar el jugador y retornar 200', async () => {
      if (!estaBdDisponible || !idJugadorCreado) {
        expect(true).toBe(true);
        return;
      }

      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: `/players/${idJugadorCreado}`,
        payload: {
          displayName: 'Héroe Renombrado',
          timezone: 'Europe/Madrid',
        },
      });

      expect(respuesta.statusCode).toBe(200);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(true);
      expect(cuerpo.data.displayName).toBe('Héroe Renombrado');
      expect(cuerpo.data.timezone).toBe('Europe/Madrid');
    });

    it('PATCH /players/:id debe retornar 404 al intentar actualizar un jugador inexistente', async () => {
      if (!estaBdDisponible) {
        expect(true).toBe(true);
        return;
      }

      const uuidInexistente = '00000000-0000-0000-0000-000000000000';
      const respuesta = await aplicacion.inject({
        method: 'PATCH',
        url: `/players/${uuidInexistente}`,
        payload: {
          displayName: 'Fantasma',
        },
      });

      expect(respuesta.statusCode).toBe(404);
      const cuerpo = JSON.parse(respuesta.body);
      expect(cuerpo.success).toBe(false);
      expect(cuerpo.error.code).toBe('PLAYER_NOT_FOUND');
    });
  });
});
