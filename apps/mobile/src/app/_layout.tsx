import { ClerkProvider } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { ProveedorJugador } from '@/context/PlayerContext';
import { tokenCache } from '@/lib/tokenCache';

SplashScreen.preventAutoHideAsync();

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

function PantallaClaveFaltante() {
  return (
    <View style={styles.contenedorAviso}>
      <Text style={styles.tituloAviso}>Configuración de Clerk Requerida</Text>
      <Text style={styles.textoAviso}>
        No se encontró la variable{' '}
        <Text style={styles.textoCodigo}>EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>.
      </Text>
      <Text style={styles.textoInstruccion}>
        Copia el archivo <Text style={styles.textoCodigo}>apps/mobile/.env.example</Text> a{' '}
        <Text style={styles.textoCodigo}>apps/mobile/.env</Text> y define tu publishable key de
        Clerk.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Permitir ocultar el splash screen nativo una vez montado
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PantallaClaveFaltante />
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ProveedorJugador>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <AppTabs />
        </ThemeProvider>
      </ProveedorJugador>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  contenedorAviso: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  tituloAviso: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  textoAviso: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  textoInstruccion: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  textoCodigo: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#60A5FA',
    fontWeight: 'bold',
  },
});
