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
| Multi-tenancy | Implementado, con aislamiento por request vía `AsyncLocalStorage` |
| Presupuestos formateados | Funciona (plantillas + variables) |
| Autenticación | JWT + RBAC en todos los endpoints de administración |
| Edición masiva de calendario | **Stub** que responde `success: true` sin escribir |
| Testing | Jest instalado; 78 tests sobre `DateUtils` y el aislamiento de tenant. El motor sigue sin cubrir |
| Documentación | Reescrita en esta pasada |

**Última actividad de desarrollo: 2025-10-20.** El proyecto lleva unos diez meses detenido.

---

## Bloqueantes para producción

Los dos problemas de seguridad (§1 y §2) **ya están corregidos**; se conserva el diagnóstico
porque explica el porqué de las reglas que quedaron. El resto sigue abierto.

### 1. ~~CRÍTICO — Fuga de datos entre tenants~~ ✅ RESUELTO

> **Corregido.** El contexto de tenant pasó a `AsyncLocalStorage`
> (`src/common/context/tenant-context.ts`). Se conserva el diagnóstico porque explica por qué el
> código quedó como quedó, y porque la regla que se desprende sigue vigente: **nunca cachear el
> tenant en un campo de instancia**.

**Dónde estaba:** `src/common/services/tenant.service.ts:15`

`TenantService` es un provider **singleton** de NestJS y guardaba el tenant activo en un campo
mutable de instancia:

```typescript
@Injectable()
export class TenantService implements ITenantService {
  private currentTenant: ITenantContext | null = null;   // ← estado compartido
```

`TenantMiddleware` lo escribía en cada request y los proxies de los repositorios lo leían al
ejecutar la consulta. No existía `Scope.REQUEST` ni `AsyncLocalStorage` en ninguna parte del
proyecto.

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

Había un agravante: el middleware limpiaba el contexto desde `res.on('finish')`. O sea que la
request que terminaba primero **borraba el contexto de las que seguían en vuelo**, y esas caían
silenciosamente al tenant por defecto.

**Cómo se resolvió.** `AsyncLocalStorage` de `node:async_hooks`, que propaga contexto a través de la
cadena de `await` sin acoplar los servicios. El middleware abre el scope y todo lo que ocurra dentro
lo hereda:

```typescript
// src/common/context/tenant-context.ts
export const tenantStorage = new AsyncLocalStorage<ITenantContext>()

// src/common/middleware/tenant.middleware.ts
this.tenantService.runWithTenant(tenantContext, () => next())

// src/common/services/tenant.service.ts
getCurrentTenant(): ITenantContext | null {
  return tenantStorage.getStore() ?? null
}
```

Se usa `run()` y no `enterWith()` de forma deliberada: acota el contexto al callback y lo libera
cuando la cadena termina, sin limpieza manual. Se eliminaron `setCurrentTenant()` y
`clearCurrentTenant()` de `ITenantService`, reemplazados por `runWithTenant()`.

La alternativa —marcar los providers como `Scope.REQUEST`— también resolvía el problema, pero
propaga el scope a todo el árbol de dependencias y degrada el rendimiento.

Los repositorios tenant-aware no necesitaron cambios: ya leían el tenant vía `getActiveTenant()` en
el momento de ejecutar la consulta, que es exactamente lo que hace falta para que `AsyncLocalStorage`
resuelva bien.

---

### 2. ~~CRÍTICO — El CRUD de precios está sin autenticar~~ ✅ RESUELTO

> **Corregido.** Los siete endpoints exigen JWT con rol `SUPER_ADMIN`, igual que el resto de la
> administración. Se reactivaron además los dos guards comentados de `rate-plan` y se eliminó el uso
> de usuarios mock.

**Dónde estaba:** `src/resources/daily-room-rates/controllers/daily-room-rates.controller.ts`

El controller de tarifas diarias **no tenía un solo `@UseGuards` ni `@RoleProtected`**. Sus siete
endpoints eran públicos:

| Endpoint | Qué permite a un anónimo |
|---|---|
| `POST /api/daily-room-rates/rates/bulk` | reescribir los precios de un rango completo de fechas |
| `POST /api/daily-room-rates/rates/single` | fijar el precio de un día |
| `PUT /api/daily-room-rates/rates/:roomTypeId/:date/availability` | alterar el inventario disponible |
| `POST /api/daily-room-rates/rates/:roomTypeId/fill-missing` | generar tarifas masivamente |
| `GET /api/daily-room-rates/rates/period` y `/stats` | leer toda la estructura de precios del hotel |

Cualquiera con la URL podía poner el hotel entero a $1 la noche, o leer la política de precios de la
competencia.

**Cómo se resolvió.** El mismo par de decoradores que usan los demás controllers, aplicado a cada
handler:

```typescript
@RoleProtected(ValidRoles.SUPER_ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
```

Van **por handler y no a nivel de clase** por una razón concreta: `UserRoleGuard` lee el metadato con
`this.reflector.get(META_ROLES, context.getHandler())`, sólo del handler. Un `@RoleProtected` puesto
en la clase quedaría invisible para el guard, que al no encontrar roles hace `return true` — o sea,
dejaría pasar a cualquier usuario autenticado. Si algún día se refactoriza a `getAllAndOverride`, se
podrá subir a nivel de clase; hasta entonces, no.

**Dos arreglos que vinieron con este:**

- `rate-plan.controller.ts`: se reactivaron los guards de `GET /` y `POST /`, comentados hacía diez
  meses con la nota *"TEMPORAL: Comentado para testing"*.
