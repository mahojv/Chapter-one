import { describe, expect, it } from 'vitest';
import { esquemaParametrosPaginacion, esquemaRespuestaSalud } from './index.js';

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
});
