import type { FastifyPluginAsync } from 'fastify';
import {
  esquemaActualizarJugador,
  esquemaCrearJugador,
  esquemaOtorgarXp,
  esquemaParametroIdJugador,
} from '@chapter-one/validation';
import {
  ErrorAccesoDenegadoJugador,
  ErrorConflictoJugador,
  ErrorJugadorNoEncontrado,
  ErrorPerfilJugadorRequerido,
  servicioJugadores,
} from '../services/playerService.js';

/**
 * Rutas de la API para la gestión de Jugadores e Identidad (Fase 5)
 */
export const rutasJugadores: FastifyPluginAsync = async (servidor) => {
  /**
   * GET /players/me
   * Obtiene el perfil del jugador correspondiente al usuario autenticado actual.
   * Si el usuario en Clerk aún no ha creado un personaje, retorna 404 con PLAYER_PROFILE_REQUIRED.
   */
  servidor.get(
    '/players/me',
    { preHandler: [servidor.authenticate] },
    async (solicitud, respuesta) => {
      try {
        const pool = servidor.db.getPool();
        const perfil = await servicioJugadores.obtenerMiPerfilJugador(
          pool,
          solicitud.authUserId,
        );

        return respuesta.status(200).send({
          success: true,
          data: perfil,
        });
      } catch (error: unknown) {
        if (error instanceof ErrorPerfilJugadorRequerido) {
          return respuesta.status(error.statusCode).send({
            success: false,
            error: {
              code: error.codigo,
              message: error.message,
            },
          });
        }

        servidor.log.error(error, 'Error al obtener perfil propio del jugador');
        return respuesta.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Ocurrió un error inesperado al consultar el perfil',
          },
        });
      }
    },
  );

  /**
   * POST /players/me/xp
   * Otorga XP al personaje del usuario autenticado actual y devuelve el progreso actualizado.
   */
  servidor.post(
    '/players/me/xp',
    { preHandler: [servidor.authenticate] },
    async (solicitud, respuesta) => {
      const resultadoValidacion = esquemaOtorgarXp.safeParse(solicitud.body);
      if (!resultadoValidacion.success) {
        return respuesta.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'La carga útil para otorgar XP es inválida',
            details: resultadoValidacion.error.format(),
          },
        });
      }

      try {
        const pool = servidor.db.getPool();
        // 1. Obtener mi perfil para conocer el playerId
        const miPerfil = await servicioJugadores.obtenerMiPerfilJugador(
          pool,
          solicitud.authUserId,
        );

        // 2. Otorgar XP al personaje
        const resultadoOtorgamiento = await servicioJugadores.otorgarXp(pool, {
          playerId: miPerfil.id,
          xpDelta: resultadoValidacion.data.xpDelta,
          reason: resultadoValidacion.data.reason,
          eventType: resultadoValidacion.data.eventType,
          sourceEntityType: resultadoValidacion.data.sourceEntityType,
          sourceEntityId: resultadoValidacion.data.sourceEntityId,
        });

        return respuesta.status(200).send({
          success: true,
          data: resultadoOtorgamiento,
        });
      } catch (error: unknown) {
        if (
          error instanceof ErrorPerfilJugadorRequerido ||
          error instanceof ErrorJugadorNoEncontrado
        ) {
          return respuesta.status(error.statusCode).send({
            success: false,
            error: {
              code: error.codigo,
              message: error.message,
            },
          });
        }

        servidor.log.error(error, 'Error al otorgar XP al jugador autenticado');
        return respuesta.status(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Ocurrió un error inesperado al procesar el otorgamiento de XP',
          },
        });
      }
    },
  );

  /**
   * POST /players
   * Crea un nuevo jugador y su progreso inicial de forma atómica.
   * Requiere autenticación: el Player queda enlazado exclusivamente al authUserId del token.
   */
  servidor.post(
    '/players',
    { preHandler: [servidor.authenticate] },
    async (solicitud, respuesta) => {
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
        // Se asocia inmutablemente con el authUserId del token validado
        const jugadorCreado = await servicioJugadores.crearJugador(
          pool,
          resultadoValidacion.data,
          solicitud.authUserId,
        );

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
    },
  );

  /**
   * GET /players/:id
   * Obtiene la información del jugador y su progreso actual por su UUID público.
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
   * Actualiza parcialmente los datos editables del jugador.
   * Requiere autenticación y comprueba que el usuario autenticado sea el dueño del jugador.
   */
  servidor.patch(
    '/players/:id',
    { preHandler: [servidor.authenticate] },
    async (solicitud, respuesta) => {
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
          solicitud.authUserId,
        );

        return respuesta.status(200).send({
          success: true,
          data: jugadorActualizado,
        });
      } catch (error: unknown) {
        if (error instanceof ErrorAccesoDenegadoJugador) {
          return respuesta.status(error.statusCode).send({
            success: false,
            error: {
              code: error.codigo,
              message: error.message,
            },
          });
        }

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
    },
  );
};

export const playerRoutes = rutasJugadores;
