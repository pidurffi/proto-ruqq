# Arquitectura

Documento de referencia técnica de Ruqq. Describe **lo que el código hace hoy**, no lo que se
planificó. Cuando algo está declarado pero no implementado, se dice explícitamente.

Para el estado de avance y la deuda técnica, ver [ESTADO.md](ESTADO.md).

---

## 1. Panorama

Ruqq es una API REST de **motor de precios y generación de presupuestos para hotelería**. Resuelve
tres problemas:

1. **Cargar tarifas** por tipo de habitación, día y plan tarifario.
2. **Cotizar** una estadía (check-in, check-out, cantidad de pasajeros) devolviendo las unidades
   disponibles con sus precios.
3. **Generar el presupuesto formateado** que el hotel le envía al huésped, ensamblado desde
   plantillas de bloques de contenido.

No es un motor de reservas: no hay entidad de reserva, ni cobro, ni bloqueo de inventario. La
cotización se calcula y se devuelve; no se persiste.

### Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript 5.8 (modo estricto) |
| Framework | NestJS 11 |
| ORM | TypeORM 0.3 con `SnakeNamingStrategy` |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (`@nestjs/passport` + `passport-jwt`) con RBAC |
| Documentación | Swagger / OpenAPI |
| Colas | Bull + Redis |
| Mail | `@nestjs-modules/mailer` + Handlebars |
| Logging | Winston con rotación diaria |

La aplicación monta todo bajo el prefijo global `/api` y publica Swagger en la misma ruta
(`src/main.ts:56` y `src/main.ts:75`).

### Origen del código

Ruqq está construido sobre un boilerplate propio (`boiler-hm`) que aporta la infraestructura
transversal: autenticación, mailer, uploads, interceptores, entidad base y —sobre todo— un
**generador de módulos CRUD** (`npm run create-engine`). Eso explica que existan piezas genéricas
sin uso en el dominio hotelero (`src/common/uploads-handle/`, `src/common/deploy/`, `config.json`).

---

## 2. Modelo de datos

### 2.1 El cambio de modelo de septiembre 2025

El sistema tuvo **dos modelos de precios sucesivos**. Entender esto es indispensable para leer el
historial del repositorio.

**Modelo v2.3 (descartado).** Precios por rangos de fecha en dos capas:

```
base_rate_period      (room_type_id, start_date, end_date, price)
  + price_rules       (overrides por día de la semana, %, monto fijo, prioridad)
  + occupancy_rate_modifiers
  + restrictions
```

Requería lógica de *split* y consolidación: al insertar un rango que solapaba otro había que
partir, recalcular y volver a unir los períodos contiguos con el mismo precio. Esa lógica llegó a
ocupar más de 900 líneas entre `BaseRatePeriodService` y `PriceRulesService`.

**Modelo actual — calendario diario (estándar OTA).** Un registro por día:

```
daily_room_rates (room_type_id, rate_plan_id, date, base_rate, ...)
```

El commit que ejecuta el cambio es explícito: *"REFACTOR TOTAL. Tiramos todo a la mierda y vamos
por el modelo date/room_type/price"* (2025-09-08). Se eliminaron por completo los módulos
`base-rate-period`, `price-rules` y `occupancy-rate-modifiers`, y se reescribieron las migraciones
desde cero.

**Por qué el cambio es correcto.** Es el modelo que usan Booking.com, Airbnb y Expedia, y el que
esperan los channel managers. La consulta de cotización pasa de un algoritmo de resolución de capas
a un `WHERE date BETWEEN ? AND ?`. El costo es volumen de filas —365 filas por año, por tipo de
habitación, por rate plan— que PostgreSQL absorbe sin problema con los índices correctos.

### 2.2 Tablas

Fuente de verdad: `src/engine/migrations/`. Todas las entidades extienden `EntityBase`
(`src/common/entities/base.entity.ts`), que aporta `id` (UUID), `uid` (usuario que creó),
`created_at`, `updated_at` y `deleted_at` (soft delete).

#### `room_type` — inventario físico

| Campo | Tipo | Notas |
|---|---|---|
| `name` | varchar(255) | |
| `code` | varchar(50) | único — `LUX`, `PRE`, `SUP`, `EST`, `SUI` |
| `total_inventory` | int | cantidad de unidades de este tipo |
| `base_capacity` | int | ocupación incluida en la tarifa base |
| `max_capacity` | int | tope de personas |

#### `rate_plans` — planes tarifarios

Contenedor comercial de precios, modelado sobre la estructura `OTA_HotelRatePlanNotif` de
Booking.com (`src/resources/rate-plan/entities/rate-plan.entity.ts`).