- Se eliminaron los usuarios mock. Los tres handlers de escritura de `daily-room-rates` tomaban el
  `userId` **del body** (`@Body('userId') userId: string = 'temp-user-id'`) y `rate-plan` usaba
  `'test-user-id'` fijo. Ahora sale del token vía `@GetUser()`. Además de dejar basura en la
  auditoría, aceptar el `uid` desde el body permitía que el cliente firmara sus cambios con la
  identidad de otro.

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

### 6. Alto — Testing: infraestructura lista, cobertura mínima

**Antes no había nada.** `package.json` no declaraba script `test`, ni `jest`, ni
`@nestjs/testing`; el único archivo, `test/app.e2e-spec.ts`, era el scaffold de NestJS y no podía
ejecutarse. Los commits que mencionaban "se implementan pruebas" se referían a colecciones de curls
manuales.

**Hecho:**

- `jest`, `ts-jest`, `@types/jest` y `@nestjs/testing` instalados, con `jest.config.js` y los scripts
  `test`, `test:watch`, `test:cov` y `test:e2e`.
- `src/common/services/tenant.service.spec.ts` — 19 tests. El bloque de concurrencia reproduce la
  condición de carrera de §1: se verificó que **falla contra la implementación anterior**, así que
  detecta la regresión si alguien vuelve a introducir estado compartido.
- `src/common/utils/date.utils.spec.ts` — 59 tests sobre bordes de mes y de año, años bisiestos y
  estabilidad de zona horaria. La suite pasa idéntica de UTC-11 a UTC+14.

**Falta lo más importante: el motor de cotización sigue sin un solo test.** Ahí está la aritmética
de dinero. No conviene escribirlos todavía: hay dos motores divergentes (§5) y el que atiende
`/calculate` está incompleto (§4). Escribir tests ahora sería fijar un comportamiento que hay que
cambiar. El orden correcto es unificar, completar y recién entonces cubrir.

Los tests unitarios conviven con el fuente (`*.spec.ts` al lado del archivo que prueban);
`tsconfig.build.json` los excluye del build.

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

### 13. El lint no corre — configuración de ESLint obsoleta

**Verificado ejecutándolo:** `npm run lint` falla siempre, con este mensaje:

```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js.
```

El proyecto usa **ESLint 9**, que exige *flat config*. En la raíz coexisten `.eslintrc.js` y
`.eslintrc.json`, los dos en el formato viejo, los dos ignorados. No es que el lint esté mal
configurado: **no se ejecuta nunca**, y no lo hace desde que se subió ESLint a la versión 9.

Hay que migrar a un único `eslint.config.js`. Hasta entonces, ninguna regla de estilo o de calidad
se está aplicando, lo que explica cosas como los imports sin usar y los `any` sueltos.

### 14. `package-lock.json` está en el `.gitignore`

`.gitignore:47` excluye el lockfile. Con `^` en todas las dependencias, cada `npm install` resuelve
un árbol distinto: dos desarrolladores, o el entorno de desarrollo y el de producción, pueden
terminar con versiones diferentes de la misma librería sin que nadie lo note. Es además un agujero de
cadena de suministro — no hay integridad verificable de lo que se instala.

El lockfile va commiteado. Es la práctica estándar y la razón por la que npm lo genera.

Nota: el `npm install` de esta pasada reportó **41 vulnerabilidades (4 moderadas, 37 altas)**. Ese
número no se puede ni reproducir ni seguir en el tiempo sin lockfile.

### 15. `rate_plans` usa `varchar` donde el resto del sistema usa `uuid`

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

### 16. Migraciones: el orden depende del reseteo

`1756996231172-CreateMultiTenantSystem` (multi-tenant) corre **antes** que
`1757360687036-inicial` (tablas de dominio), porque las migraciones del modelo v2.3 se borraron y se
regeneró la inicial con timestamp posterior. Funciona —las funciones PL/pgSQL no dependen de las
tablas— pero es frágil y no está documentado en el propio archivo.

Consecuencia práctica: **no hay ruta de upgrade desde una base con el modelo viejo**. Cualquier
entorno anterior a septiembre 2025 hay que recrearlo desde cero.

### 17. `console.log` en rutas de producción

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

~~1. Proteger el CRUD de `daily-room-rates` (§2).~~ ✅ hecho
~~2. `AsyncLocalStorage` para el contexto de tenant (§1).~~ ✅ hecho

~~3. Instalar Jest y cubrir `DateUtils` y el aislamiento de tenant (§6).~~ ✅ hecho — 78 tests

4. **Migrar ESLint a flat config** (§13). Hoy el lint no corre y ninguna regla se aplica.
5. **Commitear el `package-lock.json`** (§14). Una línea del `.gitignore`.
6. **Unificar los dos motores en uno** (§5), tomando la cobertura de rate plans de uno y la de
   restricciones del otro.
7. **Completar el motor unificado** con ocupación, inventario y restricciones (§4), y recién
   entonces cubrirlo con tests: es donde vive la aritmética de dinero.
8. **Resolver `bulk-edit`** (§3): implementarlo o devolver `501` mientras tanto, pero dejar de
   responder éxito en falso.
9. **Eliminar el módulo `restrictions`** (§8) una vez que el motor lea todo de `daily_room_rates`.
10. **Tenants desde base de datos** (§7) y proteger o eliminar los endpoints de debug (§10).
11. **Rate plans derivados** (§9), la primera funcionalidad nueva con valor comercial directo.
