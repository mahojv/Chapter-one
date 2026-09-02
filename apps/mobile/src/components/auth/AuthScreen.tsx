import { useSignIn, useSignUp } from '@clerk/clerk-expo';
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

export function AuthScreen() {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();

  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigoVerificacion, setCodigoVerificacion] = useState('');
  const [esperandoVerificacion, setEsperandoVerificacion] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const handleIniciarSesion = async () => {
    if (!signInLoaded || cargando) return;
    setCargando(true);
    setMensajeError(null);

    try {
      const intento = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (intento.status === 'complete') {
        await setActiveSignIn({ session: intento.createdSessionId });
        return;
      }

      if (intento.status === 'needs_first_factor') {
        const factorPassword = intento.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'password'
        );

        if (factorPassword && password.trim()) {
          const intentoPassword = await signIn.attemptFirstFactor({
            strategy: 'password',
            password,
          });

          if (intentoPassword.status === 'complete') {
            await setActiveSignIn({ session: intentoPassword.createdSessionId });
            return;
          }
        }

        const factorEmail = intento.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );

        if (factorEmail && 'emailAddressId' in factorEmail && typeof factorEmail.emailAddressId === 'string') {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: factorEmail.emailAddressId,
          });
          setEsperandoVerificacion(true);
          return;
        }

        setMensajeError('Se requiere un factor de autenticación adicional no soportado.');
        return;
      }

      if (intento.status === 'needs_second_factor') {
        const factorEmail2FA = intento.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );

        if (factorEmail2FA) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
          });
          setEsperandoVerificacion(true);
          return;
        }

        setMensajeError('La cuenta requiere un segundo factor no soportado en esta pantalla.');
        return;
      }

      if (intento.status === 'needs_new_password') {
        setMensajeError('La cuenta requiere establecer una nueva contraseña antes de iniciar sesión.');
        return;
      }

      setMensajeError(`Estado de inicio de sesión no completado: ${intento.status}`);
    } catch (error: unknown) {
      console.error('Error al iniciar sesión:', error);
      const err = error as { errors?: Array<{ message: string }> };
      setMensajeError(err.errors?.[0]?.message || 'Credenciales inválidas o error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const handleRegistrarse = async () => {
    if (!signUpLoaded || cargando) return;
    setCargando(true);
    setMensajeError(null);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // Solicitar código de verificación al correo
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setEsperandoVerificacion(true);
    } catch (error: unknown) {
      console.error('Error al registrar usuario:', error);
      const err = error as { errors?: Array<{ message: string }> };
      setMensajeError(err.errors?.[0]?.message || 'No fue posible completar el registro');
    } finally {
      setCargando(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (cargando) return;
    setCargando(true);
    setMensajeError(null);

    try {
      if (esRegistro) {
        if (!signUpLoaded) return;
        const intento = await signUp.attemptEmailAddressVerification({
          code: codigoVerificacion.trim(),
        });

        if (intento.status === 'complete') {
          await setActiveSignUp({ session: intento.createdSessionId });
        } else {
          setMensajeError('El código ingresado no pudo ser verificado');
        }
      } else {
        if (!signInLoaded) return;
        const intento =
          signIn.status === 'needs_second_factor'
            ? await signIn.attemptSecondFactor({
                strategy: 'email_code',
                code: codigoVerificacion.trim(),
              })
            : await signIn.attemptFirstFactor({
                strategy: 'email_code',
                code: codigoVerificacion.trim(),
              });

        if (intento.status === 'complete') {
          await setActiveSignIn({ session: intento.createdSessionId });
        } else {
          setMensajeError('El código ingresado no pudo ser verificado');
        }
      }
    } catch (error: unknown) {
      console.error('Error al verificar código:', error);
      const err = error as { errors?: Array<{ message: string }> };
      setMensajeError(err.errors?.[0]?.message || 'Código inválido o expirado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.contenedorPrincipal}>
      <ScrollView contentContainerStyle={styles.scrollInterno} keyboardShouldPersistTaps="handled">
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Chapter One</Text>
          <Text style={styles.subtitulo}>
            {esperandoVerificacion
              ? 'Verifica tu correo electrónico'
              : esRegistro
                ? 'Crea tu cuenta de aventurero'
                : 'Inicia sesión para continuar'}
          </Text>

          {mensajeError && (
            <View style={styles.cajaError}>
              <Text style={styles.textoError}>{mensajeError}</Text>
            </View>
          )}

          {esperandoVerificacion ? (
            <View style={styles.formulario}>
              <Text style={styles.etiqueta}>Código de verificación enviado a {email}:</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa el código (ej. 123456)"
                placeholderTextColor="#888"
                value={codigoVerificacion}
                onChangeText={setCodigoVerificacion}
                keyboardType="number-pad"
                autoCapitalize="none"
              />

              <Pressable
                style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
                onPress={handleVerificarCodigo}
                disabled={cargando || !codigoVerificacion.trim()}>
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>Confirmar y Entrar</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.formulario}>
              <Text style={styles.etiqueta}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="aventurero@ejemplo.com"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.etiqueta}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Pressable
                style={[styles.botonPrincipal, cargando && styles.botonDeshabilitado]}
                onPress={esRegistro ? handleRegistrarse : handleIniciarSesion}
                disabled={cargando || !email.trim() || !password.trim()}>
                {cargando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.textoBotonPrincipal}>
                    {esRegistro ? 'Registrarse' : 'Iniciar Sesión'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={styles.botonAlternar}
                onPress={() => {
                  setEsRegistro(!esRegistro);
                  setMensajeError(null);
                }}>
                <Text style={styles.textoAlternar}>
                  {esRegistro
                    ? '¿Ya tienes cuenta? Inicia sesión aquí'
                    : '¿No tienes cuenta todavía? Regístrate aquí'}
                </Text>
              </Pressable>
            </View>
          )}
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
    maxWidth: 420,
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
  titulo: {
    fontSize: 28,
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
  botonPrincipal: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonPrincipal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonAlternar: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoAlternar: {
    color: '#60A5FA',
    fontSize: 13,
    textAlign: 'center',
  },
});
