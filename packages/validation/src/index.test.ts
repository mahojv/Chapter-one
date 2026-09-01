import { describe, expect, it } from 'vitest';
import {
  esquemaActualizarJugador,
  esquemaCrearJugador,
  esquemaParametroIdJugador,
  esquemaParametrosPaginacion,
  esquemaRespuestaSalud,
} from './index.js';

describe('Esquemas de Validación', () => {
  describe('esquemaRespuestaSalud', () => {
    it('debe validar correctamente una respuesta de salud válida', () => {
      const cargaValida = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 10.5,
        version: '0.1.0',
        environment: 'test',
        database: 'connected',
      };

      const resultado = esquemaRespuestaSalud.safeParse(cargaValida);
      expect(resultado.success).toBe(true);
    });

    it('debe fallar ante un estado de salud no reconocido', () => {
      const cargaInvalida = {
        status: 'estado-desconocido',
        timestamp: new Date().toISOString(),
        uptime: 10.5,
        version: '0.1.0',
      };

      const resultado = esquemaRespuestaSalud.safeParse(cargaInvalida);
      expect(resultado.success).toBe(false);
    });
  });

  describe('esquemaParametrosPaginacion', () => {
    it('debe aplicar los valores de paginación por defecto', () => {
      const resultado = esquemaParametrosPaginacion.parse({});
      expect(resultado).toEqual({ page: 1, limit: 20 });
    });

    it('debe convertir números provenientes de cadenas de texto (query params)', () => {
      const resultado = esquemaParametrosPaginacion.parse({ page: '3', limit: '50' });
      expect(resultado).toEqual({ page: 3, limit: 50 });
    });
  });

  describe('esquemaCrearJugador', () => {
    it('debe validar un jugador con datos correctos', () => {
      const datos = {
        username: 'guerrero_7',
        displayName: 'Guerrero Número 7',
        timezone: 'America/Mexico_City',
        authUserId: 'auth0|123456',
      };
      const resultado = esquemaCrearJugador.safeParse(datos);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.username).toBe('guerrero_7');
        expect(resultado.data.timezone).toBe('America/Mexico_City');
      }
    });

    it('debe aplicar UTC por defecto si no se especifica timezone', () => {
      const datos = {
        username: 'jugador1',
        displayName: 'Jugador Uno',
      };
      const resultado = esquemaCrearJugador.safeParse(datos);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.timezone).toBe('UTC');
      }
    });

    it('debe fallar si el username tiene menos de 3 caracteres', () => {
      const datos = {
        username: 'ab',
        displayName: 'Jugador',
      };
      const resultado = esquemaCrearJugador.safeParse(datos);
      expect(resultado.success).toBe(false);
    });

    it('debe fallar si el username contiene caracteres inválidos', () => {
      const datos = {
        username: 'jugador con espacios!',
        displayName: 'Jugador',
      };
      const resultado = esquemaCrearJugador.safeParse(datos);
      expect(resultado.success).toBe(false);
    });

    it('debe fallar si falta el displayName', () => {
      const datos = {
        username: 'valido_123',
      };
      const resultado = esquemaCrearJugador.safeParse(datos);
      expect(resultado.success).toBe(false);
    });
  });

  describe('esquemaActualizarJugador', () => {
    it('debe validar una actualización parcial de displayName', () => {
      const datos = { displayName: 'Nuevo Nombre' };
      const resultado = esquemaActualizarJugador.safeParse(datos);
      expect(resultado.success).toBe(true);
    });

    it('debe validar una actualización parcial de timezone', () => {
      const datos = { timezone: 'Europe/Madrid' };
      const resultado = esquemaActualizarJugador.safeParse(datos);
      expect(resultado.success).toBe(true);
    });

    it('debe fallar si el objeto de actualización está completamente vacío', () => {
      const datos = {};
      const resultado = esquemaActualizarJugador.safeParse(datos);
      expect(resultado.success).toBe(false);
    });
  });

  describe('esquemaParametroIdJugador', () => {
    it('debe validar un UUID v4 válido', () => {
      const params = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };
      const resultado = esquemaParametroIdJugador.safeParse(params);
      expect(resultado.success).toBe(true);
    });

    it('debe fallar si el id no es un UUID', () => {
      const params = { id: '123-invalido' };
      const resultado = esquemaParametroIdJugador.safeParse(params);
      expect(resultado.success).toBe(false);
    });
  });
});
