# Estado del proyecto y deuda técnica

Auditoría del código a **2026-08-05**. Cada afirmación está verificada contra el fuente y referenciada.

---

## Resumen

Ruqq es un **prototipo funcional**, no un producto. El núcleo de precios y presupuestos está
implementado y es coherente; alrededor hay deuda que impide ponerlo en producción.

| Dimensión | Estado |
|---|---|
| Modelo de datos | Sólido. Calendario diario estándar OTA, bien indexado |
| Motor de cotización | Funciona, pero incompleto y **duplicado** |
| Multi-tenancy | Implementado, con un **defecto crítico de concurrencia** |
| Presupuestos formateados | Funciona (plantillas + variables) |
| Autenticación | JWT + RBAC implementados, pero **el CRUD de precios quedó sin proteger** |
| Edición masiva de calendario | **Stub** que responde `success: true` sin escribir |
| Testing | **Inexistente** — no hay framework instalado |
| Documentación | Reescrita en esta pasada |

**Última actividad de desarrollo: 2025-10-20.** El proyecto lleva unos diez meses detenido.

---

## Bloqueantes para producción

### 1. CRÍTICO — Fuga de datos entre tenants

**Dónde:** `src/common/services/tenant.service.ts:15`

`TenantService` es un provider **singleton** de NestJS que guarda el tenant activo en un campo
mutable de instancia:

```typescript
@Injectable()
export class TenantService implements ITenantService {
  private currentTenant: ITenantContext | null = null;   // ← estado compartido
```

`TenantMiddleware` lo escribe en cada request (`tenant.middleware.ts:70`) y los proxies de los
repositorios lo leen cuando ejecutan la consulta. No existe `Scope.REQUEST` ni `AsyncLocalStorage`
en ninguna parte del proyecto (verificado por búsqueda global).

**Cómo falla.** Node.js atiende requests concurrentes sobre el mismo event loop:

```
t0  Request A (tenant_hotelA) → setCurrentTenant(hotelA)
t1  Request A → await consulta a la base…
t2  Request B (tenant_hotelB) → setCurrentTenant(hotelB)   ← pisa el contexto de A
t3  Request A reanuda → el proxy lee currentTenant = hotelB
t4  Request A ejecuta SET search_path TO tenant_hotelB
```

El hotel A recibe datos del hotel B. Con un solo tenant activo el bug es invisible; aparece con
tráfico real, que es exactamente cuando más caro sale.

**Solución.** `AsyncLocalStorage` de `node:async_hooks`, que propaga contexto a través de la cadena
de `await` sin acoplar los servicios. El middleware abre el scope y todo lo que ocurra dentro lo
hereda:

```typescript
// tenant-context.ts
export const tenantStorage = new AsyncLocalStorage<ITenantContext>()

// tenant.middleware.ts
use(req, res, next) {
  const context = this.resolveTenant(req)
  tenantStorage.run(context, () => next())
}

// tenant.service.ts
getActiveTenant(): ITenantContext {
  return tenantStorage.getStore() ?? this.getDefaultTenant()
}
```

La alternativa —marcar los providers como `Scope.REQUEST`— también resuelve el problema, pero
propaga el scope a todo el árbol de dependencias y degrada el rendimiento. `AsyncLocalStorage` es la
solución correcta.

**Esto se arregla antes que cualquier otra cosa.** Todo lo demás de esta lista puede convivir con un
prototipo; esto no.

---

### 2. CRÍTICO — El CRUD de precios está sin autenticar

**Dónde:** `src/resources/daily-room-rates/controllers/daily-room-rates.controller.ts`

El controller de tarifas diarias **no tiene un solo `@UseGuards` ni `@RoleProtected`**. Sus siete
endpoints son públicos:

| Endpoint | Qué permite a un anónimo |
|---|---|
| `POST /api/daily-room-rates/rates/bulk` | reescribir los precios de un rango completo de fechas |
| `POST /api/daily-room-rates/rates/single` | fijar el precio de un día |
| `PUT /api/daily-room-rates/rates/:roomTypeId/:date/availability` | alterar el inventario disponible |
| `POST /api/daily-room-rates/rates/:roomTypeId/fill-missing` | generar tarifas masivamente |
| `GET /api/daily-room-rates/rates/period` y `/stats` | leer toda la estructura de precios del hotel |

Cualquiera con la URL puede poner el hotel entero a $1 la noche, o leer la política de precios de la
competencia. El resto de los módulos de administración (`room-type`, `rate-plan`, `restrictions`,
`content-block`, `quote-template`, `price-matrix`, `calendar`) sí exigen JWT con rol `SUPER_ADMIN`;
este quedó afuera.

