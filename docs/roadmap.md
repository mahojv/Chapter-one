# Chapter One - Roadmap del Proyecto

Este documento establece la secuencia cronológica y el estado de avance de las fases de desarrollo para **Chapter One**, desde la fundación técnica hasta el despliegue en producción.

---

## Fase 1: Foundation ✅ (Completada)
* **Objetivo**: Establecer la infraestructura técnica y arquitectura monorepo.
* **Entregables implementados**:
  * Estructura npm workspaces con frontend (`apps/mobile`), backend (`apps/api`) y paquetes compartidos (`packages/types`, `packages/validation`).
  * Backend Fastify con endpoint base de diagnóstico `GET /health`.
  * Configuración de PostgreSQL 18 Alpine mediante Docker Compose.
  * Herramientas de calidad integradas (TypeScript estricto, ESLint Flat Config, Prettier, Vitest).
  * Documentación técnica inicial y arquitectura en `docs/`.

---

## Fase 2: Game Design & Domain Model ✅ (Completada)
* **Objetivo**: Diseñar las reglas fundamentales del RPG de vida real y formalizar el modelo de dominio.
* **Entregables implementados**:
  * `docs/game-design.md`: 14 principios de diseño, fórmula de XP `100 × N^1.6`, escala de Atributos 1 a 100, árbol de Habilidades, ventana móvil de consistencia de 30 días y control de decay.
  * `docs/domain-model.md`: 15 entidades relacionales, diagrama ER conceptual, matrices de inmutabilidad y flujo de progresión.

---

## Fase 3: Persistencia PostgreSQL & Despliegue en J1900 ✅ (Completada)
* **Objetivo**: Crear el esquema relacional en PostgreSQL 18 y preparar el stack para el servidor de producción.
* **Entregables implementados**:
  * Migración `001_initial_schema.sql` con 13 ENUMs y 15 tablas relacionales con restricciones de integridad y foreign keys.
  * Script de semillas `initial_seeds.sql` con los 7 atributos base y 10 habilidades iniciales.
  * Sistema de migraciones y semillas idempotentes con tabla `_schema_migrations`.
  * Despliegue en servidor Linux J1900 (Docker 29.x, Docker Compose, red interna aislada, volumen persistente).
  * Multi-stage `Dockerfile` optimizado y documentación operativa `docs/deployment-j1900.md`.
  * Dominio de producción activo: `https://chapter-api.odysseo.uk/health`.

---

## Fase 4: Vertical Slice de Players ✅ (Completada)
* **Objetivo**: Implementar el primer vertical slice de la API para gestión de jugadores.
* **Entregables implementados**:
  * Arquitectura limpia en 3 capas: Rutas (`routes/players.ts`), Servicios (`services/playerService.ts`) y Repositorios (`repositories/playerRepository.ts`).
  * Endpoints REST: `POST /players`, `GET /players/:id`, `PATCH /players/:id`.
  * Inserción atómica transaccional (`BEGIN` / `COMMIT`) de `Player` y `PlayerProgress` inicial (`Nivel 1`, `0 XP`, `0 Skill Points`).
  * Validación estricta con Zod en `@chapter-one/validation`.
  * Suite de pruebas unitarias y de integración en `apps/api/src/routes/players.test.ts`.

---

## Fase 5: Autenticación e Identidad del Jugador ✅ (Completada)
* **Objetivo**: Establecer la capa de seguridad e identidad desacoplada del jugador.
* **Entregables implementados**:
  * Adopción de **Clerk** como proveedor de identidad externo OIDC.
  * Plugin de Fastify `apps/api/src/plugins/auth.ts` con validación asimétrica de JWT mediante JWKS (`jose`) y caché en memoria de claves públicas.
  * Endpoint canónico `GET /players/me` para resolver el perfil y progreso del usuario autenticado (404 `PLAYER_PROFILE_REQUIRED` para usuarios nuevos).
  * Enlace forzado inmutable entre el claim `sub` del token y `players.auth_user_id`.
  * Protección anti-IDOR con 403 Forbidden en `PATCH /players/:id`.
  * Modo de pruebas determinista `AUTH_MOCK=true` para tests automatizados locales (estrictamente inhabilitado en producción).
  * Documentación completa en `docs/authentication.md` y actualización de `.env.example` / `.env.production.example`.

---

## Fase 6: Exercise & Workout System ⏳ (Próxima)
* **Objetivo**: Catálogo de ejercicios y registro de entrenamientos.
* **Alcance previsto**:
  * Catálogo de ejercicios clasificados por grupo muscular y equipo.
  * Registro de sesiones de entrenamiento con series, repeticiones y cargas.
  * Emisión de eventos inmutables en `progress_events` al registrar entrenamientos.

---

## Fase 7: RPG Engine & Progresión ⏳
* **Objetivo**: Cálculo de ganancia de XP, subidas de nivel y proyección de atributos.
* **Alcance previsto**:
  * Algoritmo de cálculo de XP global a partir del volumen e intensidad de entrenamiento.
  * Evaluación de la curva de nivel `100 × N^1.6` y asignación de Skill Points.
  * Recálculo reactivo de los 7 atributos base (1-100) en base a las habilidades hijas.

---

## Fase 8: Hábitos, Consistencia y Decay ⏳
* **Objetivo**: Sistema de consistencia de hábitos y prevención de degradación de habilidades.
* **Alcance previsto**:
  * Logger diario de hábitos con estados `COMPLETED`, `SKIPPED`, `REST_DAY`, `FAILED`.
  * Cálculo de consistencia en ventana móvil de 30 días.
  * Regla de descanso: congelación de decay hasta un máximo de 3 días consecutivos.

---

## Fase 9: Misiones y Logros ⏳
* **Objetivo**: Quests diarias/semanales y catálogo de logros permanentes.
* **Alcance previsto**:
  * Asignación y seguimiento de misiones (`quests`, `quest_progress`).
  * Desbloqueo y auditoría de logros (`achievements`, `player_achievements`).
  * Sistema de recompensas polimórficas (`rewards`).

---

## Fase 10: Integración Frontend Mobile (Expo / Clerk) ⏳
* **Objetivo**: Conectar el cliente React Native/Expo con la API autenticada de producción.
* **Alcance previsto**:
  * Integración de `@clerk/clerk-expo` en `apps/mobile`.
  * Flujo visual de autenticación y pantalla de creación de personaje.
  * Dashboard inicial del jugador consumiendo `GET /players/me`.
