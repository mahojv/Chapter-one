import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing } from '@/constants/theme';
import { usePlayer } from '../../context/PlayerContext';

export function PlayerDashboard() {
  const { jugador, cerrarSesion, recargarPerfil, ganarXp } = usePlayer();
  const [cargandoRecarga, setCargandoRecarga] = useState(false);
  const [cargandoXp, setCargandoXp] = useState<number | null>(null);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [notificacionXp, setNotificacionXp] = useState<string | null>(null);

  if (!jugador) {
    return null;
  }

  const manejarRecargar = async () => {
    if (cargandoRecarga) return;
    setCargandoRecarga(true);
    setMensajeExito(false);
    try {
      await recargarPerfil();
      setMensajeExito(true);
      setTimeout(() => {
        setMensajeExito(false);
      }, 2500);
    } finally {
      setCargandoRecarga(false);
    }
  };

  const manejarGanarXp = async (cantidad: number, motivo: string) => {
    if (cargandoXp !== null) return;
    setCargandoXp(cantidad);
    setNotificacionXp(null);
    try {
      const res = await ganarXp(cantidad, motivo);
      if (res.didLevelUp) {
        setNotificacionXp(
          `🎉 ¡LEVEL UP! Nivel ${res.newLevel} (+${res.skillPointsGained} Pt Habilidad)`,
        );
      } else {
        setNotificacionXp(`⚡ +${res.xpGained} XP (${motivo})`);
      }
      setTimeout(() => {
        setNotificacionXp(null);
      }, 4000);
    } catch (error) {
      console.error('Error al ganar XP:', error);
    } finally {
      setCargandoXp(null);
    }
  };

  return (
    <SafeAreaView style={styles.areaSegura}>
      <ScrollView contentContainerStyle={styles.scrollInterno}>
        {/* Cabecera del Jugador */}
        <View style={styles.tarjetaPerfil}>
          <View style={styles.filaCabecera}>
            <View style={styles.avatar}>
              <Text style={styles.inicialAvatar}>
                {jugador.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.datosPerfil}>
              <Text style={styles.nombreMostrado}>{jugador.displayName}</Text>
              <Text style={styles.nombreUsuario}>@{jugador.username}</Text>
              <Text style={styles.zonaHoraria}>Zona: {jugador.timezone}</Text>
            </View>
          </View>
        </View>

        {/* Resumen de Progreso RPG */}
        <View style={styles.tarjetaProgreso}>
          <Text style={styles.tituloSeccion}>Estado del Personaje</Text>

          <View style={styles.rejillaEstadisticas}>
            <View style={styles.cajaEstadistica}>
              <Text style={styles.etiquetaEstadistica}>Nivel Actual</Text>
              <Text style={styles.valorNivel}>{jugador.progress.currentLevel}</Text>
            </View>

            <View style={styles.cajaEstadistica}>
              <Text style={styles.etiquetaEstadistica}>XP Total</Text>
              <Text style={styles.valorEstadistica}>{jugador.progress.totalXp} XP</Text>
            </View>

            <View style={styles.cajaEstadistica}>
              <Text style={styles.etiquetaEstadistica}>Puntos de Habilidad</Text>
              <Text style={styles.valorEstadistica}>{jugador.progress.unspentSkillPoints}</Text>
            </View>

            <View style={styles.cajaEstadistica}>
              <Text style={styles.etiquetaEstadistica}>Puntos Totales Ganados</Text>
              <Text style={styles.valorEstadistica}>
                {jugador.progress.totalSkillPointsEarned}
              </Text>
            </View>
          </View>
        </View>

        {/* Probar Progresión RPG */}
        <View style={styles.tarjetaProgreso}>
          <Text style={styles.tituloSeccion}>⚡ Simular Actividad (Ganar XP)</Text>

          {notificacionXp && <Text style={styles.textoNotificacionXp}>{notificacionXp}</Text>}

          <View style={styles.filaBotonesXp}>
            <Pressable
              style={[styles.botonXp, cargandoXp === 100 && styles.botonDeshabilitado]}
              onPress={() => manejarGanarXp(100, 'Entrenamiento')}
              disabled={cargandoXp !== null}>
              {cargandoXp === 100 ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonXp}>+100 XP (Entreno)</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.botonXpEspecial, cargandoXp === 250 && styles.botonDeshabilitado]}
              onPress={() => manejarGanarXp(250, 'Misión Cumplida')}
              disabled={cargandoXp !== null}>
              {cargandoXp === 250 ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBotonXpEspecial}>+250 XP (Misión)</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Acciones de Cuenta */}
        <View style={styles.tarjetaAcciones}>
          {mensajeExito && (
            <Text style={styles.textoExito}>✓ Ficha actualizada correctamente</Text>
          )}

          <Pressable
            style={[styles.botonRecargar, cargandoRecarga && styles.botonDeshabilitado]}
            onPress={manejarRecargar}
            disabled={cargandoRecarga}>
            {cargandoRecarga ? (
              <ActivityIndicator size="small" color="#E2E8F0" />
            ) : (
              <Text style={styles.textoBotonRecargar}>Actualizar Ficha</Text>
            )}
          </Pressable>

          <Pressable style={styles.botonCerrarSesion} onPress={cerrarSesion}>
            <Text style={styles.textoBotonCerrarSesion}>Cerrar Sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  areaSegura: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollInterno: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  tarjetaPerfil: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inicialAvatar: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  datosPerfil: {
    flex: 1,
  },
  nombreMostrado: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  nombreUsuario: {
    fontSize: 14,
    color: '#60A5FA',
    marginTop: 2,
  },
  zonaHoraria: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  tarjetaProgreso: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tituloSeccion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CBD5E1',
    marginBottom: Spacing.three,
  },
  rejillaEstadisticas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  cajaEstadistica: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#334155',
  },
  etiquetaEstadistica: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  valorNivel: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  valorEstadistica: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  tarjetaAcciones: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  textoNotificacionXp: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.two,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  filaBotonesXp: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botonXp: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoBotonXp: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  botonXpEspecial: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoBotonXpEspecial: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  textoExito: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  botonRecargar: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonRecargar: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  botonCerrarSesion: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  textoBotonCerrarSesion: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
