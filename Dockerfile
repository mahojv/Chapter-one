# =============================================================================
# Chapter One - Dockerfile Multi-stage para API Backend (Producción)
# Optimizado para arquitecturas Linux x86_64 de bajo consumo (Intel J1900)
# =============================================================================

# -----------------------------------------------------------------------------
# Etapa 1: Builder (Instalación de dependencias y compilación de TypeScript)
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copiar manifiestos de paquetes del monorepo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types/package.json packages/types/tsconfig.json ./packages/types/
COPY packages/validation/package.json packages/validation/tsconfig.json ./packages/validation/
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/mobile/package.json ./apps/mobile/

# Instalación determinista en el ámbito del workspace de la API
RUN npm ci --workspace=@chapter-one/api --include-workspace-root --no-audit --no-fund

# Copiar código fuente de los paquetes requeridos por la API
COPY packages/types/src ./packages/types/src
COPY packages/validation/src ./packages/validation/src
COPY apps/api/src ./apps/api/src

# Compilar TypeScript a JavaScript (dist/)
RUN npm run build --workspace=@chapter-one/api

# Copiar activos SQL (migraciones y semillas) al directorio de distribución dist/db/
RUN cp -r apps/api/src/db/migrations apps/api/dist/db/migrations && \
    cp -r apps/api/src/db/seeds apps/api/dist/db/seeds

# Podar dependencias de desarrollo para dejar únicamente el runtime de producción
RUN npm prune --omit=dev --no-audit --no-fund

# -----------------------------------------------------------------------------
# Etapa 2: Runner (Entorno de ejecución de producción minimalista)
# -----------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV API_PORT=3001
ENV API_HOST=0.0.0.0

# Copiar árbol de dependencias podadas y paquetes del monorepo
COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules /app/apps/api/node_modules
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
