import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clienteApi, ErrorApi } from './api';

describe('Cliente API de Chapter One Mobile', () => {
  const tokenMock = 'mock_jwt_token_123';
  let obtenerTokenMock: () => Promise<string | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    obtenerTokenMock = vi.fn().mockResolvedValue(tokenMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('obtenerMiPerfil (GET /players/me)', () => {
    it('debe lanzar ErrorApi 401 si no hay token disponible', async () => {
      const obtenerTokenVacio = vi.fn().mockResolvedValue(null);

      await expect(clienteApi.obtenerMiPerfil(obtenerTokenVacio)).rejects.toThrow(ErrorApi);
      await expect(clienteApi.obtenerMiPerfil(obtenerTokenVacio)).rejects.toMatchObject({
        status: 401,
        code: 'UNAUTHORIZED',
      });
    });

    it('debe retornar el perfil y progreso del jugador cuando el backend responde 200', async () => {
      const jugadorEsperado = {
        id: '11111111-1111-1111-1111-111111111111',
        authUserId: 'user_clerk_123',
        username: 'guerrero_sol',
        displayName: 'Guerrero del Sol',
        timezone: 'America/Mexico_City',
        progress: {
          totalXp: 150,
          currentLevel: 2,
          unspentSkillPoints: 1,
          totalSkillPointsEarned: 1,
        },
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: jugadorEsperado,
        }),
      } as unknown as Response);

      const resultado = await clienteApi.obtenerMiPerfil(obtenerTokenMock);

      expect(resultado).toEqual(jugadorEsperado);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/players/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${tokenMock}`,
          }),
        }),
      );
    });

    it('debe distinguir específicamente el error 404 PLAYER_PROFILE_REQUIRED para nuevo usuario', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: {
            code: 'PLAYER_PROFILE_REQUIRED',
            message: 'El usuario aún no tiene un perfil de jugador creado',
          },
        }),
      } as unknown as Response);

      try {
        await clienteApi.obtenerMiPerfil(obtenerTokenMock);
        expect.unreachable('Debería haber lanzado un ErrorApi');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ErrorApi);
        const errApi = error as ErrorApi;
        expect(errApi.status).toBe(404);
        expect(errApi.code).toBe('PLAYER_PROFILE_REQUIRED');
      }
    });

    it('debe propagar otros errores HTTP como ErrorApi genérico', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error interno en la base de datos',
          },
        }),
      } as unknown as Response);

      await expect(clienteApi.obtenerMiPerfil(obtenerTokenMock)).rejects.toMatchObject({
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
      });
    });
  });

  describe('crearJugador (POST /players)', () => {
    it('debe lanzar ErrorApi 401 si no hay token disponible', async () => {
      const obtenerTokenVacio = vi.fn().mockResolvedValue(null);

      await expect(
        clienteApi.crearJugador(obtenerTokenVacio, {
          username: 'nuevo_heroe',
          displayName: 'Nuevo Héroe',
        }),
      ).rejects.toThrow(ErrorApi);
    });

    it('debe enviar POST /players SIN enviar authUserId en el cuerpo', async () => {
      const jugadorCreado = {
        id: '22222222-2222-2222-2222-222222222222',
        authUserId: 'user_clerk_123',
        username: 'nuevo_heroe',
        displayName: 'Nuevo Héroe',
        timezone: 'UTC',
        progress: {
          totalXp: 0,
          currentLevel: 1,
          unspentSkillPoints: 0,
          totalSkillPointsEarned: 0,
        },
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      };

      let bodyCapturado = '';
      global.fetch = vi.fn().mockImplementation(async (_url, opciones) => {
        bodyCapturado = opciones.body;
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: jugadorCreado,
          }),
        } as unknown as Response;
      });

      const resultado = await clienteApi.crearJugador(obtenerTokenMock, {
        username: 'nuevo_heroe',
        displayName: 'Nuevo Héroe',
        timezone: 'UTC',
      });

      expect(resultado).toEqual(jugadorCreado);

      const parsedBody = JSON.parse(bodyCapturado);
      expect(parsedBody.username).toBe('nuevo_heroe');
      expect(parsedBody.displayName).toBe('Nuevo Héroe');
      expect(parsedBody.timezone).toBe('UTC');
      // REGLA CRÍTICA: El cliente NUNCA debe enviar authUserId
      expect(parsedBody.authUserId).toBeUndefined();
    });

    it('debe manejar error 409 si el nombre de usuario ya está tomado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          error: {
            code: 'PLAYER_CONFLICT',
            message: "El nombre de usuario 'nuevo_heroe' ya está en uso",
          },
        }),
      } as unknown as Response);

      await expect(
        clienteApi.crearJugador(obtenerTokenMock, {
          username: 'nuevo_heroe',
          displayName: 'Nuevo Héroe',
        }),
      ).rejects.toMatchObject({
        status: 409,
        code: 'PLAYER_CONFLICT',
      });
    });
  });
});
