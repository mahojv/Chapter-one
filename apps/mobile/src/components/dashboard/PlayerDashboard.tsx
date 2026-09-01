import React from 'react';
import {
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
  const { jugador, cerrarSesion, recargarPerfil } = usePlayer();

  if (!jugador) {
    return null;
  }

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

        {/* Acciones de Cuenta */}
        <View style={styles.tarjetaAcciones}>
          <Pressable style={styles.botonRecargar} onPress={recargarPerfil}>
            <Text style={styles.textoBotonRecargar}>Actualizar Ficha</Text>
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
  botonRecargar: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
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
