import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '../../context/PlayerContext';

export function OnboardingScreen() {
  const { crearPersonaje, cerrarSesion, errorMensaje } = usePlayer();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [enviando, setEnviando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleCrearPersonaje = async () => {
    if (enviando) return;

    if (!username.trim() || username.trim().length < 3) {
      setErrorLocal('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!displayName.trim()) {
      setErrorLocal('Ingresa tu nombre de aventurero');
      return;
    }

    setEnviando(true);
    setErrorLocal(null);

    try {
      // El frontend NO envía authUserId. El backend lo extrae de forma segura del JWT.
      await crearPersonaje({
        username: username.trim(),
        displayName: displayName.trim(),
        timezone: timezone.trim() || 'UTC',
      });
    } catch (error: unknown) {
      console.error('Error al completar onboarding:', error);
      const err = error as { message?: string };
      setErrorLocal(err.message || 'No fue posible crear el personaje. Revisa los datos.');
    } finally {
      setEnviando(false);
    }
  };

  const errorVisible = errorLocal || errorMensaje;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.contenedorPrincipal}>
      <ScrollView contentContainerStyle={styles.scrollInterno} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjeta}>
          <Text style={styles.insignia}>Fase Inicial</Text>
          <Text style={styles.titulo}>Crea tu Personaje</Text>
          <Text style={styles.subtitulo}>
            Bienvenido a Chapter One. Configura tu identidad RPG para comenzar tu viaje de
            transformación.
          </Text>

          {errorVisible && (
            <View style={styles.cajaError}>
              <Text style={styles.textoError}>{errorVisible}</Text>
            </View>
          )}

          <View style={styles.formulario}>
            <Text style={styles.etiqueta}>Nombre de Usuario (Único)</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. shadow_runner"
              placeholderTextColor="#888"
              value={username}
              onChangeText={(texto) => {
                setUsername(texto.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setErrorLocal(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.etiqueta}>Nombre Mostrado (Display Name)</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Corredor Sombrío"
              placeholderTextColor="#888"
              value={displayName}
              onChangeText={(texto) => {
                setDisplayName(texto);
                setErrorLocal(null);
              }}
            />

            <Text style={styles.etiqueta}>Zona Horaria</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. America/Mexico_City o UTC"
              placeholderTextColor="#888"
              value={timezone}
              onChangeText={setTimezone}
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.botonCrear, enviando && styles.botonDeshabilitado]}
              onPress={handleCrearPersonaje}
              disabled={enviando || !username.trim() || !displayName.trim()}>
              {enviando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotonCrear}>Iniciar Aventura</Text>
              )}
            </Pressable>

            <Pressable style={styles.botonSalir} onPress={cerrarSesion} disabled={enviando}>
              <Text style={styles.textoBotonSalir}>Cerrar Sesión</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollInterno: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  insignia: {
    alignSelf: 'center',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: Spacing.four,
    lineHeight: 20,
  },
  cajaError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: Spacing.three,
  },
  textoError: {
    color: '#FCA5A5',
    fontSize: 13,
    textAlign: 'center',
  },
  formulario: {
    gap: Spacing.three,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  botonCrear: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonCrear: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonSalir: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoBotonSalir: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