| Campo | Tipo | Notas |
|---|---|---|
| `name` / `code` | varchar | `code` único: `BAR`, `NRF`, `ADV7`, `BB`… |
| `is_refundable` | boolean | |
| `advance_purchase_days` | int | anticipación mínima requerida |
| `included_services` | varchar(100) | `breakfast`, `dinner`, `spa_access`… |
| `parent_rate_plan_id` | uuid | autorreferencia para planes derivados |
| `parent_adjustment_percent` | decimal(5,2) | ajuste respecto del plan padre |
| `default_min_stay` / `default_max_stay` | int | |
| `cancellation_deadline_hours` | int | |
| `cancellation_penalty_type` | varchar(20) | `PERCENTAGE`, `FIXED_AMOUNT`, `FIRST_NIGHT`, `FULL_STAY` |
| `cancellation_penalty_value` | decimal(10,2) | |
| `is_active` / `display_order` | boolean / int | |
| `booking_engine_code` | varchar(50) | integración con channel managers |

> **No implementado.** `parent_rate_plan_id` y `parent_adjustment_percent` están en la tabla y en la
> entidad, pero **ningún servicio deriva precios a partir del plan padre**. Hoy cada plan necesita
> sus propias filas en `daily_room_rates`. Ver [ESTADO.md](ESTADO.md) §9.

#### `daily_room_rates` — entidad central

Un registro por combinación **(tipo de habitación, plan tarifario, día)**.

| Campo | Tipo | Notas |
|---|---|---|
| `room_type_id` / `rate_plan_id` / `date` | uuid / uuid / date | índice único compuesto |
| `base_rate` | decimal(10,2) | precio de la noche para la capacidad base |
| `single_occupancy_rate` | decimal(10,2) | precio para 1 persona |
| `extra_person_rate` | decimal(10,2) | adicional por persona extra |
| `available_rooms` | int | inventario disponible ese día |
| `is_active` | boolean | día vendible |
| `min_stay` / `max_stay` | int | estadía mínima / máxima para check-in ese día |
| `closed_to_arrival` / `closed_to_departure` | boolean | CTA / CTD |
| `last_updated_by` | uuid | |
| `pricing_source` | varchar(50) | `manual`, `channel_manager`, `dynamic_pricing`, `api_update` |

Índices: `(room_type_id, rate_plan_id, date)` único, `(date, is_active)`,
`(room_type_id, date, available_rooms)`, `(rate_plan_id)`.

> **Diseñado pero sin consumir.** `single_occupancy_rate`, `extra_person_rate`, `available_rooms`,
> `min_stay`, `max_stay`, `closed_to_arrival` y `closed_to_departure` se escriben desde el CRUD de
> `daily-room-rates`, pero el motor de cotización que atiende `/api/quotes/calculate` **no los lee**.
> Ver [ESTADO.md](ESTADO.md) §4.

#### `restrictions` — tabla remanente

Sobrevive del modelo v2.3, con su módulo, su servicio de ~500 líneas y su lógica de *split*
(`src/resources/restrictions/`). Duplica conceptualmente las columnas `min_stay`, `max_stay`,
`closed_to_arrival` y `closed_to_departure` que hoy viven dentro de `daily_room_rates`. El comentario
de cabecera de `DailyRoomRate` afirma que la reemplaza "completamente", pero la tabla y el módulo
siguen activos en `app.module.ts`.

#### Plantillas de presupuesto

```
quote_template ──< quote_template_block >── content_block
```

| Tabla | Rol |
|---|---|
| `quote_template` | plantilla con nombre e indicador `is_default` |
| `content_block` | bloque de texto tipado: `GREETING`, `SERVICES`, `TERMS`, `CANCELLATION_POLICY`, `FOOTER`, `GENERAL_INFO` |
| `quote_template_block` | orden de los bloques dentro de la plantilla (`sort_order`) |

Los bloques admiten variables `{{nombre}}` que el motor de presupuestos reemplaza en tiempo de
generación.

#### `users`

Autenticación con `email`/`username` únicos, `password_hash` (bcrypt) y `roles` como array de texto.

### 2.3 Sin tabla de cotizaciones

La tabla `quotes` fue eliminada en el refactor. Es una decisión deliberada y está documentada en el
controller: *"quotes no necesita persistencia tradicional"*
(`src/resources/quotes/controllers/quotes.controller.ts`). Las cotizaciones se calculan al vuelo.

La contrapartida es que **no queda registro de qué se cotizó**: no hay histórico, ni analítica de
conversión, ni forma de reconstruir el presupuesto que recibió un huésped si las tarifas cambian
después. Para un prototipo es aceptable; antes de producción hay que decidirlo explícitamente.

---

## 3. Multi-tenancy

Cada hotel es un **schema de PostgreSQL** dentro de la misma base.

