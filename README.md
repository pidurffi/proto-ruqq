<h1 align="center">Ruqq</h1>

<p align="center">
  Motor de precios y generación de presupuestos para hotelería.<br>
  API REST multi-tenant construida con NestJS, TypeORM y PostgreSQL.
</p>

---

## Qué hace

Ruqq resuelve tres cosas para un hotel:

1. **Cargar tarifas** por tipo de habitación, día y plan tarifario, con un modelo de calendario
   diario equivalente al que usan Booking.com, Airbnb y Expedia.
2. **Cotizar una estadía** — check-in, check-out y cantidad de pasajeros — devolviendo las unidades
   disponibles con todos sus planes tarifarios y precios.
3. **Generar el presupuesto formateado** que el hotel le manda al huésped, ensamblado desde
   plantillas de bloques de contenido con variables.

Cada hotel vive aislado en su propio schema de PostgreSQL, seleccionado por el header `X-Tenant-ID`.

**No es un motor de reservas**: no hay entidad de reserva, ni cobro, ni bloqueo de inventario.

> ### Estado: prototipo funcional
>
> El núcleo está implementado y es coherente. Los dos problemas de seguridad detectados en la
> auditoría ya están corregidos, pero queda deuda que impide llevarlo a producción: el motor de
> cotización está duplicado e incompleto, no hay tests y algún endpoint es un stub. Antes de
> desplegar esto en cualquier lado, leer **[docs/ESTADO.md](docs/ESTADO.md)**.

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Modelo de datos, motor de cotización, multi-tenancy, convenciones |
| [docs/API.md](docs/API.md) | Referencia de endpoints con el estado real de cada uno |
| [docs/ESTADO.md](docs/ESTADO.md) | Auditoría de deuda técnica y orden de trabajo sugerido |
| [docs/CONFIGURACION.md](docs/CONFIGURACION.md) | Variables de entorno verificadas contra el fuente |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Ideas y mejoras pendientes de priorizar |
| [CLAUDE.md](CLAUDE.md) | Convenciones obligatorias de desarrollo |
| [docs/database-schema.dbml](docs/database-schema.dbml) | Esquema para [dbdiagram.io](https://dbdiagram.io) |

---

## Puesta en marcha

### Requisitos

- Node.js 20 o superior
- PostgreSQL 16
- Docker (opcional, para levantar la base)

### 1. Dependencias

```bash
npm install
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

> Las plantillas `.env.example` y `.env.template` están desactualizadas y se contradicen. Completá
> el `.env` siguiendo **[docs/CONFIGURACION.md](docs/CONFIGURACION.md)**, que es la única lista
> verificada contra el código.

### 3. Base de datos

```bash
cp docker-compose.yml.template docker-compose.yml
# Ajustar credenciales, puerto y volumen — ver docs/CONFIGURACION.md
docker compose up -d
```

### 4. Migraciones y datos iniciales

```bash
npm run db:setup      # migraciones + seeders
```

O por separado:

```bash
npm run db:migrate    # crea el esquema
npm run db:seed       # super admin, tenants y datos de ejemplo
```

Los datos de ejemplo incluyen cinco tipos de habitación (`LUX`, `PRE`, `SUP`, `EST`, `SUI`) con sus
tarifas diarias, listos para cotizar.

### 5. Levantar la API

```bash
npm run start:dev
```

- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api`

### 6. Primera cotización

```bash
curl -X POST http://localhost:3001/api/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{"pax":2,"checkInDate":"2026-10-10","checkOutDate":"2026-10-13"}'
```

---

## Comandos

### Desarrollo

| Comando | Descripción |
|---|---|
| `npm run start:dev` | servidor con recarga automática |
| `npm run start:debug` | servidor en modo debug |
| `npm run build` | compila a `dist/` |
| `npm run lint` | ESLint con `--fix` |
| `npm run format` | Prettier |

### Base de datos

| Comando | Descripción |
|---|---|
| `npm run db:migrate` | ejecuta las migraciones pendientes |
| `npm run db:revert` | revierte la última migración |
| `npm run db:migration:generate -n <Nombre>` | genera una migración desde los cambios de entidad |
| `npm run db:createEmpty <Nombre>` | crea una migración vacía |
| `npm run db:seed` | ejecuta los seeders |
| `npm run db:setup` | migraciones + seeders |

### Multi-tenant

| Comando | Descripción |
|---|---|
| `npm run setup:multitenant` | instala la infraestructura de tenants |
| `npm run setup:complete` | setup integral: base, tenants y datos |

### Generación de módulos

Los módulos CRUD **no se escriben a mano**:

```bash
npm run create-engine nombre-del-modulo    # kebab-case
```

Genera controller, service, entity, DTOs, providers y repository con la estructura estándar. Después
se le agregan los campos a la entidad. Un módulo nuevo necesita además su `*-tenant.providers.ts`
para funcionar en multi-tenant — ver [CLAUDE.md](CLAUDE.md).

### Testing

**No hay.** El proyecto no tiene `jest` ni `@nestjs/testing` instalados, ni script `test`. El archivo
`test/app.e2e-spec.ts` es el scaffold de NestJS y no puede ejecutarse. Es la deuda más urgente
después de los dos problemas de seguridad — ver [docs/ESTADO.md](docs/ESTADO.md) §6.

---

## Estructura

```
src/
├── main.ts              bootstrap, CORS, prefijo /api, Swagger
├── app.module.ts        registro de módulos
├── common/              entidad base, DateUtils, TenantService, middleware, mailer, interceptores
├── config/              ormconfig, tenant-typeorm, mailer
├── engine/              auth, seeders, migraciones, generador de módulos
└── resources/           módulos de dominio
    ├── room-type/           tipos de habitación
    ├── rate-plan/           planes tarifarios (BAR, no reembolsable, con desayuno…)
    ├── daily-room-rates/    calendario diario de tarifas — entidad central
    ├── quotes/              motor de cotización
    ├── quote-generator/     presupuestos formateados
    ├── quote-template/      plantillas
    ├── content-block/       bloques de contenido con variables
    ├── price-matrix/        grilla de precios para el panel
    ├── calendar/            edición masiva (stub)
    └── restrictions/        remanente del modelo anterior
```

---

## Convención de ramas

- `main` — producción
- `dev` — integración
- `feature/<descripción>` — desarrollo

**No se desarrolla directamente sobre `main` ni `dev`.**

---

Autores: Hernán Molinari y Gastón Rodríguez. Construido sobre el boilerplate propio `boiler-hm`.
