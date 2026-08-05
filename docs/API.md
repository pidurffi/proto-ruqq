# Referencia de API

Todos los endpoints cuelgan del prefijo global **`/api`**. Swagger interactivo en
`http://localhost:<PORT>/api`.

Los ejemplos usan `http://localhost:3001`, que es el `PORT` de `.env.example`.

---

## Convenciones

### Fechas

Siempre **`YYYY-MM-DD`**, sin hora ni zona horaria. El `check-out` es exclusivo: del 10 al 12 son
**dos** noches, la del 10 y la del 11.

### Multi-tenant

El header `X-Tenant-ID` selecciona el schema de PostgreSQL. Sin header, la request va al schema
`public` (datos de desarrollo).

```bash
curl http://localhost:3001/api/room-type \
  -H "X-Tenant-ID: tenant_cliente1"
```

El contexto queda aislado por request mediante `AsyncLocalStorage`, así que las consultas
concurrentes de distintos hoteles no se interfieren.

### Autenticación

JWT en `Authorization: Bearer <token>`. Los endpoints de administración exigen rol `SUPER_ADMIN`.

### Estado de los endpoints

En las tablas que siguen:

| Marca | Significado |
|---|---|
| ✅ | implementado y verificado contra el fuente |
| ⚠️ | implementado con limitaciones documentadas |
| ❌ | **stub**: responde, pero no hace lo que dice |
| 🔒 | requiere JWT con rol `SUPER_ADMIN` |

---

## Autenticación

`POST /api/auth/*` — sin guard salvo donde se indique.

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| POST | `/api/auth/login` | devuelve el JWT | ✅ |
| POST | `/api/auth/register` | alta de usuario | ✅ |
| GET | `/api/auth/checkAuth` | renueva/valida el token | ✅ |
| GET | `/api/auth/all` | listado de usuarios | ✅ |
| PATCH | `/api/auth/:id` | actualiza un usuario | ✅ |
| POST | `/api/auth/promote` | cambia el rol de un usuario | ✅ |

Roles disponibles: `SUPER_ADMIN`, `ADMIN`, `USER`, `GUEST`
(`src/engine/auth/interfaces/valid-roles.ts`).

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ruqq.com","password":"<password>"}'
```

---

## Cotización (público)

### `POST /api/quotes/calculate` ✅

El endpoint principal. Devuelve, por tipo de habitación, todos los planes tarifarios que cubren la
estadía completa.

**Request**

| Campo | Tipo | Reglas |
|---|---|---|
| `pax` | int | 1 a 20 |
| `checkInDate` | `YYYY-MM-DD` | no puede ser pasada |
| `checkOutDate` | `YYYY-MM-DD` | posterior a `checkInDate`, máximo 365 noches |
| `templateId` | uuid | opcional |

```bash
curl -X POST http://localhost:3001/api/quotes/calculate \
  -H "Content-Type: application/json" \
  -d '{"pax":2,"checkInDate":"2026-10-10","checkOutDate":"2026-10-13"}'
```

**Response**

```jsonc
{
  "pax": 2,
  "checkInDate": "2026-10-10",
  "checkOutDate": "2026-10-13",
  "available": [
    {
      "roomType": {
        "id": "…", "name": "Suite", "code": "SUI",
        "baseCapacity": 2, "maxCapacity": 4
      },
      "ratePlans": [
        {
          "ratePlan": {
            "id": "…", "name": "Best Available Rate", "code": "BAR",
            "isRefundable": true,
            "includedServices": null,
            "advancePurchaseDays": null,
            "cancellationDeadlineHours": 48,
            "cancellationPenaltyType": "FIRST_NIGHT",
            "cancellationPenaltyValue": null
          },
          "totalNights": 3,
          "segments": [
            { "startDate": "2026-10-10", "endDate": "2026-10-10",
              "pricePerNight": 150.00, "nights": 1, "subtotal": 150.00 }
            // … una entrada por noche
          ],
          "totalPrice": 450.00,
          "averageNightlyRate": 150.00
        },
        {
          "ratePlan": { "code": "NRF", "isRefundable": false, "…": "…" },
          "totalPrice": 405.00,
          "percentageDifferenceFromBase": -10.00
        }
      ]
    }
  ],
  "unavailable": [
    {
      "roomType": { "id": "…", "name": "Estudio Loft", "code": "EST" },
      "reasonCode": "CAPACITY_EXCEEDED",
      "reasonMessage": "Capacidad excedida: 2 huéspedes > 1 máximo"
    }
  ]
}
```

`percentageDifferenceFromBase` sólo aparece si existe un plan con código `BAR`, y se calcula contra
él.

**Códigos de rechazo** (`RejectionReasonCode`):

| Código | Motivo |
|---|---|
| `CAPACITY_EXCEEDED` | `pax` supera `max_capacity` |
| `NO_RATES_CONFIGURED` | ningún plan tarifario cubre todas las noches del rango |

> **Limitaciones del cálculo.** El precio es la suma de `base_rate`. No se aplican
> `single_occupancy_rate` ni `extra_person_rate` (o sea: `pax` no cambia el precio), no se verifica
> `available_rooms`, y no se evalúan `min_stay`, `max_stay`, `closed_to_arrival` ni
> `closed_to_departure`. Detalle en [ESTADO.md](ESTADO.md) §4.

### `POST /api/quotes/generate-formatted` ⚠️

Devuelve el presupuesto ya redactado, usando la plantilla marcada como `is_default`.

```bash
curl -X POST http://localhost:3001/api/quotes/generate-formatted \
  -H "Content-Type: application/json" \
  -d '{"pax":2,"checkInDate":"2026-10-10","checkOutDate":"2026-10-13"}'
