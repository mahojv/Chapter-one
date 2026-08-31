# Chapter One

Transformación física gamificada como un RPG en la vida real.

---

## Estructura del Monorepo

Este proyecto utiliza **npm workspaces** para organizar aplicaciones y paquetes compartidos:

* **`apps/mobile`**: Aplicación móvil y web desarrollada con React Native, Expo Router y React Native Web.
* **`apps/api`**: API Backend RESTful desarrollada con Node.js, Fastify y TypeScript.
* **`packages/types`**: Paquete TypeScript con tipos compartidos de la plataforma.
* **`packages/validation`**: Paquete TypeScript con esquemas de validación compartidos basados en Zod.
* **`docs/`**: Documentación técnica del proyecto ([docs/architecture.md](docs/architecture.md) y [docs/roadmap.md](docs/roadmap.md)).

---

## Prerrequisitos

* **Node.js**: >= 20.x (recomendado Node 22+)
* **npm**: >= 10.x
* **Docker & Docker Compose** (para ejecutar PostgreSQL localmente)

---

## Instalación y Configuración

1. **Instalar dependencias del monorepo**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar la base de datos local (PostgreSQL 18 Alpine)**:
   ```bash
   docker compose up -d
   ```

---

## Comandos Disponibles

### Desarrollo

* Iniciar API Backend:
  ```bash
  npm run dev:api
  ```
  La API estará disponible en `http://localhost:3001` con el endpoint de salud `GET http://localhost:3001/health`.

* Iniciar Aplicación Móvil (Expo):
  ```bash
  npm run dev:mobile
  ```

### Calidad de Código

* **Verificación de Tipos**:
  ```bash
  npm run typecheck
  ```

* **Linter (ESLint)**:
  ```bash
  npm run lint
  ```

* **Pruebas Automatizadas (Vitest)**:
  ```bash
  npm run test
  ```

* **Verificar Formato**:
  ```bash
  npm run format:check
  ```

* **Formatear Código**:
  ```bash
  npm run format
  ```