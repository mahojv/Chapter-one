import type { Pool } from 'pg';
import type { EntradaActualizarJugador, EntradaCrearJugador } from '@chapter-one/validation';
import {
  type FilaJugadorConProgreso,
  repositorioJugadores,
  type RepositorioJugadores,
} from '../repositories/playerRepository.js';

/**
 * Clases de error de dominio para la gestión de jugadores
 */
export class ErrorJugadorNoEncontrado extends Error {
  readonly codigo = 'PLAYER_NOT_FOUND';
  readonly statusCode = 404;

  constructor(id: string) {
    super(`No se encontró ningún jugador con el identificador: ${id}`);
    this.name = 'ErrorJugadorNoEncontrado';
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
   * Crea un nuevo jugador y su registro de progreso inicial de forma atómica
   */
  async crearJugador(pool: Pool, datos: EntradaCrearJugador): Promise<JugadorDto> {
    const cliente = await pool.connect();

    try {
      await cliente.query('BEGIN');

      const jugador = await this.repositorio.insertarJugador(cliente, datos);
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
          throw new ErrorConflictoJugador(`El usuario de autenticación ya tiene un jugador asociado`);
        }
        throw new ErrorConflictoJugador('Ya existe un registro con los datos únicos proporcionados');
      }

      throw error;
    } finally {
      cliente.release();
    }
  }

  /**
   * Obtiene la información de un jugador y su progreso actual por su ID
   */
  async obtenerJugadorPorId(pool: Pool, id: string): Promise<JugadorDto> {
    const fila = await this.repositorio.buscarPorId(pool, id);

    if (!fila) {
      throw new ErrorJugadorNoEncontrado(id);
    }

    return this.mapearFilaAJugadorDto(fila);
  }

  /**
   * Actualiza parcialmente la información de un jugador
   */
  async actualizarJugador(
    pool: Pool,
    id: string,
    datos: EntradaActualizarJugador,
  ): Promise<JugadorDto> {
    // Verificar primero la existencia del jugador
    const existente = await this.repositorio.buscarPorId(pool, id);
    if (!existente) {
      throw new ErrorJugadorNoEncontrado(id);
    }

    try {
      const actualizado = await this.repositorio.actualizarJugador(pool, id, datos);
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
        throw new ErrorConflictoJugador('El identificador de autenticación ya está asignado a otro jugador');
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
