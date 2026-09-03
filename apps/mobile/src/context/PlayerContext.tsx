import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clienteApi, type DatosCrearJugador, ErrorApi, type Jugador } from '../services/api';

export type EstadoIdentidad =
  | 'CARGANDO'
  | 'NO_AUTENTICADO'
  | 'REQUIERE_ONBOARDING'
  | 'CON_JUGADOR'
  | 'ERROR';

interface ContextoJugadorValor {
  estado: EstadoIdentidad;
  jugador: Jugador | null;
  errorMensaje: string | null;
  recargarPerfil: () => Promise<void>;
  crearPersonaje: (datos: DatosCrearJugador) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const ContextoJugador = createContext<ContextoJugadorValor | undefined>(undefined);

export function ProveedorJugador({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const [estado, setEstado] = useState<EstadoIdentidad>('CARGANDO');
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Mantenemos una referencia mutable a getToken para evitar bucles causados por instancias inestables de la función de Clerk
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Rastrea el último userId de Clerk procesado para prevenir peticiones HTTP redundantes o bucles
  const ultimoUserIdProcesadoRef = useRef<string | null>(null);

  const cargarPerfil = useCallback(
    async (forzar = false) => {
      if (!isLoaded) {
        setEstado('CARGANDO');
        return;
      }

      if (!isSignedIn || !userId) {
        setEstado('NO_AUTENTICADO');
        setJugador(null);
        setErrorMensaje(null);
        ultimoUserIdProcesadoRef.current = null;
        return;
      }

      // Prevenir bucles infinitos: si no es forzado y ya consultamos la API para este mismo userId, omitir re-consulta
      if (!forzar && ultimoUserIdProcesadoRef.current === userId) {
        return;
      }

      ultimoUserIdProcesadoRef.current = userId;
      setEstado('CARGANDO');
      setErrorMensaje(null);

      try {
        const perfil = await clienteApi.obtenerMiPerfil(() => getTokenRef.current());
        setJugador(perfil);
        setEstado('CON_JUGADOR');
      } catch (error: unknown) {
        if (error instanceof ErrorApi && error.code === 'PLAYER_PROFILE_REQUIRED') {
          setJugador(null);
          setEstado('REQUIERE_ONBOARDING');
          return;
        }

        console.error('Error al cargar perfil de jugador:', error);
        const mensaje =
          error instanceof Error ? error.message : 'Error inesperado al conectar con el servidor';
        setErrorMensaje(mensaje);
        setEstado('ERROR');
      }
    },
    [isLoaded, isSignedIn, userId],
  );

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const recargarPerfil = useCallback(async () => {
    await cargarPerfil(true);
  }, [cargarPerfil]);

  const crearPersonaje = useCallback(
    async (datos: DatosCrearJugador) => {
      setEstado('CARGANDO');
      setErrorMensaje(null);

      try {
        await clienteApi.crearJugador(() => getTokenRef.current(), datos);
        // Tras creación exitosa, consultar /players/me para validar sincronización
        await cargarPerfil(true);
      } catch (error: unknown) {
        console.error('Error al crear personaje:', error);
        const mensaje =
          error instanceof ErrorApi
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Error al crear el personaje';
        setErrorMensaje(mensaje);
        setEstado('REQUIERE_ONBOARDING');
        throw error;
      }
    },
    [cargarPerfil],
  );

  const cerrarSesion = useCallback(async () => {
    setEstado('CARGANDO');
    await signOut();
    setJugador(null);
    setErrorMensaje(null);
    ultimoUserIdProcesadoRef.current = null;
    setEstado('NO_AUTENTICADO');
  }, [signOut]);

  return (
    <ContextoJugador.Provider
      value={{
        estado,
        jugador,
        errorMensaje,
        recargarPerfil,
        crearPersonaje,
        cerrarSesion,
      }}>
      {children}
    </ContextoJugador.Provider>
  );
}

export function usePlayer() {
  const contexto = useContext(ContextoJugador);
  if (!contexto) {
    throw new Error('usePlayer debe utilizarse dentro de un ProveedorJugador');
  }
  return contexto;
}
