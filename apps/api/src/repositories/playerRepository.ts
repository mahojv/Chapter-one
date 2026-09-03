import type { Pool, PoolClient } from 'pg';
import type { EntradaActualizarJugador, EntradaCrearJugador } from '@chapter-one/validation';

/**
 * Tipos de datos para las entidades de la base de datos
 */
export interface FilaJugador {
  id: string;
  auth_user_id: string | null;
  username: string;
  display_name: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface FilaProgresoJugador {
  player_id: string;
  total_xp: string | number;
  current_level: number;
  unspent_skill_points: number;
  total_skill_points_earned: number;
  last_level_up_at: Date | null;
  updated_at: Date;
}

export interface FilaJugadorConProgreso extends FilaJugador {
  total_xp: string | number;
  current_level: number;
  unspent_skill_points: number;
  total_skill_points_earned: number;
  progress_updated_at: Date;
}

export interface FilaEventoProgreso {
  id: string;
  player_id: string;
  event_type: string;
  source_entity_type: string;
  source_entity_id: string;
  xp_delta: number;
  skill_points_delta: number;
  reward_id: string | null;
  metadata: Record<string, unknown>;
  occurred_at: Date;
}

export type EjecutorSql = Pool | PoolClient;

/**
 * Repositorio de acceso a datos para Jugadores y su Progreso inicial
 */
export class RepositorioJugadores {
  /**
   * Inserta un nuevo jugador dentro de una transacción activa
   */
  async insertarJugador(
    cliente: PoolClient,
    datos: EntradaCrearJugador,
    authUserIdSeguro?: string,
  ): Promise<FilaJugador> {
    const consulta = `
      INSERT INTO players (auth_user_id, username, display_name, timezone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, auth_user_id, username, display_name, timezone, created_at, updated_at
    `;
    const valores = [
      authUserIdSeguro || datos.authUserId || null,
      datos.username,
      datos.displayName,
      datos.timezone || 'UTC',
    ];

    const resultado = await cliente.query<FilaJugador>(consulta, valores);
    return resultado.rows[0];
  }

  /**
   * Inserta el registro de progreso inicial para un jugador dentro de una transacción activa
   */
  async insertarProgresoInicial(
    cliente: PoolClient,
    jugadorId: string,
  ): Promise<FilaProgresoJugador> {
    const consulta = `
      INSERT INTO player_progress (
        player_id,
        total_xp,
        current_level,
        unspent_skill_points,
        total_skill_points_earned
      )
      VALUES ($1, 0, 1, 0, 0)
      RETURNING
        player_id,
        total_xp,
        current_level,
        unspent_skill_points,
        total_skill_points_earned,
        last_level_up_at,
        updated_at
    `;

    const resultado = await cliente.query<FilaProgresoJugador>(consulta, [jugadorId]);
    return resultado.rows[0];
  }

  /**
   * Obtiene la fila de progreso de un jugador adquiriendo un bloqueo exclusivo (FOR UPDATE)
   */
  async obtenerProgresoConBloqueo(
    ejecutor: EjecutorSql,
    playerId: string,
  ): Promise<FilaProgresoJugador | null> {
    const consulta = `
      SELECT
        player_id,
        total_xp,
        current_level,
        unspent_skill_points,
        total_skill_points_earned,
        last_level_up_at,
        updated_at
      FROM player_progress
      WHERE player_id = $1
      FOR UPDATE;
    `;

    const resultado = await ejecutor.query<FilaProgresoJugador>(consulta, [playerId]);
    return resultado.rows[0] || null;
  }

  /**
   * Actualiza el registro de progreso de un jugador dentro de una transacción activa
   */
  async actualizarProgreso(
    ejecutor: EjecutorSql,
    datos: {
      playerId: string;
      totalXp: number;
      currentLevel: number;
      unspentSkillPoints: number;
      totalSkillPointsEarned: number;
      huboSubidaNivel: boolean;
    },
  ): Promise<FilaProgresoJugador> {
    const consulta = `
      UPDATE player_progress
      SET
        total_xp = $2,
        current_level = $3,
        unspent_skill_points = $4,
        total_skill_points_earned = $5,
        last_level_up_at = CASE WHEN $6::boolean THEN NOW() ELSE last_level_up_at END,
        updated_at = NOW()
      WHERE player_id = $1
      RETURNING
        player_id,
        total_xp,
        current_level,
        unspent_skill_points,
        total_skill_points_earned,
        last_level_up_at,
        updated_at;
    `;

    const valores = [
      datos.playerId,
      datos.totalXp,
      datos.currentLevel,
      datos.unspentSkillPoints,
      datos.totalSkillPointsEarned,
      datos.huboSubidaNivel,
    ];

    const resultado = await ejecutor.query<FilaProgresoJugador>(consulta, valores);
    return resultado.rows[0];
  }

