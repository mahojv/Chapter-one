import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { OnboardingScreen } from '@/components/auth/OnboardingScreen';
import { PlayerDashboard } from '@/components/dashboard/PlayerDashboard';
import { usePlayer } from '@/context/PlayerContext';

export default function HomeScreen() {
  const { estado, errorMensaje, recargarPerfil } = usePlayer();

  if (estado === 'CARGANDO') {
    return (
      <View style={styles.contenedorCentrado}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.textoCargando}>Sincronizando identidad del jugador...</Text>
      </View>
    );
  }

  if (estado === 'NO_AUTENTICADO') {
    return <AuthScreen />;
  }

  if (estado === 'REQUIERE_ONBOARDING') {
    return <OnboardingScreen />;
  }

  if (estado === 'CON_JUGADOR') {
    return <PlayerDashboard />;
  }

  if (estado === 'ERROR') {
    return (
      <View style={styles.contenedorCentrado}>
        <View style={styles.cajaError}>
          <Text style={styles.tituloError}>Error de Comunicación</Text>
          <Text style={styles.textoError}>
            {errorMensaje || 'No fue posible sincronizar los datos con el servidor.'}
          </Text>
          <Pressable style={styles.botonReintentar} onPress={recargarPerfil}>
            <Text style={styles.textoBotonReintentar}>Reintentar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  contenedorCentrado: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textoCargando: {
    marginTop: 16,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  cajaError: {
    maxWidth: 400,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  tituloError: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FCA5A5',
    marginBottom: 8,
  },
  textoError: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  botonReintentar: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBotonReintentar: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
