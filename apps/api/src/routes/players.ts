import type { FastifyPluginAsync } from 'fastify';
import {
  esquemaActualizarJugador,
  esquemaCrearJugador,
  esquemaParametroIdJugador,
} from '@chapter-one/validation';
import {
  ErrorConflictoJugador,
  ErrorJugadorNoEncontrado,
  servicioJugadores,
} from '../services/playerService.js';

/**
 * Rutas de la API para la gestión de Jugadores (Fase 4: Vertical Slice)
 */
export const rutasJugadores: FastifyPluginAsync = async (servidor) => {
  /**
   * POST /players
   * Crea un nuevo jugador y su registro de progreso inicial de forma atómica
   */
  servidor.post('/players', async (solicitud, respuesta) => {
    // Validar carga útil con Zod
    const resultadoValidacion = esquemaCrearJugador.safeParse(solicitud.body);
    if (!resultadoValidacion.success) {
      return respuesta.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos proporcionados para crear el jugador son inválidos',
          details: resultadoValidacion.error.format(),
        },
      });
    }

    try {
      const pool = servidor.db.getPool();
      const jugadorCreado = await servicioJugadores.crearJugador(pool, resultadoValidacion.data);

      return respuesta.status(201).send({
        success: true,
        data: jugadorCreado,
      });
    } catch (error: unknown) {
      if (error instanceof ErrorConflictoJugador) {
        return respuesta.status(error.statusCode).send({
          success: false,
          error: {
            code: error.codigo,
            message: error.message,
          },
        });
      }

      servidor.log.error(error, 'Error al crear jugador');
      return respuesta.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocurrió un error inesperado al procesar la solicitud',
        },
      });
    }
  });

  /**
   * GET /players/:id
   * Obtiene la información del jugador y su progreso actual por su UUID
   */
  servidor.get('/players/:id', async (solicitud, respuesta) => {
    // Validar parámetro de ruta
    const resultadoParam = esquemaParametroIdJugador.safeParse(solicitud.params);
    if (!resultadoParam.success) {
      return respuesta.status(400).send({
        success: false,
        error: {
          code: 'INVALID_ID_PARAMETER',
          message: 'El identificador del jugador debe ser un UUID válido',
          details: resultadoParam.error.format(),
        },
      });
    }

    try {
      const pool = servidor.db.getPool();
      const jugador = await servicioJugadores.obtenerJugadorPorId(pool, resultadoParam.data.id);

      return respuesta.status(200).send({
        success: true,
        data: jugador,
      });
    } catch (error: unknown) {
      if (error instanceof ErrorJugadorNoEncontrado) {
        return respuesta.status(error.statusCode).send({
          success: false,
          error: {
            code: error.codigo,
            message: error.message,
          },
        });
      }

      servidor.log.error(error, 'Error al obtener jugador');
      return respuesta.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocurrió un error inesperado al consultar el jugador',
        },
      });
    }
  });

  /**
   * PATCH /players/:id
   * Actualiza parcialmente los datos editables del jugador
   */
  servidor.patch('/players/:id', async (solicitud, respuesta) => {
    // Validar parámetro de ruta
    const resultadoParam = esquemaParametroIdJugador.safeParse(solicitud.params);
    if (!resultadoParam.success) {
      return respuesta.status(400).send({
        success: false,
        error: {
          code: 'INVALID_ID_PARAMETER',
          message: 'El identificador del jugador debe ser un UUID válido',
          details: resultadoParam.error.format(),
        },
      });
    }

    // Validar cuerpo de actualización
    const resultadoBody = esquemaActualizarJugador.safeParse(solicitud.body);
    if (!resultadoBody.success) {
      return respuesta.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos proporcionados para actualizar el jugador son inválidos',
          details: resultadoBody.error.format(),
        },
      });
    }

    try {
      const pool = servidor.db.getPool();
      const jugadorActualizado = await servicioJugadores.actualizarJugador(
        pool,
        resultadoParam.data.id,
        resultadoBody.data,
      );

      return respuesta.status(200).send({
        success: true,
        data: jugadorActualizado,
      });
    } catch (error: unknown) {
      if (error instanceof ErrorJugadorNoEncontrado) {
        return respuesta.status(error.statusCode).send({
          success: false,
          error: {
            code: error.codigo,
            message: error.message,
          },
        });
      }

      if (error instanceof ErrorConflictoJugador) {
        return respuesta.status(error.statusCode).send({
          success: false,
          error: {
            code: error.codigo,
            message: error.message,
          },
        });
      }

      servidor.log.error(error, 'Error al actualizar jugador');
      return respuesta.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Ocurrió un error inesperado al actualizar el jugador',
        },
      });
    }
  });
};

export const playerRoutes = rutasJugadores;