  /**
   * Inserta un evento de auditoría en la tabla progress_events dentro de una transacción activa
   */
  async insertarEventoProgreso(
    ejecutor: EjecutorSql,
    datos: {
      playerId: string;
      eventType: string;
      sourceEntityType: string;
      sourceEntityId: string;
      xpDelta: number;
      skillPointsDelta: number;
      metadata: Record<string, unknown>;
    },
  ): Promise<FilaEventoProgreso> {
    const consulta = `
      INSERT INTO progress_events (
        player_id,
        event_type,
        source_entity_type,
        source_entity_id,
        xp_delta,
        skill_points_delta,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING
        id,
        player_id,
        event_type,
        source_entity_type,
        source_entity_id,
        xp_delta,
        skill_points_delta,
        reward_id,
        metadata,
        occurred_at;
    `;

    const valores = [
      datos.playerId,
      datos.eventType,
      datos.sourceEntityType,
      datos.sourceEntityId,
      datos.xpDelta,
      datos.skillPointsDelta,
      JSON.stringify(datos.metadata),
    ];

    const resultado = await ejecutor.query<FilaEventoProgreso>(consulta, valores);
    return resultado.rows[0];
  }

  /**
   * Obtiene un jugador por su identificador único junto con su progreso actual
   */
  async buscarPorId(
    ejecutor: EjecutorSql,
    id: string,
  ): Promise<FilaJugadorConProgreso | null> {
    const consulta = `
      SELECT
        p.id,
        p.auth_user_id,
        p.username,
        p.display_name,
        p.timezone,
        p.created_at,
        p.updated_at,
        COALESCE(pp.total_xp, 0) AS total_xp,
        COALESCE(pp.current_level, 1) AS current_level,
        COALESCE(pp.unspent_skill_points, 0) AS unspent_skill_points,
        COALESCE(pp.total_skill_points_earned, 0) AS total_skill_points_earned,
        pp.updated_at AS progress_updated_at
      FROM players p
      LEFT JOIN player_progress pp ON p.id = pp.player_id
      WHERE p.id = $1
    `;

    const resultado = await ejecutor.query<FilaJugadorConProgreso>(consulta, [id]);
    return resultado.rows[0] || null;
  }

  /**
   * Obtiene un jugador por su identificador de autenticación externo (auth_user_id)
   */
  async buscarPorAuthUserId(
    ejecutor: EjecutorSql,
    authUserId: string,
  ): Promise<FilaJugadorConProgreso | null> {
    const consulta = `
      SELECT
        p.id,
        p.auth_user_id,
        p.username,
        p.display_name,
        p.timezone,
        p.created_at,
        p.updated_at,
        COALESCE(pp.total_xp, 0) AS total_xp,
        COALESCE(pp.current_level, 1) AS current_level,
        COALESCE(pp.unspent_skill_points, 0) AS unspent_skill_points,
        COALESCE(pp.total_skill_points_earned, 0) AS total_skill_points_earned,
        pp.updated_at AS progress_updated_at
      FROM players p
      LEFT JOIN player_progress pp ON p.id = pp.player_id
      WHERE p.auth_user_id = $1
    `;

    const resultado = await ejecutor.query<FilaJugadorConProgreso>(consulta, [authUserId]);
    return resultado.rows[0] || null;
  }

  /**
   * Busca un jugador por su nombre de usuario (para validar unicidad previa si fuera necesario)
   */
  async buscarPorUsername(
    ejecutor: EjecutorSql,
    username: string,
  ): Promise<FilaJugador | null> {
    const consulta = `
      SELECT id, auth_user_id, username, display_name, timezone, created_at, updated_at
      FROM players
      WHERE username = $1
    `;
    const resultado = await ejecutor.query<FilaJugador>(consulta, [username]);
    return resultado.rows[0] || null;
  }

  /**
   * Actualiza parcialmente los campos editables de un jugador
   */
  async actualizarJugador(
    ejecutor: EjecutorSql,
    id: string,
    datos: EntradaActualizarJugador,
  ): Promise<FilaJugador | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let indice = 1;

    if (datos.displayName !== undefined) {
      campos.push(`display_name = $${indice++}`);
      valores.push(datos.displayName);
    }

    if (datos.timezone !== undefined) {
      campos.push(`timezone = $${indice++}`);
      valores.push(datos.timezone);
    }

    if (campos.length === 0) {
      return null;
    }

    campos.push(`updated_at = NOW()`);
    valores.push(id);

    const consulta = `
      UPDATE players
      SET ${campos.join(', ')}
      WHERE id = $${indice}
      RETURNING id, auth_user_id, username, display_name, timezone, created_at, updated_at
    `;

    const resultado = await ejecutor.query<FilaJugador>(consulta, valores);
    return resultado.rows[0] || null;
  }
}

export const repositorioJugadores = new RepositorioJugadores();