```
Base de datos
├── public              ← desarrollo / demo
├── tenant_cliente1     ← hotel real 1
└── tenant_clienteN     ← hotel real N
```

### 3.1 Flujo de una request

1. **`TenantMiddleware`** (`src/common/middleware/tenant.middleware.ts`) lee el header
   `X-Tenant-ID`, valida el formato y resuelve el schema. Sin header, cae al tenant por defecto
   (`public`).
2. Guarda el contexto llamando a `tenantService.setCurrentTenant(...)`.
3. Los **tenant providers** de cada módulo (`*-tenant.providers.ts`) envuelven el repositorio de
   TypeORM en un `Proxy` de JavaScript que intercepta `find`, `findOne`, `save`, `create`,
   `update`, `delete` y `createQueryBuilder`.
4. En cada llamada interceptada, el proxy consulta el tenant activo. Si el schema es `public`,
   delega directo. Si no, abre una transacción, ejecuta `SET search_path TO "<schema>", public`,
   corre la operación y restaura el `search_path`.

El resultado es que los servicios de dominio no saben nada de tenants: la conmutación es
transparente.

### 3.2 Infraestructura de tenants

La migración `1756996231172-CreateMultiTenantSystem` instala cuatro funciones PL/pgSQL:

| Función | Rol |
|---|---|
| `clone_schema_structure(origen, destino)` | replica la estructura de tablas en un schema nuevo |
| `create_tenant_schema(nombre)` | alta de tenant |
| `list_tenants()` | listado |
| `delete_tenant_schema(nombre)` | baja |

Se complementan con `database/setup-multitenant.sql` y los scripts
`scripts/setup-multitenant-system.ts` y `scripts/setup-complete.ts`. El directorio `nginx/` incluye
una configuración de ejemplo que inyecta el header `X-Tenant-ID` según el subdominio.

### 3.3 Dos defectos que hay que conocer antes de tocar esto

> **Estado de tenant compartido entre requests.** `TenantService` es un provider **singleton** que
> guarda el tenant activo en un campo mutable de instancia (`private currentTenant`,
> `src/common/services/tenant.service.ts:15`). No hay `Scope.REQUEST` ni `AsyncLocalStorage` en
> ninguna parte del proyecto. Con dos requests concurrentes de tenants distintos, la segunda pisa el
> contexto de la primera mientras esta espera su consulta. **Es una fuga de datos entre hoteles.**
> Detalle y solución en [ESTADO.md](ESTADO.md) §1.

> **Lista de tenants hardcodeada.** Los tenants válidos son un `Set` literal en el código
> (`src/common/services/tenant.service.ts:18`). Dar de alta un hotel exige editar el fuente y
> redesplegar. El propio comentario lo reconoce: *"en producción esto vendría de BD"*.

---

## 4. Motor de cotización

### 4.1 Algoritmo

`QuoteEngineService.calculateQuote()` (`src/resources/quotes/services/quote-engine.service.ts`):

1. Valida el rango de fechas con `DateUtils.validateDateRange()` — máximo 365 noches, mínimo 1, no
   admite fechas pasadas.
2. Trae todos los `room_type` (ya filtrados por tenant vía proxy).
3. Para cada tipo de habitación:
   - Descarta si `pax > max_capacity` → rechazo `CAPACITY_EXCEEDED`.
   - Consulta las tarifas diarias del rango con un `INNER JOIN` a `rate_plans`, filtrando
     `is_active` en ambas tablas y ordenando por `display_order`.
   - Agrupa las filas por plan tarifario.
   - **Descarta todo plan que no cubra las noches completas** (`rates.length !== nightsNeeded`).
     Si falta una sola noche, ese plan no se ofrece.
   - Suma `base_rate` noche a noche y arma un segmento por noche.
4. Si ningún plan sobrevive → rechazo `NO_RATES_CONFIGURED`.
5. Si existe un plan con código `BAR`, calcula el diferencial porcentual de los demás planes contra
   él (`percentageDifferenceFromBase`).
6. Devuelve `{ available[], unavailable[] }` — las unidades que no califican vienen con código y
   mensaje de rechazo, no se ocultan.

La respuesta anida **múltiples planes tarifarios por tipo de habitación**: el huésped ve la misma
habitación con tarifa flexible, no reembolsable y con desayuno, cada una con su precio.

### 4.2 Lo que el motor no hace

El precio final es la **suma de `base_rate`**. Nada más. En concreto:

- `pax` sólo se usa para descartar por capacidad máxima; **no altera el precio**.
  `single_occupancy_rate` y `extra_person_rate` se ignoran.
- `min_stay`, `max_stay`, `closed_to_arrival` y `closed_to_departure` **no se evalúan**.
- `available_rooms` **no se verifica**: se cotizan habitaciones aunque el inventario sea 0.
- `advance_purchase_days` viaja en la respuesta como dato informativo, pero **no filtra** planes que
  el huésped ya no podría reservar.

