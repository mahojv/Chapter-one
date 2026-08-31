# Chapter One - Guía de Despliegue en Servidor J1900

Este documento contiene las instrucciones operativas exactas para desplegar **Chapter One** en un servidor Linux con procesador Intel Celeron J1900 utilizando **Docker** y **Docker Compose**, sin requerir la instalación de Node.js ni npm en el sistema operativo anfitrión.

---

## 1. Arquitectura de Despliegue

```text
               [ Internet / Clientes ]
                          │
                          ▼
             [ Cloudflare Edge Network ]
                          │ (Túnel cifrado)
                          ▼
         [ Servidor J1900: cloudflared ]
                          │
                          ▼ (HTTP local: 127.0.0.1:3001)
┌─────────────────────────────────────────────────────────────┐
│ Docker Host (J1900)                                         │
│                                                             │
│  Red Docker Bridge (chapter_network)                        │
│  ┌────────────────────────┐      ┌────────────────────────┐ │
│  │   chapter-one-api      │─────▶│  chapter-one-postgres  │ │
│  │   (Node 22 Alpine)     │      │  (Postgres 18 Alpine)  │ │
│  └────────────────────────┘      └────────────────────────┘ │
│               ▲                               │             │
└───────────────┼───────────────────────────────┼─────────────┘
                │                               ▼
      127.0.0.1:3001 (Host)        Volumen: postgres_data
```

* **Aislamiento de PostgreSQL**: No publica ningún puerto hacia el host (`ports:` omitido). Solo la API puede comunicarse con la base de datos a través de la red privada `chapter_network`.
* **Exposición Segura de la API**: Publicada exclusivamente en `127.0.0.1:${API_PORT:-3001}:3001`. Ningún puerto queda expuesto a interfaces de red públicas. El túnel de Cloudflare instalado en el host (`cloudflared`) se encarga de la salida hacia el subdominio de `odysseo.uk`.
* **Bajo Consumo de Recursos**: Ambas imágenes utilizan Alpine Linux, reduciendo drásticamente la huella de memoria RAM y uso de disco en el procesador J1900.

---

## 2. Prerrequisitos en el Servidor J1900

* Docker Engine (versión 29.x o compatible).
* Docker Compose (v2.x o superior / Compose plugin).
* Git.
* Cloudflare Tunnel (`cloudflared`) instalado y autenticado en el host.

*(No se requiere instalar Node.js, npm ni PostgreSQL en el host).*

---

## 3. Procedimiento de Despliegue Paso a Paso

### Paso 1: Clonar el repositorio y acceder al directorio

```bash
git clone https://github.com/mahojv/Chapter-one.git chapter-one
cd chapter-one
```

### Paso 2: Configurar las variables de entorno de producción

Copia la plantilla de producción y define una contraseña segura para PostgreSQL:

```bash
cp .env.production.example .env
nano .env
```

Configura tu archivo `.env` con valores reales:
```dotenv
NODE_ENV=production
API_PORT=3001
API_HOST=0.0.0.0

POSTGRES_DB=chapter_one_prod
POSTGRES_USER=chapter_one
POSTGRES_PASSWORD=TU_CONTRASENA_SUPER_SEGURA_AQUI
```

> [!CAUTION]
> Asegúrate de no versionar el archivo `.env` en Git. El `.gitignore` ya lo excluye por defecto.

### Paso 3: Construir e iniciar el stack de contenedores

```bash
docker compose up -d --build
```

Esto descargará `postgres:18-alpine`, compilará la imagen optimizada de `chapter-one-api` e iniciará los servicios. La API esperará automáticamente a que PostgreSQL complete su healthcheck (`pg_isready`) antes de iniciar.

### Paso 4: Ejecutar las migraciones de base de datos (Explícito)

Dado que las migraciones no se ejecutan automáticamente al inicio, ejecútalas mediante el contenedor de la API:

```bash
docker compose exec api node dist/db/migrate.js
```

Salida esperada:
```text
[Migración] Iniciando proceso de migración de base de datos...
[Migración] Ejecutando 001_initial_schema.sql...
[Migración] 001_initial_schema.sql ejecutada exitosamente.
[Migración] Todas las migraciones se completaron con éxito.
```

### Paso 5: Aplicar los datos iniciales (Seeds)

Inserta los 7 atributos base y las 10 habilidades iniciales del RPG:

```bash
docker compose exec api node dist/db/seed.js
```

Salida esperada:
```text
[Semillas] Iniciando inserción de datos iniciales...
[Semillas] Aplicando initial_seeds.sql...
[Semillas] initial_seeds.sql aplicada exitosamente.
[Semillas] Todos los datos iniciales fueron aplicados con éxito.
```

### Paso 6: Verificar el estado de salud del sistema

Realiza una petición local al endpoint de salud:

```bash
curl http://127.0.0.1:3001/health
```

Respuesta JSON esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-08-31T22:45:00.000Z",
  "uptime": 15,
  "version": "0.1.0",
  "environment": "production",
  "database": "connected"
}
```

---

## 4. Configuración con Cloudflare Tunnel (`cloudflared`)

En el servidor J1900, configura la ruta del túnel para apuntar al puerto local de la API:

1. En el archivo de configuración de tu túnel (`~/.cloudflared/config.yml`) o desde el panel de Cloudflare Zero Trust:
   ```yaml
   ingress:
     - hostname: api.odysseo.uk # o el subdominio configurado
       service: http://127.0.0.1:3001
     - service: http_status:404
   ```
2. Reinicia o inicia el servicio de Cloudflare:
   ```bash
   sudo systemctl restart cloudflared
   ```
3. Comprueba el acceso público mediante HTTPS:
   ```bash
   curl -I https://api.odysseo.uk/health
   ```

---

## 5. Comandos de Operación y Mantenimiento

### Ver el estado de los contenedores:
```bash
docker compose ps
```

### Ver logs en tiempo real de la API:
```bash
docker compose logs -f api
```

### Ver logs de PostgreSQL:
```bash
docker compose logs -f postgres
```

### Detener el stack (los datos de PostgreSQL se conservan en el volumen):
```bash
docker compose down
```

### Actualizar el código y reconstruir la API en futuros despliegues:
```bash
git pull origin main
docker compose up -d --build api
docker compose exec api node dist/db/migrate.js
```

### Realizar respaldo manual de la base de datos:
```bash
docker compose exec postgres pg_dump -U chapter_one chapter_one_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```
