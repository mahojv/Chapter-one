# =============================================================================
# Chapter One - Dockerfile Multi-stage para API Backend (Producción)
# Optimizado para arquitecturas Linux x86_64 de bajo consumo (Intel J1900)
# =============================================================================

# -----------------------------------------------------------------------------
# Etapa 1: Builder (Instalación de dependencias y compilación de TypeScript)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilar si hiciera falta
RUN apk add --no-cache libc6-compat

# Copiar manifiestos de paquetes del monorepo (excluyendo apps/mobile)
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types/package.json packages/types/tsconfig.json ./packages/types/
COPY packages/validation/package.json packages/validation/tsconfig.json ./packages/validation/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/

# Instalar dependencias completas para compilar (utilizando npm ci con workspaces)
RUN npm ci --workspace=@chapter-one/api --workspace=@chapter-one/types --workspace=@chapter-one/validation --include-workspace-root

# Copiar código fuente de los paquetes requeridos por la API
COPY packages/types/src ./packages/types/src
COPY packages/validation/src ./packages/validation/src
COPY apps/api/src ./apps/api/src

# Compilar TypeScript a JavaScript (dist/)
RUN npm run build --workspace=@chapter-one/api

# Copiar activos SQL (migraciones y semillas) al directorio de distribución dist/db/
RUN cp -r apps/api/src/db/migrations apps/api/dist/db/migrations && \
    cp -r apps/api/src/db/seeds apps/api/dist/db/seeds

# Podar dependencias de desarrollo para reducir el tamaño final de la imagen
RUN npm prune --omit=dev --workspace=@chapter-one/api --workspace=@chapter-one/types --workspace=@chapter-one/validation --include-workspace-root

# -----------------------------------------------------------------------------
# Etapa 2: Runner (Entorno de ejecución de producción minimalista)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV API_PORT=3001
ENV API_HOST=0.0.0.0

# Copiar árbol de dependencias podadas y paquetes del monorepo
COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/types /app/packages/types
COPY --from=builder /app/packages/validation /app/packages/validation

# Copiar la aplicación API construida con sus activos
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist

# Utilizar usuario sin privilegios de root incluido en node:alpine para mayor seguridad
USER node

# Exponer el puerto interno de la API
EXPOSE 3001

# Comando por defecto: arrancar el servidor Fastify
CMD ["node", "dist/index.js"]
