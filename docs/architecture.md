# Chapter One - Arquitectura del Sistema

Este documento describe la arquitectura general de **Chapter One**, un ecosistema de transformación física gamificado como un RPG en la vida real.

---

## 1. Estructura del Monorepo

El proyecto está organizado como un monorepo gestionado con **npm workspaces**. La jerarquía de directorios es la siguiente:

```text
chapter-one/
├── apps/
│   ├── mobile/             # Cliente Frontend (React Native / Expo)
│   └── api/                # Servidor Backend (Node.js / Fastify)
│       ├── src/
│       │   ├── routes/         # Capa de transporte y controladores HTTP
│       │   ├── services/       # Capa de lógica de negocio y casos de uso
│       │   ├── repositories/   # Capa de acceso a datos y consultas SQL
│       │   ├── plugins/        # Plugins de Fastify (database, auth)
│       │   └── db/             # Cliente PostgreSQL, migraciones y semillas
├── packages/
│   ├── types/              # Tipos e interfaces TypeScript compartidos
│   └── validation/         # Esquemas de validación Zod y tipos inferidos
├── docs/
│   ├── architecture.md     # Documento de arquitectura técnica (este archivo)
│   ├── authentication.md   # Arquitectura de autenticación e identidad
│   ├── domain-model.md     # Modelo conceptual y entidades de dominio
│   ├── game-design.md      # Reglas y mecánicas del RPG
│   ├── roadmap.md          # Plan de fases del proyecto
│   └── deployment-j1900.md # Guía operativa para despliegue en servidor J1900
├── docker-compose.yml      # Entorno de contenedores (PostgreSQL 18 Alpine + API)
├── Dockerfile              # Construcción multi-stage optimizada para producción
├── .dockerignore           # Exclusiones de contexto para construcción Docker
├── .env.example            # Plantilla de variables de entorno para desarrollo
├── .env.production.example # Plantilla de variables de entorno para producción
├── package.json            # Configuración de workspaces y scripts unificados
├── tsconfig.base.json      # Configuración base estricta de TypeScript
├── eslint.config.mjs       # Reglas de linting unificadas (Flat Config)
├── .prettierrc             # Reglas de estilo de código unificadas
└── vitest.config.ts        # Configuración de ejecución de pruebas unitarias
```

---

## 2. Responsabilidad de las Aplicaciones

### Frontend (`apps/mobile`)
* **Tecnologías**: React Native, Expo SDK 57, Expo Router, React Native Web, TypeScript.
* **Propósito**: Interfaz de usuario multiplataforma (iOS, Android y Web).
* **Responsabilidades**:
  * Renderizado reactivo de la interfaz, animaciones y presentación visual.
  * Captura de interacciones del usuario y gestión del estado local del cliente.
  * Consumo de la API Backend mediante peticiones HTTP asíncronas seguras con tokens Bearer.
  * Almacenamiento local seguro de sesiones y credenciales.

### Backend API (`apps/api`)
* **Tecnologías**: Node.js, Fastify, TypeScript, PostgreSQL (pg), Jose.
* **Propósito**: Capa de servicios RESTful y motor de lógica central del sistema.
* **Arquitectura de 3 Capas**:
  1. **Capa de Rutas (`routes/`)**: Exposición de endpoints REST, validación de esquemas HTTP con Zod y mapeo de códigos de estado HTTP (200, 201, 400, 401, 403, 404, 409, 500).
  2. **Capa de Servicios (`services/`)**: Orquestación de reglas de negocio, transacciones atómicas, control de propiedad y emisión de errores de dominio.
  3. **Capa de Repositorios (`repositories/`)**: Consultas SQL parametrizadas directas y mapeo de filas relacionales a estructuras de datos.

---

## 3. Seguridad y Autenticación

Chapter One implementa una arquitectura de autenticación desacoplada:

* **Proveedor de Identidad**: **Clerk** gestiona el registro, inicio de sesión, biometría, OAuth y emisión de tokens.
* **Validación en Backend**: La API valida asimétricamente los JWTs mediante **JWKS** (`apps/api/src/plugins/auth.ts`) utilizando la biblioteca estándar `jose`.
* **Identidad del Jugador**: El claim `sub` del token se asocia inmutablemente con `players.auth_user_id`.
* **Endpoints Clave**:
  * `GET /players/me`: Consulta el perfil propio del usuario autenticado (retorna 404 `PLAYER_PROFILE_REQUIRED` si no ha creado personaje).
  * `POST /players`: Crea el personaje asociándolo de forma forzada al `authUserId` del token.
  * `PATCH /players/:id`: Actualiza datos comprobando que el usuario autenticado sea el dueño legítimo (protección anti-IDOR con 403 Forbidden).

*(Ver detalles completos en [`docs/authentication.md`](file:///c:/Users/Ciudad%20Maderas/Documents/React/Chapter-one/docs/authentication.md)).*

---

## 4. Papel de PostgreSQL

* **Motor**: PostgreSQL 18 Alpine, desplegado mediante Docker Compose.
* **Función en la Arquitectura**:
  * Fuente única de la verdad (*Single Source of Truth*) para los datos persistentes del sistema.
  * Modelo de dominio completo con 15 entidades relacionales, tipos ENUM estrictos, checks y restricciones de integridad.
  * Control de versiones de esquema mediante la tabla `_schema_migrations`.
* **Aislamiento de Red**: PostgreSQL opera dentro de la red privada interna de Docker (`chapter_network`) sin exponer puertos públicos al host. Solo la API se comunica directamente con la base de datos.

---

## 5. Propósito de los Paquetes Compartidos (`packages/`)

### `@chapter-one/types`
* **Ubicación**: `packages/types`
* **Contenido**: Interfaces, tipos auxiliares, tipos genéricos de respuesta (`ApiResponse<T>`, `HealthResponse`), enumeraciones de estado y utilidades puras de TypeScript sin dependencias en tiempo de ejecución.

### `@chapter-one/validation`
* **Ubicación**: `packages/validation`
* **Contenido**: Esquemas autoritativos de validación de datos basados en Zod e inferencia de tipos estáticos (`esquemaCrearJugador`, `esquemaActualizarJugador`, `esquemaParametroIdJugador`, etc.).
* **Uso**: Garantiza que las mismas reglas de validación se apliquen de forma preventiva en el frontend y de forma estricta en el backend.

---

## 6. Comandos de Calidad del Monorepo

```bash
# Verificación estricta de tipos en todos los paquetes y apps
npm run typecheck

# Análisis estático de código con ESLint
npm run lint

# Ejecución de pruebas automatizadas con Vitest
npm run test

# Comprobación de formato con Prettier
npm run format:check

# Formateo automático de todo el código
npm run format
```
