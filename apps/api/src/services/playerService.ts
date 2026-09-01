import type { Pool } from 'pg';
import type { EntradaActualizarJugador, EntradaCrearJugador } from '@chapter-one/validation';
import {
  type FilaJugadorConProgreso,
  repositorioJugadores,
  type RepositorioJugadores,
} from '../repositories/playerRepository.js';

/**
 * Clases de error de dominio para la gestión de jugadores e identidad
 */
export class ErrorJugadorNoEncontrado extends Error {
  readonly codigo = 'PLAYER_NOT_FOUND';
  readonly statusCode = 404;

  constructor(id: string) {
    super(`No se encontró ningún jugador con el identificador: ${id}`);
    this.name = 'ErrorJugadorNoEncontrado';
  }
}

export class ErrorPerfilJugadorRequerido extends Error {
  readonly codigo = 'PLAYER_PROFILE_REQUIRED';
  readonly statusCode = 404;

  constructor(authUserId: string) {
    super(`El usuario autenticado '${authUserId}' aún no tiene un perfil de jugador creado`);
    this.name = 'ErrorPerfilJugadorRequerido';
  }
}

export class ErrorConflictoJugador extends Error {
  readonly codigo = 'PLAYER_CONFLICT';
  readonly statusCode = 409;

  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorConflictoJugador';
  }
}

export class ErrorAccesoDenegadoJugador extends Error {
  readonly codigo = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor() {
    super('No tienes autorización para acceder o modificar este jugador');
    this.name = 'ErrorAccesoDenegadoJugador';
  }
}

/**
 * Estructuras de respuesta para el cliente API
 */
export interface ProgresoJugadorDto {
  totalXp: number;
  currentLevel: number;
  unspentSkillPoints: number;
  totalSkillPointsEarned: number;
}

export interface JugadorDto {
  id: string;
  authUserId: string | null;
  username: string;
  displayName: string;
  timezone: string;
  progress: ProgresoJugadorDto;
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio con la lógica de negocio para la gestión de Jugadores
 */
export class ServicioJugadores {
  constructor(private readonly repositorio: RepositorioJugadores = repositorioJugadores) {}

  /**
   * Crea un nuevo jugador y su registro de progreso inicial de forma atómica.
   * El authUserId proviene obligatoriamente del token validado, nunca del cliente.
   */
  async crearJugador(
    pool: Pool,
    datos: EntradaCrearJugador,
    authUserIdSeguro: string,
  ): Promise<JugadorDto> {
    // Verificar si el usuario autenticado ya posee un jugador registrado
    const jugadorExistente = await this.repositorio.buscarPorAuthUserId(pool, authUserIdSeguro);
    if (jugadorExistente) {
      throw new ErrorConflictoJugador('El usuario autenticado ya posee un perfil de jugador creado');
    }

    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');

      // Se fuerza el uso del authUserIdSeguro verificado en el token
      const datosSeguros: EntradaCrearJugador = {
        ...datos,
        authUserId: authUserIdSeguro,
      };

      const jugador = await this.repositorio.insertarJugador(cliente, datosSeguros, authUserIdSeguro);
      const progreso = await this.repositorio.insertarProgresoInicial(cliente, jugador.id);

      await cliente.query('COMMIT');

      return {
        id: jugador.id,
        authUserId: jugador.auth_user_id,
        username: jugador.username,
        displayName: jugador.display_name,
        timezone: jugador.timezone,
        progress: {
          totalXp: Number(progreso.total_xp),
          currentLevel: progreso.current_level,
          unspentSkillPoints: progreso.unspent_skill_points,
          totalSkillPointsEarned: progreso.total_skill_points_earned,
        },
        createdAt: jugador.created_at.toISOString(),
        updatedAt: jugador.updated_at.toISOString(),
      };
    } catch (error: unknown) {
      await cliente.query('ROLLBACK');

      // Mapear error de restricción UNIQUE en PostgreSQL (código 23505)
      const errorPg = error as { code?: string; constraint?: string; detail?: string };
      if (errorPg.code === '23505') {
        if (errorPg.constraint?.includes('username') || errorPg.detail?.includes('username')) {
          throw new ErrorConflictoJugador(`El nombre de usuario '${datos.username}' ya está en uso`);
        }
        if (errorPg.constraint?.includes('auth_user_id') || errorPg.detail?.includes('auth_user_id')) {
          throw new ErrorConflictoJugador('El usuario autenticado ya tiene un jugador asociado');
        }
        throw new ErrorConflictoJugador('Ya existe un registro con los datos únicos proporcionados');
      }

      throw error;
    } finally {
      cliente.release();
    }
  }

