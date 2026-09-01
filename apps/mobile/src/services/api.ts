/**
 * Tipos de datos del Jugador y Progreso en el Cliente
 */
export interface ProgresoJugador {
  totalXp: number;
  currentLevel: number;
  unspentSkillPoints: number;
  totalSkillPointsEarned: number;
}

export interface Jugador {
  id: string;
  authUserId: string | null;
  username: string;
  displayName: string;
  timezone: string;
  progress: ProgresoJugador;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorApiPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface DatosCrearJugador {
  username: string;
  displayName: string;
  timezone?: string;
}

/**
 * Error personalizado para respuestas no exitosas de la API
 */
export class ErrorApi extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, payload: ErrorApiPayload) {
    super(payload.message || `Error HTTP ${status}`);
    this.name = 'ErrorApi';
    this.status = status;
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.details = payload.details;
  }
}

const URL_BASE_API =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'https://chapter-api.odysseo.uk';

/**
 * Cliente HTTP centralizado para comunicación autenticada con la API de Chapter One
 */
export const clienteApi = {
  /**
   * Consulta el perfil y progreso del jugador autenticado actual
   * Devuelve HTTP 200 con el Jugador, o lanza ErrorApi con código 'PLAYER_PROFILE_REQUIRED' (404) si es nuevo.
   */
  async obtenerMiPerfil(obtenerToken: () => Promise<string | null>): Promise<Jugador> {
    const token = await obtenerToken();
    if (!token) {
      throw new ErrorApi(401, {
        code: 'UNAUTHORIZED',
        message: 'No se encontró un token de autenticación activo',
      });
    }

    const respuesta = await fetch(`${URL_BASE_API}/players/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new ErrorApi(respuesta.status, {
        code: resultado?.error?.code || `HTTP_${respuesta.status}`,
        message: resultado?.error?.message || 'Error al consultar el perfil de jugador',
        details: resultado?.error?.details,
      });
    }

    return resultado.data as Jugador;
  },

  /**
   * Crea un nuevo personaje asociado al usuario autenticado.
   * El frontend NO envía authUserId; el backend lo extrae de forma segura del JWT.
   */
  async crearJugador(
    obtenerToken: () => Promise<string | null>,
    datos: DatosCrearJugador,
  ): Promise<Jugador> {
    const token = await obtenerToken();
    if (!token) {
      throw new ErrorApi(401, {
        code: 'UNAUTHORIZED',
        message: 'No se encontró un token de autenticación activo',
      });
    }

    const respuesta = await fetch(`${URL_BASE_API}/players`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        username: datos.username.trim(),
        displayName: datos.displayName.trim(),
        timezone: datos.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      }),
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new ErrorApi(respuesta.status, {
        code: resultado?.error?.code || `HTTP_${respuesta.status}`,
        message: resultado?.error?.message || 'Error al crear el personaje de jugador',
        details: resultado?.error?.details,
      });
    }

    return resultado.data as Jugador;
  },
};
