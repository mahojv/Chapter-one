import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  cerrarPool,
  consultar,
  obtenerConfiguracionBaseDatos,
  verificarSaludBaseDatos,
} from './client.js';

const rutaArchivoActual = fileURLToPath(import.meta.url);
const directorioActual = path.dirname(rutaArchivoActual);

describe('Especificaciones del Esquema y Migraciones de Base de Datos', () => {
  const directorioMigraciones = path.join(directorioActual, 'migrations');
  const directorioSeeds = path.join(directorioActual, 'seeds');

  it('debe contener el archivo SQL de migración inicial con todas las entidades del modelo de dominio', () => {
    const archivoMigracion = path.join(directorioMigraciones, '001_initial_schema.sql');
    expect(fs.existsSync(archivoMigracion)).toBe(true);

    const contenidoSql = fs.readFileSync(archivoMigracion, 'utf-8');

    // 15 tablas requeridas por docs/domain-model.md
    const tablasEsperadas = [
      'players',
      'player_progress',
      'attributes',
      'player_attributes',
      'skills',
      'player_skills',
      'skill_progress',
      'habits',
      'habit_logs',
      'rewards',
      'quests',
      'quest_progress',
      'achievements',
      'player_achievements',
      'progress_events',
    ];

    for (const tabla of tablasEsperadas) {
      expect(contenidoSql).toContain(`CREATE TABLE ${tabla}`);
    }

    // 13 ENUMs requeridos
    const enumsEsperados = [
      'attribute_category',
      'skill_domain',
      'decay_rate',
      'decay_status',
      'habit_frequency_type',
      'habit_difficulty_tier',
      'habit_log_status',
      'validation_status',
      'quest_type',
      'quest_status',
      'achievement_category',
      'reward_type',
      'progress_event_type',
    ];

    for (const tipoEnum of enumsEsperados) {
      expect(contenidoSql).toContain(`CREATE TYPE ${tipoEnum}`);
    }

    // Decisión aprobada 3: Escala de atributos de 1 a 100
    expect(contenidoSql).toContain('current_score >= 0.00 AND current_score <= 100.00');

    // Decisión aprobada 5: Índice para ventana móvil de consistencia de 30 días
    expect(contenidoSql).toContain('idx_habit_logs_player_date');

    // Fuente única de verdad en progress_events
    expect(contenidoSql).toContain('xp_delta INT NOT NULL DEFAULT 0 CHECK (xp_delta >= 0)');
  });

  it('debe contener el archivo de seeds con los 7 atributos base y habilidades iniciales', () => {
    const archivoSeeds = path.join(directorioSeeds, 'initial_seeds.sql');
    expect(fs.existsSync(archivoSeeds)).toBe(true);

    const contenidoSql = fs.readFileSync(archivoSeeds, 'utf-8');

    // 7 atributos principales del diseño
    const atributosPrincipales = [
      'ATTR_POWER',
      'ATTR_VITALITY',
      'ATTR_ENDURANCE',
      'ATTR_AGILITY',
      'ATTR_MOBILITY',
      'ATTR_KNOWLEDGE',
      'ATTR_DISCIPLINE',
    ];

    for (const atributo of atributosPrincipales) {
      expect(contenidoSql).toContain(atributo);
    }

    // 10 habilidades principales del diseño
    const habilidadesPrincipales = [
      'SKILL_BENCH_PRESS',
      'SKILL_SQUAT',
      'SKILL_DEADLIFT',
      'SKILL_PULL_UPS',
      'SKILL_RUNNING',
      'SKILL_CYCLING',
      'SKILL_SWIMMING',
      'SKILL_ENGLISH',
      'SKILL_PROGRAMMING',
      'SKILL_MATHEMATICS',
    ];

    for (const habilidad of habilidadesPrincipales) {
      expect(contenidoSql).toContain(habilidad);
    }
  });

  it('debe proporcionar configuración de base de datos válida acorde al entorno', () => {
    const configuracion = obtenerConfiguracionBaseDatos();
    expect(configuracion).toBeDefined();
    if (configuracion.connectionString) {
      expect(typeof configuracion.connectionString).toBe('string');
    } else {
      expect(configuracion.database).toBe('chapter_one_dev');
      expect(configuracion.user).toBe('postgres');
      expect(configuracion.port).toBe(5432);
    }
  });

  it('verificarSaludBaseDatos debe retornar un booleano de forma segura sin excepciones no controladas', async () => {
    const estaSaludable = await verificarSaludBaseDatos();
    expect(typeof estaSaludable).toBe('boolean');
  });
});

describe('Integración en Vivo con PostgreSQL (Se activa al estar PostgreSQL encendido)', () => {
  let estaBdDisponible = false;

  beforeAll(async () => {
    estaBdDisponible = await verificarSaludBaseDatos();
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('debe ejecutar operaciones CRUD básicas y verificar integridad si la base de datos está disponible', async () => {
    if (!estaBdDisponible) {
      // Pasa limpiamente cuando la base de datos no está activa en el entorno de prueba
      expect(true).toBe(true);
      return;
    }

    // Verificar consulta de atributos
    const resultadoAtributos = await consultar('SELECT COUNT(*) as total FROM attributes');
    expect(Number(resultadoAtributos.rows[0].total)).toBeGreaterThanOrEqual(7);

    // Verificar consulta de habilidades
    const resultadoHabilidades = await consultar('SELECT COUNT(*) as total FROM skills');
    expect(Number(resultadoHabilidades.rows[0].total)).toBeGreaterThanOrEqual(10);
  });
});
