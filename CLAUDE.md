# CLAUDE.md

Convenciones obligatorias para trabajar en este repositorio. Son reglas de **cómo escribir código
acá**, no documentación de arquitectura.

| Para saber | Leer |
|---|---|
| Qué hace el sistema y cómo está armado | [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) |
| Qué está roto y qué falta | [docs/ESTADO.md](docs/ESTADO.md) |
| Endpoints y su estado real | [docs/API.md](docs/API.md) |
| Variables de entorno | [docs/CONFIGURACION.md](docs/CONFIGURACION.md) |

> **Antes de tocar cualquier cosa, leer [docs/ESTADO.md](docs/ESTADO.md).** Hay dos problemas de
> seguridad abiertos y varios endpoints que no hacen lo que su nombre dice. Trabajar sin esa
> información lleva a construir sobre supuestos falsos.

---

## Principios

- **SOLID** y **Domain-Driven Design**: entidades, servicios de dominio, repositorios.
- **Sin parches ni hardcodeos.** Si una restricción real obliga a un atajo, dejarlo explícito en un
  comentario y anotarlo en `docs/ESTADO.md`.
- **TypeScript estricto**, tipos explícitos. Evitar `any`: hoy aparece en firmas que deberían estar
  tipadas (`bulkUpdateRates(bulkEditDto: any)`), y es deuda, no un patrón a imitar.
- **`async`/`await`** de forma consistente.
- **Documentar lo que no es obvio**: el *porqué* de una decisión, no la paráfrasis del código.

---

## Regla 1 — Repositorios personalizados

El proyecto **no usa** `@InjectRepository()` ni `TypeOrmModule.forFeature()`. Cada entidad tiene una
clase repositorio que se inyecta directamente. Esto es lo que permite insertar el proxy tenant-aware
sin que los servicios se enteren.

### Correcto

```typescript
// Service
@Injectable()
export class SomeService {
  constructor(
    @Inject(SomeEntityRepository)          // ← la CLASE, no un token
    private readonly repository: SomeEntityRepository,
  ) {}
}

// Repository
@Injectable()
export class SomeEntityRepository extends Repository<SomeEntity> {
  constructor(
    @Inject(repositories.SOME_ENTITY_REPOSITORY)
    private readonly _: Repository<SomeEntity>,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(_.target, _.manager, _.queryRunner)
  }

  // Métodos de consulta específicos del dominio
}
```

### Prohibido

```typescript
@InjectRepository(SomeEntity)                    // ❌ nunca
imports: [TypeOrmModule.forFeature([Entity])]    // ❌ nunca
```

---

## Regla 2 — Todo módulo es tenant-aware

Cada módulo necesita su `*-tenant.providers.ts`. Sin él, las consultas ignoran el tenant y van
siempre al schema `public` — o sea, **un módulo nuevo sin su tenant provider filtra datos entre
hoteles**.

El provider envuelve el repositorio en un `Proxy` que intercepta los métodos de consulta y conmuta
el `search_path` según el tenant activo:

```typescript
// providers/some-entity-tenant.providers.ts
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(SomeEntity), {
    get(target, prop, receiver) {
      const interceptados = ['find', 'findOne', 'save', 'create', 'update', 'delete', 'createQueryBuilder']

      if (typeof (target as any)[prop] === 'function' && interceptados.includes(prop as string)) {
        return function (...args: any[]) {
          const { schema } = tenantService.getActiveTenant()

          if (schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }

          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${schema}", public`)
            const repo = manager.getRepository(SomeEntity)
            const result = await (repo as any)[prop].apply(repo, args)
            await manager.query(`SET search_path TO public`)
            return result
          })
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}

