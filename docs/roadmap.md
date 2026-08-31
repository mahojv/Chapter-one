# Chapter One - Roadmap del Proyecto

Este documento establece la secuencia cronológica de las fases de desarrollo para **Chapter One**, desde la fundación técnica hasta el despliegue en producción.

---

## Fase 1: Foundation (Actual)
* **Objetivo**: Establecer la infraestructura técnica y arquitectura monorepo.
* **Entregables**:
  * Estructura npm workspaces con frontend (`apps/mobile`), backend (`apps/api`) y paquetes compartidos (`packages/types`, `packages/validation`).
  * Backend Fastify con endpoint base `GET /health`.
  * Configuración de PostgreSQL 18 Alpine mediante Docker Compose.
  * Herramientas de calidad integradas (TypeScript estricto, ESLint, Prettier, Vitest).
  * Documentación técnica inicial y arquitectura.

---

## Fase 2: Player System
* **Objetivo**: Gestión de la identidad del usuario y perfil del jugador.
* **Alcance previsto**:
  * Autenticación segura y gestión de sesiones (registro, login, tokens).
  * Perfil del jugador (avatar, clase de personaje inicial, datos biográficos y preferencias).
  * Modelado relacional en PostgreSQL para cuentas de usuario y perfiles.

---

## Fase 3: Exercise System
* **Objetivo**: Catálogo y biblioteca integral de ejercicios físicos.
* **Alcance previsto**:
  * Base de datos de ejercicios clasificados por grupos musculares, equipo necesario y nivel de dificultad.
  * Instrucciones técnicas, pautas de forma y precauciones anatómicas.
  * Endpoints y vistas frontend para explorar, buscar y filtrar ejercicios.

---

## Fase 4: Workout System
* **Objetivo**: Registro, estructuración y ejecución de sesiones de entrenamiento.
* **Alcance previsto**:
  * Creación y gestión de rutinas y planes de entrenamiento.
  * Logger de sesiones en tiempo real (series, repeticiones, cargas y tiempos de descanso).
  * Historial de entrenamientos y persistencia de rendimiento por sesión.

---

## Fase 5: RPG Engine
* **Objetivo**: Núcleo matemático de gamificación y progresión de nivel.
* **Alcance previsto**:
  * Algoritmo de ganancia de experiencia (XP) calculado a partir de la intensidad y volumen del entrenamiento.
  * Curva de nivel del jugador (niveles 1 a 100).
  * Atributos de personaje: Fuerza (STR), Resistencia (STA), Agilidad (AGI), Vitalidad (VIT) y Disciplina (DIS).

---

## Fase 6: Quests & Missions
* **Objetivo**: Sistema de misiones diarias, semanales y retos épicos.
* **Alcance previsto**:
  * Generación y seguimiento de misiones diarias (ej. entrenar 45 minutos, cumplir hidratación).
  * Misiones semanales de consistencia y desafíos de superación.
  * Recompensas en experiencia, insignias y títulos desbloqueables.

---

## Fase 7: Skills & Skill Tree
* **Objetivo**: Árbol de habilidades y maestría física del jugador.
* **Alcance previsto**:
  * Ramas de especialización (Fuerza, Resistencia, Movilidad, Longevidad).
  * Desbloqueo de nodos y habilidades pasivas al alcanzar hitos físicos.
  * Visualización interactiva del árbol de habilidades en el cliente móvil.

---

## Fase 8: Progress & Measurements
* **Objetivo**: Métricas de composición corporal y registros visuales de progreso.
* **Alcance previsto**:
  * Registro de peso corporal, porcentaje de grasa y medidas antropométricas.
  * Gráficas de evolución y tendencias temporales.
  * Galería cronológica y privada de fotografías de progreso físico.

---

## Fase 9: Gamification
* **Objetivo**: Retención, recompensas y dinámicas de juego avanzadas.
* **Alcance previsto**:
  * Sistema de rachas (streaks) y multiplicadores de bonificación.
  * Logros especiales, medallas conmemorativas y títulos de jugador.
  * Pantallas de felicitación, efectos visuales de "Level Up" y recompensas auditivas/hápticas.

---

## Fase 10: AI Coach
* **Objetivo**: Asistente inteligente y personalizado para el entrenamiento.
* **Alcance previsto**:
  * Análisis inteligente del rendimiento y fatiga acumulada.
  * Recomendaciones automáticas de sobrecarga progresiva y ajustes de volumen.
  * Feedback interactivo con el jugador según sus objetivos y nivel de RPG.

---

## Fase 11: Nutrition
* **Objetivo**: Planificación y registro nutricional alineado al rendimiento físico.
* **Alcance previsto**:
  * Registro simplificado de macronutrientes y aporte calórico.
  * Metas nutricionales dinámicas según días de entrenamiento vs. días de descanso.
  * Sincronización del estado de energía del personaje con la nutrición real.

---

## Fase 12: Deployment
* **Objetivo**: Puesta en producción y distribución en tiendas de aplicaciones.
* **Alcance previsto**:
  * Configuración de entornos de staging y producción.
  * Pipelines de CI/CD para compilación, pruebas automáticas y releases (Expo EAS).
  * Publicación de la app móvil en Google Play Store y Apple App Store.
  * Despliegue del backend Fastify y PostgreSQL en infraestructura en la nube.