Se arregla aplicando el mismo par de decoradores que usan los demás controllers:

```typescript
@RoleProtected(ValidRoles.SUPER_ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
```

**Relacionado:** en `rate-plan.controller.ts:59` y `:89` los guards de `GET /` y `POST /` están
comentados con la nota *"TEMPORAL: Comentado para testing"*. Lo temporal lleva diez meses.

---

### 3. Alto — `bulk-edit` del calendario responde `success: true` sin hacer nada

**Dónde:** `src/resources/daily-room-rates/services/daily-room-rates.service.ts:309`

`POST /api/admin/calendar/bulk-edit` está publicado, documentado en Swagger y protegido con guards,
pero termina en un stub:

```typescript
async bulkUpdateRates(bulkEditDto: any, uid: string): Promise<any> {
  // Por ahora retorna un stub - implementar según necesidades
  return {
    success: true,
    message: 'Bulk update para modelo OTA diario - pendiente implementación completa',
    affectedRoomTypes: bulkEditDto.roomTypeIds?.length || 0
  }
}
```

`previewBulkUpdate()` es igual: devuelve `impactedNights: 0` y `estimatedChanges: []` siempre.

Es peor que un endpoint no implementado: **responde éxito**. Un administrador que ajuste los precios
de todos los fines de semana del verano recibe `success: true`, un conteo de habitaciones afectadas
que parece real, y ningún cambio en la base. O se implementa, o se devuelve `501 Not Implemented`.

**Además, hay un choque de convenciones que va a morder cuando se implemente:**
`CalendarBulkEditDto.daysOfWeek` documenta **ISO 8601** (1=lunes … 7=domingo) y
`DailyRateBulkDto.dayOfWeekFilter` documenta **JavaScript** (0=domingo … 6=sábado). `CalendarService`
pasa el primer DTO al servicio que valida con el segundo criterio: el rango 1-7 contra un validador
que exige 0-6. Hay que unificar en una sola convención antes de escribir la implementación.

---

### 4. Alto — El motor de cotización ignora medio modelo de datos

**Dónde:** `src/resources/quotes/services/quote-engine.service.ts`

El precio final es la suma de `base_rate` noche a noche. Estos campos se escriben desde el CRUD de
`daily-room-rates`, están en la tabla y en la entidad, y el motor **no los lee**:

| Campo | Consecuencia de ignorarlo |
|---|---|
| `single_occupancy_rate` | una persona sola paga la tarifa de la capacidad base |
| `extra_person_rate` | el pasajero adicional no se cobra: `pax` sólo filtra por capacidad máxima |
| `available_rooms` | se cotizan habitaciones con inventario en 0 |
| `min_stay` / `max_stay` | se aceptan estadías que el hotel no permite |
| `closed_to_arrival` / `closed_to_departure` | se aceptan check-in y check-out en días cerrados |
| `advance_purchase_days` | se ofrecen planes que el huésped ya no puede reservar |

Es una **regresión funcional** respecto del motor v2.3 que se descartó: aquel sí aplicaba
modificadores de ocupación y restricciones. La migración al modelo diario fue correcta en el modelo
de datos, pero el motor nuevo se escribió como *fresh start* y quedó a mitad de camino.

---

### 5. Alto — Dos motores de cotización divergentes

**Dónde:** `src/resources/quotes/`

| Endpoint | Servicio | Rate plans | Restricciones |
|---|---|---|---|
| `POST /api/quotes/calculate` | `QuoteEngineService` | sí | no |
| `POST /api/quotes/generate-formatted` | `QuotesService` | no | parcial (`min_stay`, `closed_to_arrival`) |

Ambos están registrados en `quotes.module.ts` y el controller inyecta los dos. Para la misma
consulta pueden devolver **disponibilidad y precios distintos**: el presupuesto que se le manda al
huésped puede no coincidir con lo que devuelve la API de cotización.

`QuotesService` conserva la evaluación de restricciones que a `QuoteEngineService` le falta —o sea
que la funcionalidad existe, sólo está en el servicio equivocado. La unificación debería tomar la
cobertura de rate plans del primero y la de restricciones del segundo.

---

### 6. Alto — No hay testing

`package.json` **no declara script `test`**, ni `jest`, ni `@nestjs/testing`. El único archivo,
`test/app.e2e-spec.ts`, es el scaffold de NestJS y no puede ejecutarse. Los commits que mencionan
"se implementan pruebas" se refieren a colecciones de curls manuales.