```

```json
{ "formattedQuote": "Estimado huésped,\n\nLe enviamos la cotización…" }
```

> **Atención.** Este endpoint usa `QuotesService`, un motor **distinto** del que atiende
> `/calculate`: contempla restricciones pero no planes tarifarios. Para la misma consulta puede
> devolver otro precio. Ver [ESTADO.md](ESTADO.md) §5.

### `POST /api/quote-generator/generate` ✅

Igual que el anterior, pero con `templateId` obligatorio. Requiere JWT.

| Campo | Tipo | |
|---|---|---|
| `pax` | int | 1 a 20 |
| `checkInDate` / `checkOutDate` | `YYYY-MM-DD` | |
| `templateId` | uuid | **obligatorio** |

---

## Tarifas diarias 🔒

Todos los endpoints de esta sección exigen JWT con rol `SUPER_ADMIN`.

Base: `/api/daily-room-rates`

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| GET | `/rates/period` | tarifas de un rango | 🔒 ✅ |
| POST | `/rates/bulk` | carga masiva sobre un rango de fechas | 🔒 ✅ |
| POST | `/rates/single` | tarifa de un día puntual | 🔒 ✅ |
| PUT | `/rates/:roomTypeId/:date/availability` | actualiza el inventario de un día | 🔒 ✅ |
| GET | `/rates/:roomTypeId/missing-dates` | días sin tarifa cargada | 🔒 ✅ |
| POST | `/rates/:roomTypeId/fill-missing` | completa los días faltantes | 🔒 ✅ |
| GET | `/rates/:roomTypeId/stats` | estadísticas de precios | 🔒 ✅ |

### `POST /rates/bulk`

| Campo | Tipo | Reglas |
|---|---|---|
| `roomTypeId` | uuid | |
| `startDate` / `endDate` | `YYYY-MM-DD` | |
| `baseRate` | decimal | 0 a 50000, 2 decimales |
| `availableRooms` | int | 0 a 1000 |
| `singleOccupancyRate` | decimal | opcional |
| `extraPersonRate` | decimal | opcional |
| `minStay` / `maxStay` | int | opcional |
| `closedToArrival` / `closedToDeparture` | boolean | por defecto `false` |
| `pricingSource` | enum | por defecto `BULK_IMPORT` |
| `dayOfWeekFilter` | int[] | opcional — **0=domingo … 6=sábado** |

No lleva `ratePlanId`: si se omite, el servicio resuelve el plan por defecto
(`getDefaultRatePlanId()`). Tampoco lleva `userId`: el `uid` de auditoría sale del token.

```bash
# Cargar $150 la noche para todo julio, sólo viernes y sábados
curl -X POST http://localhost:3001/api/daily-room-rates/rates/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": "<uuid>",
    "startDate": "2026-07-01",
    "endDate": "2026-07-31",
    "baseRate": 150.00,
    "availableRooms": 5,
    "dayOfWeekFilter": [5, 6]
  }'
