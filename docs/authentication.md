# Chapter One - Arquitectura de Autenticación e Identidad (Fase 5)

Este documento describe la arquitectura, diseño y mecanismos de seguridad del sistema de **identidad y autenticación** de Chapter One.

---

## 1. Filosofía y Principios de Diseño

1. **Desacoplamiento de Credenciales**: La base de datos PostgreSQL de Chapter One no almacena contraseñas, hashes, sesiones ni información sensible de autenticación.
2. **Proveedor de Identidad Externo (IdP)**: Se utiliza **Clerk** como proveedor de identidad, aprovechando su integración con React Native / Expo, soporte para autenticación biométrica y social (Google, Apple), y gestión segura de sesiones en la nube sin sobrecargar el servidor Linux J1900.
3. **Validación Criptográfica Asimétrica (JWKS)**: La API Fastify valida los tokens JWT emitidos por Clerk utilizando el conjunto de claves públicas JWKS (*JSON Web Key Set*) de forma asimétrica (RS256/EdDSA). No se requiere realizar peticiones HTTP hacia Clerk por cada solicitud del cliente gracias al almacenamiento en caché en memoria de las claves públicas.
4. **Enlace Inmutable del Jugador (`auth_user_id`)**: La columna `players.auth_user_id` actúa como enlace único entre la cuenta del usuario en Clerk y su perfil de juego en PostgreSQL.

---

## 2. Flujo de Autenticación

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Cliente (Expo / React Native)                                            │
│    El usuario inicia sesión con Clerk (OAuth / Email / Biometría)           │
│    Clerk emite un JWT firmado que contiene: { "sub": "user_2b9xZ7..." }     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ 2. Petición HTTP con Cabecera
                                       │    Authorization: Bearer <jwt>
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Backend API (Fastify: pluginAutenticacion)                               │
│    - Verifica la firma criptográfica usando la clave pública de Clerk (JWKS)│
│    - Valida expiración (exp) y emisor (iss)                                 │
│    - Extrae el claim 'sub' y lo inyecta en: request.authUserId              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       │ 4. Resolución de Identidad
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. Repositorio / Base de Datos                                              │
│    SELECT * FROM players WHERE auth_user_id = request.authUserId            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Endpoints Protegidos y Reglas de Seguridad

### A. `GET /players/me` *(Canónico)*
* **Propósito**: Permite al cliente autenticado consultar su propio perfil y progreso sin conocer su UUID previamente.
* **Seguridad**:
  * Requiere `Authorization: Bearer <token>`.
  * Consulta en PostgreSQL por `auth_user_id = request.authUserId`.
  * **200 OK**: Retorna el `Player` y su `PlayerProgress` inicial.
  * **404 Not Found** (`PLAYER_PROFILE_REQUIRED`): Indica que el usuario de Clerk está autenticado pero aún no ha completado el onboarding / creación de personaje.

### B. `POST /players`
* **Propósito**: Creación del personaje inicial del jugador.
* **Seguridad**:
  * Requiere `Authorization: Bearer <token>`.
  * **Asignación Forzada**: El backend ignora o sobreescribe cualquier `authUserId` provisto en el cuerpo JSON, enlazando inmutablemente el nuevo registro con `request.authUserId`.
  * **409 Conflict** (`PLAYER_CONFLICT`): Si el usuario autenticado ya posee un jugador registrado.
  * **201 Created**: Inserción atómica transaccional en `players` y `player_progress`.

### C. `PATCH /players/:id`
* **Propósito**: Actualización parcial de campos editables (`displayName`, `timezone`).
* **Seguridad**:
  * Requiere `Authorization: Bearer <token>`.
  * **Protección contra IDOR (*Insecure Direct Object References*)**: Comprueba que el jugador a modificar tenga un `auth_user_id` idéntico a `request.authUserId`.
  * **403 Forbidden** (`FORBIDDEN`): Si un usuario intenta modificar el perfil de otro.
  * **404 Not Found** (`PLAYER_NOT_FOUND`): Si el UUID del jugador no existe.

### D. `GET /players/:id`
* **Público**: Permite consultar la ficha pública de cualquier jugador mediante su UUID.

---

## 4. Configuración de Variables de Entorno

El plugin de autenticación (`apps/api/src/plugins/auth.ts`) lee las siguientes variables:

| Variable | Entorno | Descripción |
| :--- | :--- | :--- |
| `AUTH_JWKS_URI` | Producción / Dev | URL del endpoint JWKS de Clerk (ej. `https://<tenant>.clerk.accounts.dev/.well-known/jwks.json`). |
| `AUTH_ISSUER` | Producción / Dev | URL del emisor esperado en los tokens (ej. `https://<tenant>.clerk.accounts.dev`). |
| `AUTH_AUDIENCE` | Opcional | Audiencia esperada en los tokens JWT. |
| `AUTH_MOCK` | Desarrollo / Test | Booleano (`true`/`false`). Si es `true`, permite tokens simulados con prefijo `mock_` o `test_`. **Inhabilitado estrictamente en `NODE_ENV=production`**. |

---

## 5. Modo de Pruebas y Desarrollo Local (`AUTH_MOCK`)

Para permitir la ejecución de tests automatizados (Vitest) y desarrollo local sin conexión constante a Clerk:

1. Se define `AUTH_MOCK=true` en `.env`.
2. El plugin acepta tokens en el formato:
   ```http
   Authorization: Bearer mock_usuario_prueba
   ```
3. La API asigna directamente `request.authUserId = 'mock_usuario_prueba'`, permitiendo simular múltiples usuarios concurrentes, conflictos y controles de acceso de manera determinista y veloz.
4. **Salvaguarda**: En producción (`NODE_ENV === 'production'`), el plugin ignora el modo mock y exige obligatoriamente firmas válidas contra el JWKS remoto.

---

## 6. Integración Futura con el Frontend (`apps/mobile`)

Cuando se implemente la capa de presentación en React Native:

1. Instalar `@clerk/clerk-expo` y `expo-secure-store`.
2. Envolver la aplicación en `<ClerkProvider publishableKey={...}>`.
3. Crear el flujo de pantalla de inicio de sesión / registro.
4. Inyectar el token en las peticiones hacia `https://chapter-api.odysseo.uk`:
   ```ts
   const token = await getToken();
   const response = await fetch('https://chapter-api.odysseo.uk/players/me', {
     headers: { Authorization: `Bearer ${token}` }
   });
   ```
5. Coordinación del enrutador (Expo Router):
   * `401 Unauthorized` ➔ Redirigir a pantalla de Login.
   * `404 PLAYER_PROFILE_REQUIRED` ➔ Redirigir a pantalla de Creación de Personaje (`POST /players`).
   * `200 OK` ➔ Redirigir al Dashboard principal del RPG.
