import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const [estado, setEstado] = useState<EstadoIdentidad>('CARGANDO');
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  const cargarPerfil = useCallback(async () => {
    if (!isLoaded) {
      setEstado('CARGANDO');
      return;
    }

    if (!isSignedIn) {
      setEstado('NO_AUTENTICADO');
      setJugador(null);
      setErrorMensaje(null);
      return;
    }

    setEstado('CARGANDO');
    setErrorMensaje(null);

    try {
      const perfil = await clienteApi.obtenerMiPerfil(getToken);
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
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const crearPersonaje = useCallback(
    async (datos: DatosCrearJugador) => {
      setEstado('CARGANDO');
      setErrorMensaje(null);

      try {
        await clienteApi.crearJugador(getToken, datos);
        // Tras creación exitosa, consultar /players/me para validar sincronización
        await cargarPerfil();
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
    [getToken, cargarPerfil],
  );

  const cerrarSesion = useCallback(async () => {
    setEstado('CARGANDO');
    await signOut();
    setJugador(null);
    setErrorMensaje(null);
    setEstado('NO_AUTENTICADO');
  }, [signOut]);

  return (
    <ContextoJugador.Provider
      value={{
        estado,
        jugador,
        errorMensaje,
        recargarPerfil: cargarPerfil,
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