```

---

## Administración

Todos exigen JWT con rol `SUPER_ADMIN`, salvo donde se indique.

### Tipos de habitación — `/api/room-type` ✅

CRUD estándar: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.

| Campo | Notas |
|---|---|
| `name` | |
| `code` | único |
| `totalInventory` | |
| `baseCapacity` / `maxCapacity` | |

### Planes tarifarios — `/api/rate-plan` ✅

Mismo CRUD estándar, con JWT y rol `SUPER_ADMIN` en las cinco rutas.

Campos relevantes: `name`, `code` (único), `description`, `isRefundable`, `advancePurchaseDays`,
`includedServices`, `defaultMinStay`, `defaultMaxStay`, `cancellationDeadlineHours`,
`cancellationPenaltyType`, `cancellationPenaltyValue`, `isActive`, `displayOrder`,
`bookingEngineCode`, `parentRatePlanId`, `parentAdjustmentPercent`.

> `parentRatePlanId` y `parentAdjustmentPercent` se guardan pero **no producen ningún efecto**: la
> derivación automática de precios no está implementada. Ver [ESTADO.md](ESTADO.md) §9.

### Matriz de precios — `POST /api/admin/price-matrix/generate` ✅

Devuelve la grilla completa de precios del período para todos los tipos de habitación y todos los
planes tarifarios activos. Es la vista que consume el panel de administración.

```bash
curl -X POST http://localhost:3001/api/admin/price-matrix/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-01-01","endDate":"2026-01-31"}'
```

### Calendario — `/api/admin/calendar` ❌

| Método | Ruta | Estado |
|---|---|---|
| POST | `/bulk-edit` | ❌ **stub** |
| POST | `/bulk-edit/preview` | ❌ **stub** |

**No hacen nada.** `bulk-edit` devuelve `{ success: true, message: "…pendiente implementación
completa" }` sin escribir en la base; `preview` devuelve siempre `impactedNights: 0` y
`estimatedChanges: []`. Ver [ESTADO.md](ESTADO.md) §3.

Para editar tarifas en lote hay que usar `POST /api/daily-room-rates/rates/bulk`.

El DTO declarado (`CalendarBulkEditDto`) espera `roomTypeIds[]`, `startDate`, `endDate`,
`daysOfWeek[]` (**ISO 8601: 1=lunes … 7=domingo**, distinto de `dayOfWeekFilter`), `adjustmentType`
y `adjustmentValue`.

### Restricciones — `/api/restrictions` ⚠️

CRUD estándar con lógica de *split* y consolidación heredada del modelo v2.3.

> **Módulo remanente.** Sus columnas viven hoy dentro de `daily_room_rates`. El motor de cotización
> no lee esta tabla. Ver [ESTADO.md](ESTADO.md) §8.

### Plantillas de presupuesto ✅

CRUD estándar en los tres:

| Recurso | Ruta |
|---|---|
| Plantillas | `/api/quote-template` |
| Bloques de contenido | `/api/content-block` |
| Vínculo plantilla-bloque | `/api/quote-template-block` |

`content_block.content` admite variables `{{nombre}}`, que se reemplazan al generar el presupuesto.
Tipos de bloque: `GREETING`, `SERVICES`, `TERMS`, `CANCELLATION_POLICY`, `FOOTER`, `GENERAL_INFO`.

---

## Sistema y diagnóstico 🔓

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tenant-info` | tenant activo de la request |
| GET | `/api/tenant-debug` | información completa del sistema multi-tenant |
| GET | `/api/test-tenant-repo` | prueba de acceso al repositorio del tenant |

**Sin autenticación.** Exponen la estructura interna de tenants. Hay que protegerlos o eliminarlos
antes de producción ([ESTADO.md](ESTADO.md) §10).

---

## Utilidades heredadas del boilerplate

Existen y funcionan, pero no forman parte del dominio hotelero:

| Ruta | Descripción |
|---|---|
| `/api/mailer/send`, `/send-immediate`, `/send-template` | envío de mails |
| `/api/mailer/metrics`, `/metrics/reset`, `/health` | métricas del mailer |
| `/api/deploy/build-frontend` | dispara el build del frontend |

---

## Verificar el aislamiento entre tenants

```bash
# Crear en un tenant específico
curl -X POST http://localhost:3001/api/room-type \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant_cliente1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Suite Test","code":"TST","totalInventory":1,"baseCapacity":2,"maxCapacity":4}'

# NO debe aparecer en el schema public
curl http://localhost:3001/api/room-type -H "Authorization: Bearer <token>"

# SÍ debe aparecer en su tenant
curl http://localhost:3001/api/room-type \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: tenant_cliente1"
```

Esta verificación también vale en paralelo: el contexto de tenant está aislado por request.
