# Chapter One - Arquitectura del Sistema

Este documento describe la arquitectura general de **Chapter One**, un ecosistema de transformación física gamificado como un RPG en la vida real.

---

## 1. Estructura del Monorepo

El proyecto está organizado como un monorepo gestionado con **npm workspaces**. La jerarquía de directorios es la siguiente:

```text
chapter-one/
├── apps/
│   ├── mobile/         # Cliente Frontend (React Native / Expo)
│   └── api/            # Servidor Backend (Node.js / Fastify)
├── packages/
│   ├── types/          # Tipos e interfaces TypeScript compartidos
│   └── validation/     # Esquemas de validación y utilidades comunes (Zod)
├── docs/
│   ├── architecture.md # Documento de arquitectura técnica (este archivo)
│   └── roadmap.md      # Plan de fases del proyecto
├── docker-compose.yml  # Entorno local de base de datos (PostgreSQL 18 Alpine)
├── .env.example        # Plantilla de variables de entorno seguras
├── package.json        # Configuración de workspaces y scripts unificados
├── tsconfig.base.json  # Configuración base estricta de TypeScript
├── eslint.config.mjs   # Reglas de linting unificadas (Flat Config)
├── .prettierrc         # Reglas de estilo de código unificadas
└── vitest.config.ts    # Configuración de ejecución de pruebas unitarias
```

---

## 2. Responsabilidad de las Aplicaciones

### Frontend (`apps/mobile`)
* **Tecnologías**: React Native, Expo SDK 57, Expo Router, React Native Web, TypeScript.
* **Propósito**: Interfaz de usuario multiplataforma (iOS, Android y Web).
* **Responsabilidades**:
  * Renderizado reactivo de la interfaz, animaciones y presentación visual.
  * Captura de interacciones del usuario y gestión del estado local del cliente.
  * Consumo de la API Backend mediante peticiones HTTP asíncronas.
  * Almacenamiento local para sesiones y caché temporal.

### Backend API (`apps/api`)
* **Tecnologías**: Node.js, Fastify, TypeScript.
* **Propósito**: Capa de servicios RESTful y motor de lógica central del sistema.
* **Responsabilidades**:
  * Exposición de endpoints REST (iniciando con el endpoint de comprobación de salud `GET /health`).
  * Validación estricta de entradas y payloads entrantes.
  * Coordinación de la lógica de negocio, reglas de progreso y cálculo de métricas.
  * Interacción transaccional y persistencia con la base de datos PostgreSQL.

---

## 3. Comunicación Frontend → API

* **Protocolo**: HTTP/1.1 y HTTP/2 mediante peticiones REST (JSON).
* **Seguridad de Tipos**: Las rutas de la API y las peticiones del cliente frontend comparten los mismos contratos de datos definidos en `@chapter-one/types`.
* **Manejo de Errores**: Formato unificado de respuestas de error (`ApiError` y `ApiResponse<T>`) para que el cliente maneje degradaciones de red o fallos de validación con retroalimentación clara al usuario.
* **Políticas CORS**: La API está configurada para admitir solicitudes de orígenes web autorizados durante el desarrollo local mediante `@fastify/cors`.

---

## 4. Papel de PostgreSQL

* **Motor**: PostgreSQL 18 Alpine, desplegado localmente mediante Docker Compose.
* **Función en la Arquitectura**:
  * Fuente única de la verdad (*Single Source of Truth*) para los datos persistentes del sistema.
  * Almacenamiento relacional de usuarios, estados, métricas, entrenamientos y entidades futuras.
  * Transacciones ACID para garantizar consistencia estricta en operaciones críticas (ej. actualización de experiencia, logros o registros físicos).
* **Aislamiento**:
  * Durante esta fase de Foundation, PostgreSQL se mantiene preparado en su contenedor sin modelos de negocio prematuros. Las tablas se introducirán en fases específicas según el Roadmap.

---

## 5. Propósito de los Paquetes Compartidos (`packages/`)

Los paquetes compartidos eliminan la duplicación de código, aseguran coherencia entre frontend y backend y aceleran el desarrollo:

### `@chapter-one/types`
* **Ubicación**: `packages/types`
* **Contenido**: Interfaces, tipos auxiliares, tipos genéricos de respuesta (`ApiResponse<T>`, `HealthResponse`), enumeraciones de estado y utilidades puras de TypeScript.
* **Regla**: Código sin lógica ejecutable en tiempo de ejecución (puramente declaraciones de tipos).

### `@chapter-one/validation`
* **Ubicación**: `packages/validation`
* **Contenido**: Esquemas de validación de datos basados en Zod e inferencia de tipos estáticos.
* **Uso**: Permite validar datos tanto en el frontend antes de enviarlos (validación preventiva) como en el backend antes de procesarlos (validación autoritativa).

---

## 6. Comandos de Calidad del Monorepo

Todos los controles de calidad se pueden orquestar desde la raíz:

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
