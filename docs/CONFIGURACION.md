# Configuración

Referencia de variables de entorno **verificada contra el fuente**: cada variable de este documento
aparece en un `process.env.*` o un `configService.get()` del código.

> **Las plantillas del repositorio están desactualizadas.** `.env.example` y `.env.template` se
> contradicen entre sí y declaran variables que el código no lee (`DB_LOGGING`, `JWT_EXPIRATION`,
> `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`). Usá **este** documento como
> fuente de verdad hasta que se consoliden. Ver [ESTADO.md](ESTADO.md) §11.

---

## Entorno

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | Controla el fallback del middleware multi-tenant. En `development`, si el tenant no valida cae al tenant por defecto; en `production`, la request falla |
| `ENVIRONMENT` | `local` | Etiqueta de entorno de la aplicación |

## Aplicación

| Variable | Ejemplo | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto de escucha. La app monta todo bajo `/api` |
| `HOST_API` | `http://localhost:3001/api` | URL pública de la API |

## Base de datos

| Variable | Ejemplo | Descripción |
|---|---|---|
| `PG_DB_HOST` | `localhost` | |
| `PG_DB_PORT` | `5432` | |
| `PG_DB_NAME` | `ruqq` | |
| `PG_DB_USERNAME` | `ruqq` | |
| `PG_DB_PASSWORD` | — | |
| `PG_DB_SYNCHRONIZE` | `false` | **Dejar siempre en `false`.** El esquema se versiona con migraciones |
| `PG_DB_LOGGING` | `false` | Log de consultas SQL |
| `PG_DB_RUN_MIGRATIONS` | `false` | Corre las migraciones pendientes al arrancar |
| `PG_DB_INSTANCE` | — | Opcional, sólo para instancias con nombre |

## Multi-tenant

| Variable | Ejemplo | Descripción |
|---|---|---|
| `DEFAULT_TENANT_ID` | `default` | Tenant usado cuando la request no trae `X-Tenant-ID` |
| `DEFAULT_SCHEMA` | `public` | Schema correspondiente al tenant por defecto |

Los tenants válidos **no** se configuran por entorno: están hardcodeados en
`src/common/services/tenant.service.ts:18`. Ver [ESTADO.md](ESTADO.md) §7.

## Seguridad

| Variable | Ejemplo | Descripción |
|---|---|---|
| `JWT_SECRET` | — | Secreto de firma del JWT. Largo y aleatorio |
| `CORS_WHITE_LIST` | `http://localhost:4200` | Orígenes permitidos, separados por coma |
| `SUPERADMIN_DEV_PASSWORD` | — | Password del super admin que crea el seeder. **Eliminar en producción** |

## Mailer

| Variable | Ejemplo | Descripción |
|---|---|---|
| `MAILER_HOST` | `smtp.example.com` | |
| `MAILER_PORT` | `465` | |
| `MAILER_SECURE` | `true` | |
| `MAILER_USER` | `no-reply@example.com` | |
| `MAILER_PASS` | — | |
| `MAILER_FROM` | `no-reply@example.com` | Remitente |
| `MAILER_SEND_TO` | `alertas@example.com` | Destinatario de las notificaciones del logger |
| `MAILER_POOL` | `true` | Pool de conexiones SMTP |
| `MAILER_MAX_CONNECTIONS` | `5` | |
| `MAILER_MAX_MESSAGES` | `100` | |
| `MAILER_RETRIES` | `3` | |
| `MAILER_RETRY_DELAY` | `1000` | Milisegundos entre reintentos |
| `DISABLE_EMAIL_SENDING` | `true` | Corta el envío real. Conviene activarlo en desarrollo |

## Deploy del frontend (opcional)

Sólo se usan si se invoca `POST /api/deploy/build-frontend`.

| Variable | Descripción |
|---|---|
| `DIST_PATH` | Ruta del build del frontend |
| `FRONTEND_PATH` | Ruta del proyecto frontend |

---

## Lo que no va en el `.env`

La configuración de **uploads** —rutas estáticas, tamaños máximos, extensiones permitidas y
dimensiones de imagen— vive en `config.json`, en la raíz del proyecto. Ese archivo también conserva
la sección `hotel-sections`, heredada del boilerplate y sin uso en la API actual.

---

## Base de datos en Docker

El repositorio trae `docker-compose.yml.template`, **heredado del boilerplate y desactualizado**:
nombra la base `boiler-00`, trae credenciales del proyecto original, expone el puerto `5435` y tiene
el volumen de datos comentado —o sea que **la base se pierde al recrear el contenedor**.

Al copiarlo hay que ajustarlo para que coincida con el `.env` y descomentar el volumen:

```yaml
services:
  dbpg:
    image: postgres:16.2
    restart: always
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: ruqq
      POSTGRES_PASSWORD: <la misma que PG_DB_PASSWORD>
      POSTGRES_DB: ruqq
      TZ: America/Argentina/Buenos_Aires
    container_name: ruqq-db
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