  /**
   * Obtiene la información de un jugador y su progreso actual por su ID interno
   */
  async obtenerJugadorPorId(pool: Pool, id: string): Promise<JugadorDto> {
    const fila = await this.repositorio.buscarPorId(pool, id);

    if (!fila) {
      throw new ErrorJugadorNoEncontrado(id);
    }

    return this.mapearFilaAJugadorDto(fila);
  }

  /**
   * Obtiene el perfil de jugador asociado al usuario autenticado actual (GET /players/me)
   */
  async obtenerMiPerfilJugador(pool: Pool, authUserId: string): Promise<JugadorDto> {
    const fila = await this.repositorio.buscarPorAuthUserId(pool, authUserId);

    if (!fila) {
      throw new ErrorPerfilJugadorRequerido(authUserId);
    }

    return this.mapearFilaAJugadorDto(fila);
  }

  /**
   * Actualiza parcialmente la información de un jugador verificando que el usuario autenticado sea el dueño
   */
  async actualizarJugador(
    pool: Pool,
    id: string,
    datos: EntradaActualizarJugador,
    authUserIdSeguro: string,
  ): Promise<JugadorDto> {
    // 1. Verificar existencia del jugador
    const existente = await this.repositorio.buscarPorId(pool, id);
    if (!existente) {
      throw new ErrorJugadorNoEncontrado(id);
    }

    // 2. Control de acceso: el jugador debe pertenecer al usuario autenticado
    if (existente.auth_user_id !== authUserIdSeguro) {
      throw new ErrorAccesoDenegadoJugador();
    }

    try {
      // No se permite cambiar el authUserId
      const datosSaneados: EntradaActualizarJugador = {
        displayName: datos.displayName,
        timezone: datos.timezone,
      };

      const actualizado = await this.repositorio.actualizarJugador(pool, id, datosSaneados);
      if (!actualizado) {
        return this.mapearFilaAJugadorDto(existente);
      }

      return {
        id: actualizado.id,
        authUserId: actualizado.auth_user_id,
        username: actualizado.username,
        displayName: actualizado.display_name,
        timezone: actualizado.timezone,
        progress: {
          totalXp: Number(existente.total_xp),
          currentLevel: existente.current_level,
          unspentSkillPoints: existente.unspent_skill_points,
          totalSkillPointsEarned: existente.total_skill_points_earned,
        },
        createdAt: actualizado.created_at.toISOString(),
        updatedAt: actualizado.updated_at.toISOString(),
      };
    } catch (error: unknown) {
      const errorPg = error as { code?: string; constraint?: string; detail?: string };
      if (errorPg.code === '23505') {
        throw new ErrorConflictoJugador('Conflicto con un valor único al actualizar el jugador');
      }
      throw error;
    }
  }

  private mapearFilaAJugadorDto(fila: FilaJugadorConProgreso): JugadorDto {
    return {
      id: fila.id,
      authUserId: fila.auth_user_id,
      username: fila.username,
      displayName: fila.display_name,
      timezone: fila.timezone,
      progress: {
        totalXp: Number(fila.total_xp),
        currentLevel: fila.current_level,
        unspentSkillPoints: fila.unspent_skill_points,
        totalSkillPointsEarned: fila.total_skill_points_earned,
      },
      createdAt: fila.created_at.toISOString(),
      updatedAt: fila.updated_at.toISOString(),
    };
  }
}

export const servicioJugadores = new ServicioJugadores();