Frente al motor v2.3 que reemplazó, esto es una **regresión funcional**: aquel sí aplicaba
modificadores de ocupación y restricciones de estadía. Es la deuda principal del proyecto.

### 4.3 Dos motores en paralelo

Conviven dos servicios de cotización sobre el mismo modelo de datos, y cada endpoint usa uno
distinto:

| Endpoint | Servicio | Rate plans | Restricciones |
|---|---|---|---|
| `POST /api/quotes/calculate` | `QuoteEngineService` (239 líneas) | sí | no |
| `POST /api/quotes/generate-formatted` | `QuotesService` (406 líneas) | no | parcial (`min_stay`, `closed_to_arrival`) |

Para la misma consulta, los dos pueden devolver disponibilidad y precios distintos. Hay que unificar
antes de seguir construyendo encima.

---

## 5. Generación de presupuestos

Dos caminos, con solapamiento:

- **`POST /api/quote-generator/generate`** → `QuoteGeneratorService`: acepta una plantilla
  específica, resuelve sus bloques ordenados y ensambla el texto.
- **`POST /api/quotes/generate-formatted`** → `QuotesService.generateFormattedQuote()`: usa la
  plantilla marcada como `is_default`.

Ambos comparten el mecanismo de **variables globales**: los `content_block` contienen marcadores
`{{variable}}` que se reemplazan con datos de la cotización (fechas, noches, pasajeros, precios) por
`replaceVariables()`. La salida es texto plano, listo para pegar en un mail o un WhatsApp.

---

## 6. Convenciones de código

Estas reglas son obligatorias. Están detalladas con ejemplos en el `CLAUDE.md` de la raíz.

### 6.1 Repositorios personalizados — nunca `@InjectRepository`

El proyecto **no usa** `@InjectRepository()` ni `TypeOrmModule.forFeature()`. Cada entidad tiene una
clase repositorio que extiende `Repository<T>` y se inyecta directamente con `@Inject(ClaseRepo)`,
alimentada por un provider que resuelve el `DataSource`. Es lo que permite insertar el proxy
tenant-aware sin tocar los servicios.

### 6.2 Fechas: "string in, string out"

Toda fecha de negocio se maneja como **string `YYYY-MM-DD`**, nunca como `Date`, y toda la
manipulación pasa por `DateUtils` (`src/common/utils/date.utils.ts`).

El motivo es concreto: Argentina es GMT-3, y `new Date('2025-03-02')` se interpreta como UTC
medianoche, que en hora local es el 1 de marzo. Un desfase de un día en un motor de precios significa
cobrar la tarifa equivocada. `DateUtils` construye las fechas al **mediodía** (`T12:00:00`) para que
ningún cambio de huso ni horario de verano corra el día.

`DateUtils` expone: `getTodayAsString`, `isValidDateString`, `compareDateStrings`, `calculateNights`,
`formatForDisplay`, `validateDateRange`, `addDays`, `getDateRange`.

### 6.3 Generación de módulos

Los módulos CRUD **no se escriben a mano**: se generan con `npm run create-engine <nombre-kebab>` y
después se les agregan los campos. El generador produce controller, service, entity, DTOs, providers
y repository con la estructura estándar. Un módulo nuevo requiere además su
`*-tenant.providers.ts` para funcionar en multi-tenant.

### 6.4 Estructura de un módulo

```
src/resources/<modulo>/
├── controllers/
├── services/
├── entities/
├── dto/
├── providers/          ← incluye <modulo>-tenant.providers.ts
├── repositories/
├── constants.ts
└── <modulo>.module.ts
```

---

## 7. Mapa del código

| Ruta | Contenido |
|---|---|
| `src/main.ts` | bootstrap, CORS, prefijo `/api`, Swagger |
| `src/app.module.ts` | registro de módulos |
| `src/common/` | entidad base, DTOs, interceptores, mailer, uploads, `DateUtils`, `TenantService`, `TenantMiddleware` |
| `src/config/` | `ormconfig.ts`, `tenant-typeorm.config.ts`, `mailer.config.ts` |
| `src/engine/auth/` | JWT, guards, decoradores, entidad `User` |
| `src/engine/database/` | seeders (`super-admin`, `tenant`, `initial-data`) |
| `src/engine/code-generator/` | generador de módulos CRUD |
| `src/engine/migrations/` | migraciones TypeORM |
| `src/resources/` | módulos de dominio |
| `scripts/` | setup multi-tenant y setup completo |
| `database/` | SQL de infraestructura multi-tenant |
| `nginx/` | configuración de ejemplo para routing por subdominio |