export const SomeEntityTenantProviders = [
  {
    provide: repositories.SOME_ENTITY_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) =>
      createTenantAwareRepository(dataSource, tenantService),
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]
```

Y el módulo los registra:

```typescript
@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...SomeEntityTenantProviders, SomeEntityRepository, SomeEntityService],
  controllers: [SomeEntityController],
  exports: [SomeEntityService, SomeEntityRepository],
})
```

**Módulos con tenant provider hoy:** `daily-room-rates`, `rate-plan`, `room-type`, `restrictions`,
`content-block`, `quote-template`, `quote-template-block` y `auth`/`users`.

> El contexto de tenant tiene un defecto de concurrencia sin resolver
> ([docs/ESTADO.md](docs/ESTADO.md) §1). Al escribir código nuevo, leer el tenant **siempre** a
> través de `tenantService.getActiveTenant()` y nunca cachearlo en una variable de instancia: cuando
> se migre a `AsyncLocalStorage`, el código que respete esta regla va a seguir funcionando sin
> cambios.

---

## Regla 3 — Fechas: "string in, string out"

Toda fecha de negocio se maneja como **string `YYYY-MM-DD`**. Nunca un `Date` para lógica de
negocio, nunca UTC, nunca transformaciones manuales.

### Por qué

Argentina es GMT-3. `new Date('2025-03-02')` se interpreta como UTC medianoche, que en hora local es
**el 1 de marzo**. Un día de desfase en un motor de precios significa cobrar la tarifa equivocada, y
falla en silencio: no hay excepción, sólo un número mal.

`DateUtils` construye las fechas al **mediodía** (`T12:00:00`) para que ningún huso ni horario de
verano corra el día.

### Toda manipulación pasa por `DateUtils`

`src/common/utils/date.utils.ts`:

| Método | Uso |
|---|---|
| `getTodayAsString()` | hoy, en local |
| `isValidDateString(s)` | validación de formato y fecha real |
| `compareDateStrings(a, b)` | comparación |
| `calculateNights(checkIn, checkOut)` | noches, con check-out exclusivo |
| `addDays(fecha, n)` | suma o resta días |
| `getDateRange(desde, hasta)` | array de fechas, `hasta` exclusivo |
| `validateDateRange(in, out, opts)` | validación completa de una estadía |
| `formatForDisplay(fecha)` | `DD/MM` para mostrar |

### En DTOs

```typescript
@ApiProperty({ description: 'Fecha de inicio', example: '2026-01-01' })
@IsDateString()
@IsNotEmpty()
startDate: Date
```

Sin `@Transform`, sin concatenar `'T00:00:00.000Z'`, sin conversiones en el servicio.

### Prohibido

```typescript
new Date(fecha + 'T00:00:00.000Z')   // ❌ desfase GMT-3
currentDate.setUTCDate(...)          // ❌ iterar en UTC
date.getUTCDay()                     // ❌ día de semana en UTC
startDate: string                    // ❌ tipo string en el DTO
```

### Convención de día de semana

Hay **dos conviviendo** en el código, y es un bug latente
([docs/ESTADO.md](docs/ESTADO.md) §3):

- `CalendarBulkEditDto.daysOfWeek` → ISO 8601 (1 = lunes … 7 = domingo)
- `DailyRateBulkDto.dayOfWeekFilter` → JavaScript (0 = domingo … 6 = sábado)

**Para código nuevo, usar la convención JavaScript** (`getDay()` directo, 0-6), que es la que valida
el servicio de tarifas. Y documentarla explícitamente en el `@ApiProperty`.

---

## Regla 4 — Los módulos se generan, no se escriben

```bash
npm run create-engine nombre-del-modulo    # kebab-case, minúsculas
```

Genera controller, service, entity, DTOs, providers, repository y `constants.ts` con la estructura
estándar. Después se le agregan los campos a la entidad y se genera la migración.

**No crear a mano** entidades, DTOs, servicios, controllers ni la estructura de carpetas. El
generador garantiza que el patrón de repositorios y la forma del módulo sean uniformes.

Después de generar, hay que hacer tres cosas a mano:

1. Agregar los campos a la entidad.
2. Crear el `*-tenant.providers.ts` y registrarlo en el módulo (Regla 2).
3. Registrar el módulo en `app.module.ts`.

### Estructura resultante

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

## Regla 5 — Proteger los endpoints de administración

Todo endpoint que escriba o exponga datos del hotel lleva:

```typescript
@RoleProtected(ValidRoles.SUPER_ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)
```

Las únicas rutas legítimamente públicas son las de cotización (`/api/quotes/*`) y las de
autenticación.

**No comentar guards "temporalmente para testing".** Ya pasó: en `rate-plan.controller.ts` llevan
diez meses comentados, y el controller de `daily-room-rates` quedó sin proteger
([docs/ESTADO.md](docs/ESTADO.md) §2). Para probar sin token, generar uno con el seeder.

---

## Regla 6 — Nada de éxito en falso

Un endpoint que no está implementado devuelve **`501 Not Implemented`**, no `{ success: true }`.

Ya hay un caso en producción de este error: `POST /api/admin/calendar/bulk-edit` responde éxito y no
escribe nada ([docs/ESTADO.md](docs/ESTADO.md) §3). Un stub silencioso es peor que un error, porque
el que llama no tiene forma de darse cuenta.

---

## Migraciones

```bash
npm run db:migration:generate -n NombreDeLaMigracion   # desde cambios de entidad
npm run db:createEmpty NombreDeLaMigracion             # vacía
npm run db:migrate                                     # ejecutar pendientes
npm run db:revert                                      # revertir la última
```

**Revisar siempre la migración generada antes de aplicarla.** TypeORM compara contra las entidades, y
hoy hay una divergencia conocida: `rate_plans` está creada con columnas `varchar` donde las entidades
declaran `uuid` ([docs/ESTADO.md](docs/ESTADO.md) §14). La primera generación automática va a
proponer convertirlas — es correcto, pero hay que tratar la foreign key con cuidado.

`PG_DB_SYNCHRONIZE` va **siempre** en `false`. El esquema se versiona con migraciones.

---

## Logging

El proyecto tiene Winston configurado con rotación diaria. **Usarlo**, no `console.log`. Hoy hay
`console.log` en rutas de ejecución normales (`replaceVariables()`, tenant providers) que ensucian la
salida de producción ([docs/ESTADO.md](docs/ESTADO.md) §16).

Para trazas de diagnóstico, nivel `debug`.

---

## Cuando algo no funciona

1. Buscar en la documentación oficial de NestJS o TypeORM antes de improvisar.
2. Si el problema persiste después de un par de intentos, buscar en foros especializados.
3. Si la solución es un workaround, dejarlo documentado con el porqué y anotarlo en
   `docs/ESTADO.md`.

---

## Resumen de lo prohibido

| Nunca | Por qué |
|---|---|
| `@InjectRepository()` o `TypeOrmModule.forFeature()` | rompe el patrón de repositorios personalizados |
| Módulo nuevo sin `*-tenant.providers.ts` | filtra datos entre hoteles |
| Cachear el tenant en una variable de instancia | bloquea la migración a `AsyncLocalStorage` |
| `string` para fechas en DTOs, o UTC en iteraciones | desfase de un día en GMT-3 |
| Crear entidades, DTOs o módulos a mano | usar `npm run create-engine` |
| Comentar guards "temporalmente" | ya hay endpoints de precios sin proteger |
| Devolver `success: true` desde un stub | ya hay un endpoint que miente |
| `console.log` en código de producción | usar Winston |
| `PG_DB_SYNCHRONIZE=true` | el esquema se versiona con migraciones |

## En caso de duda

Leer [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para entender el modelo, y
[docs/ESTADO.md](docs/ESTADO.md) para saber qué está roto. Si la duda persiste, preguntar antes de
implementar: en este repositorio ya hay demasiado código escrito sobre supuestos que nadie validó.