El código sin cubrir incluye aritmética de dinero y de fechas con manejo explícito de huso horario:
es exactamente el tipo de lógica donde un error no lanza excepción, sólo cobra mal.

**Mínimo indispensable:** instalar `jest` + `@nestjs/testing` y cubrir `DateUtils` (borde de mes,
año bisiesto, cambio de horario), el cálculo de `QuoteEngineService` y el aislamiento multi-tenant.

---

## Deuda importante, no bloqueante

### 7. Lista de tenants hardcodeada

`src/common/services/tenant.service.ts:18` — los tenants válidos son un `Set` literal
(`tenant_cliente1`, `tenant_cliente2`, `tenant_hotel_abc`, `tenant_demo`…). Dar de alta un hotel
exige editar el fuente y redesplegar. El comentario del propio código lo admite: *"en producción
esto vendría de BD"*. Las funciones PL/pgSQL para crear y listar tenants ya existen; falta una tabla
de registro en el schema `public` y leer de ahí, con caché.

### 8. El módulo `restrictions` quedó huérfano

`src/resources/restrictions/` sigue activo en `app.module.ts` con un servicio de ~500 líneas y
lógica de *split* heredada del modelo v2.3. Sus columnas (`min_stay`, `max_stay`,
`closed_to_arrival`, `closed_to_departure`) están hoy **dentro de `daily_room_rates`**. El comentario
de cabecera de `DailyRoomRate` afirma que lo reemplaza "completamente", pero nadie lo eliminó.

Dos fuentes de verdad para la misma regla de negocio. Hay que borrar el módulo y la tabla, o
justificar por qué sobreviven.

### 9. Rate plans derivados: declarados, no implementados

`parent_rate_plan_id` y `parent_adjustment_percent` existen en la tabla, en la entidad y en la
autorreferencia TypeORM, pero **ningún servicio deriva precios del plan padre**. Hoy, para tener una
tarifa "No reembolsable = BAR − 10 %", hay que cargar sus 365 filas propias en `daily_room_rates` y
mantenerlas sincronizadas a mano.

Es la funcionalidad de mayor relación valor/esfuerzo del backlog: el modelo ya está.

### 10. Endpoints de depuración expuestos

`src/app.controller.ts` publica `GET /api/tenant-info`, `GET /api/test-tenant-repo` y
`GET /api/tenant-debug`. Exponen estructura interna de tenants sin autenticación aparente. Sirven
para diagnosticar, no para producción: hay que protegerlos con guard de rol o eliminarlos.

### 11. Configuración de entorno inconsistente

Hay **dos plantillas contradictorias** en la raíz. `.env.example` declara variables que el código no
lee (`DB_LOGGING`, `JWT_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`,
`MAIL_FROM`) y omite varias que sí usa (`SUPERADMIN_DEV_PASSWORD`, `PG_DB_RUN_MIGRATIONS`,
`ENVIRONMENT`, `HOST_API`, `CORS_WHITE_LIST`, `DISABLE_EMAIL_SENDING`). `.env.template` se acerca
más al código, pero tampoco está completo. Quien siga `.env.example` termina con el mailer sin
configurar y sin entender por qué.

**Parcialmente resuelto.** El listado correcto, verificado contra cada `process.env.*` y
`configService.get()` del fuente, quedó en [CONFIGURACION.md](CONFIGURACION.md). **Falta** reemplazar
`.env.example` con ese contenido y eliminar `.env.template` — son dos archivos que esta pasada no
pudo escribir por restricciones del entorno de trabajo.

### 12. `docker-compose.yml.template` con credenciales del boilerplate

El template sigue nombrando la base `boiler-00`, con usuario y contraseña del proyecto original, y
expone el puerto `5435`. No coincide con ningún `.env` razonable del proyecto. Además el volumen de
datos está comentado: **el contenedor pierde la base al recrearse**.

### 13. Configuración de ESLint duplicada y obsoleta

Coexisten `.eslintrc.js` y `.eslintrc.json` en la raíz. Además el proyecto usa **ESLint 9**, que
espera *flat config* (`eslint.config.js`); el formato `.eslintrc` está deprecado y sólo funciona por
compatibilidad. Hay que consolidar en un único `eslint.config.js`.

### 14. `rate_plans` usa `varchar` donde el resto del sistema usa `uuid`

**Dónde:** `src/engine/migrations/1757424167154-CreateRatePlansAndUpdateDailyRates.ts:10`

La migración que crea la tabla declara:

```sql
CREATE TABLE "rate_plans" (
  "id"  varchar PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  "uid" varchar NOT NULL DEFAULT uuid_generate_v4(),
  "parent_rate_plan_id" varchar,
  …
ALTER TABLE "daily_room_rates" ADD COLUMN "rate_plan_id" varchar;
```

Pero `EntityBase` define `@PrimaryGeneratedColumn('uuid')` y `@Column({ type: 'uuid' })`, y
`DailyRoomRate.ratePlanId` está declarado como `uuid`. **La migración y las entidades no coinciden**,
y `rate_plans` es la única tabla del esquema que se aparta de la convención — el resto se generó con
`uuid` nativo.

Tres consecuencias:

1. PostgreSQL no valida el formato: entra cualquier string como clave primaria.
2. Los `JOIN` entre `daily_room_rates.rate_plan_id` (varchar) y `rate_plans.id` (varchar) funcionan,
   pero comparan texto en lugar de los 16 bytes de un uuid nativo.
3. El primer `npm run db:migration:generate` va a intentar convertir estas columnas a `uuid`, porque
   TypeORM compara contra las entidades. Esa migración autogenerada hay que revisarla, no aplicarla a
   ciegas.

Se corrige con una migración de conversión (`ALTER TABLE … ALTER COLUMN … TYPE uuid USING …::uuid`),
tratando la FK antes y después.

### 15. Migraciones: el orden depende del reseteo

`1756996231172-CreateMultiTenantSystem` (multi-tenant) corre **antes** que
`1757360687036-inicial` (tablas de dominio), porque las migraciones del modelo v2.3 se borraron y se
regeneró la inicial con timestamp posterior. Funciona —las funciones PL/pgSQL no dependen de las
tablas— pero es frágil y no está documentado en el propio archivo.

Consecuencia práctica: **no hay ruta de upgrade desde una base con el modelo viejo**. Cualquier
entorno anterior a septiembre 2025 hay que recrearlo desde cero.

### 16. `console.log` en rutas de producción

`replaceVariables()` (`src/resources/quotes/services/quotes.service.ts:391`) y los tenant providers
loguean con `console.log` en cada operación de repositorio. El proyecto tiene Winston configurado
con rotación diaria: hay que usarlo, con nivel `debug`.

---

## Ya resuelto en esta pasada

- Ramas obsoletas consolidadas: `rate-plans` integrada a `dev`; `multi-tenant`,
  `refactor-price-rules`, `refactor-FINAL-modelo-dia-precio` y `tarifas-split` estaban contenidas en
  `rate-plans` y se eliminaron sin pérdida de trabajo.
- Documentación reescrita y verificada contra el código.
- Artefactos muertos eliminados: `test-quote.js` (usaba `axios`, que no figura en las dependencias),
  `01.png` (captura de 727 KB de la tabla `price_rules`, que ya no existe),
  `database-schema-nuevo.dbml` (sin `rate_plans` ni multi-tenant), `Ruqq-API.md`,
  `POSTMAN-CURLS-MOTOR-PRECIOS-V2.3.md` (documentaba endpoints del motor v2.3 ya borrado) y
  `MEJORAS_IMAGINADAS_API.md`.

### Pendiente de esta misma pasada

- Reemplazar `.env.example` por el contenido de [CONFIGURACION.md](CONFIGURACION.md) y eliminar
  `.env.template` (§11).

---

## Orden de trabajo sugerido

Los dos primeros puntos son de seguridad y se resuelven en horas. No hay razón para postergarlos.

1. **Proteger el CRUD de `daily-room-rates`** y descomentar los guards de `rate-plan` (§2). Son dos
   decoradores; hoy cualquiera puede reescribir los precios del hotel.
2. **`AsyncLocalStorage` para el contexto de tenant** (§1). Bloqueante absoluto: sin esto, no se
   pone un segundo hotel en el sistema.
3. **Instalar Jest y cubrir `DateUtils` y el motor** (§6). Sin red de seguridad no se toca el resto.
4. **Unificar los dos motores en uno** (§5), tomando la cobertura de rate plans de uno y la de
   restricciones del otro.
5. **Completar el motor unificado** con ocupación, inventario y restricciones (§4).
6. **Resolver `bulk-edit`** (§3): implementarlo o devolver `501` mientras tanto, pero dejar de
   responder éxito en falso.
7. **Eliminar el módulo `restrictions`** (§8) una vez que el motor lea todo de `daily_room_rates`.
8. **Tenants desde base de datos** (§7) y proteger o eliminar los endpoints de debug (§10).
9. **Rate plans derivados** (§9), la primera funcionalidad nueva con valor comercial directo.
