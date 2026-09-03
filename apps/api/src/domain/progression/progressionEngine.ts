import type { ProgressionDetails, XpGainResult } from '@chapter-one/types';

/**
 * Error de validación de entradas matemáticas para el motor de progresión
 */
export class ErrorMatematicaProgreso extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorMatematicaProgreso';
  }
}

/**
 * Exponente de la fórmula de progresión RPG de Chapter One.
 * Fórmula: XP Acumulada Requerida para Nivel N = 100 * N^1.6
 */
const EXPONENTE_XP_NIVEL = 1.6;
const FACTOR_MULTIPLICADOR_XP = 100;

/**
 * Calcula la XP total acumulada requerida para desbloquear el nivel especificado N.
 * Semántica:
 * - Nivel 1: 0 XP (el nivel inicial de cualquier personaje).
 * - Nivel N >= 2: Math.floor(100 * N^1.6) XP total acumulada.
 *
 * @param nivel Número entero >= 1
 * @returns XP total acumulada necesaria para alcanzar el nivel
 */
export function xpRequeridaParaNivel(nivel: number): number {
  if (typeof nivel !== 'number' || !Number.isInteger(nivel) || nivel < 1) {
    throw new ErrorMatematicaProgreso(
      `El nivel debe ser un número entero mayor o igual a 1. Valor recibido: ${nivel}`,
    );
  }

  if (nivel === 1) {
    return 0;
  }

  return Math.floor(FACTOR_MULTIPLICADOR_XP * Math.pow(nivel, EXPONENTE_XP_NIVEL));
}

/**
 * Calcula el nivel alcanzado a partir de la experiencia total acumulada.
 *
 * @param totalXp Experiencia total acumulada (debe ser un número finito >= 0)
 * @returns Nivel actual del jugador (entero >= 1)
 */
export function nivelDesdeTotalXp(totalXp: number): number {
  if (typeof totalXp !== 'number' || !Number.isFinite(totalXp) || totalXp < 0) {
    throw new ErrorMatematicaProgreso(
      `La experiencia acumulada debe ser un número finito mayor o igual a 0. Valor recibido: ${totalXp}`,
    );
  }

  const xpLimpia = Math.floor(totalXp);
  if (xpLimpia === 0) {
    return 1;
  }

  // Estimación matemática rápida usando la función inversa: N ~= (totalXp / 100)^(1 / 1.6)
  const estimacionNivel = Math.floor(
    Math.pow(xpLimpia / FACTOR_MULTIPLICADOR_XP, 1 / EXPONENTE_XP_NIVEL),
  );
  let nivel = Math.max(1, estimacionNivel);

  // Ajuste preciso en O(1) de bordes
  while (xpRequeridaParaNivel(nivel + 1) <= xpLimpia) {
    nivel++;
  }

  while (nivel > 1 && xpRequeridaParaNivel(nivel) > xpLimpia) {
    nivel--;
  }

  return nivel;
}

/**
 * Obtiene el desglose detallado del progreso actual dentro del nivel del jugador.
 *
 * @param totalXp Experiencia total acumulada (debe ser un número finito >= 0)
 * @returns Detalles completos de progresión (nivel, piso de XP, techo de XP, progreso %, etc.)
 */
export function obtenerProgresoNivel(totalXp: number): ProgressionDetails {
  if (typeof totalXp !== 'number' || !Number.isFinite(totalXp) || totalXp < 0) {
    throw new ErrorMatematicaProgreso(
      `La experiencia acumulada debe ser un número finito mayor o igual a 0. Valor recibido: ${totalXp}`,
    );
  }

  const xpTotalNormalizada = Math.floor(totalXp);
  const nivelActual = nivelDesdeTotalXp(xpTotalNormalizada);
  const pisoXpNivelActual = xpRequeridaParaNivel(nivelActual);
  const umbralXpSiguienteNivel = xpRequeridaParaNivel(nivelActual + 1);

  const xpEnNivelActual = xpTotalNormalizada - pisoXpNivelActual;
  const xpRequeridaSiguienteNivel = umbralXpSiguienteNivel - xpTotalNormalizada;
  const rangoXpNivel = umbralXpSiguienteNivel - pisoXpNivelActual;

  const porcentajeRaw = (xpEnNivelActual / rangoXpNivel) * 100;
  const porcentajeProgreso = Number(Math.min(100, Math.max(0, porcentajeRaw)).toFixed(2));

  return {
    currentLevel: nivelActual,
    totalXp: xpTotalNormalizada,
    currentLevelXpFloor: pisoXpNivelActual,
    nextLevelXpThreshold: umbralXpSiguienteNivel,
    xpInCurrentLevel: xpEnNivelActual,
    xpNeededForNextLevel: xpRequeridaSiguienteNivel,
    progressPercentage: porcentajeProgreso,
  };
}

/**
 * Simula u otorga una cantidad de ganancia de XP sobre una XP acumulada actual.
 * Retorna los deltas, estado de subida de nivel (level-up) y el nuevo desglose de progreso.
 *
 * @param xpTotalActual XP acumulada antes de la ganancia (entero >= 0)
 * @param deltaXp Cantidad de XP a incrementar (entero >= 0)
 * @returns Resultado detallado de la ganancia de XP y cambios de nivel
 */
export function aplicarGananciaXp(xpTotalActual: number, deltaXp: number): XpGainResult {
  if (typeof xpTotalActual !== 'number' || !Number.isFinite(xpTotalActual) || xpTotalActual < 0) {
    throw new ErrorMatematicaProgreso(
      `La experiencia total actual debe ser un número finito mayor o igual a 0. Valor recibido: ${xpTotalActual}`,
    );
  }

  if (typeof deltaXp !== 'number' || !Number.isFinite(deltaXp) || deltaXp < 0) {
    throw new ErrorMatematicaProgreso(
      `La ganancia de experiencia (deltaXp) debe ser un número finito mayor o igual a 0. Valor recibido: ${deltaXp}`,
    );
  }

  const xpAnterior = Math.floor(xpTotalActual);
  const gananciaXp = Math.floor(deltaXp);
  const nuevaXpTotal = xpAnterior + gananciaXp;

  const nivelAnterior = nivelDesdeTotalXp(xpAnterior);
  const nuevoNivel = nivelDesdeTotalXp(nuevaXpTotal);

  const huboSubidaNivel = nuevoNivel > nivelAnterior;
  const nivelesGanados = Math.max(0, nuevoNivel - nivelAnterior);

  const nuevoProgreso = obtenerProgresoNivel(nuevaXpTotal);

  return {
    previousTotalXp: xpAnterior,
    newTotalXp: nuevaXpTotal,
    previousLevel: nivelAnterior,
    newLevel: nuevoNivel,
    xpGained: gananciaXp,
    didLevelUp: huboSubidaNivel,
    levelsGained: nivelesGanados,
    progress: nuevoProgreso,
  };
}

export const xpRequiredForLevel = xpRequeridaParaNivel;
export const levelFromTotalXp = nivelDesdeTotalXp;
export const getLevelProgress = obtenerProgresoNivel;
export const applyXp = aplicarGananciaXp;

/**
 * Objeto exportado con alias en inglés para mayor flexibilidad de consumo
 */
export const progressionEngine = {
  xpRequiredForLevel: xpRequeridaParaNivel,
  levelFromTotalXp: nivelDesdeTotalXp,
  getLevelProgress: obtenerProgresoNivel,
  applyXp: aplicarGananciaXp,
};
export const motorProgresion = progressionEngine;
