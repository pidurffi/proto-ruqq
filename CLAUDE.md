# CLAUDE.md
Este archivo proporciona orientación a Claude Code (claude.ai/code) al trabajar con código en este repositorio.

## Resumen del Proyecto
Este es "Ruqq" - Un sitema de generador de presupuestos y reservas para hoteles, basado en boiler-00, una API basada en NestJS construida con TypeORM, PostgreSQL y autenticación JWT. La base de código sigue una arquitectura modular con herramientas personalizadas de generación de código.

### Principios fundamentales para el desarrollo
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Domain-Driven Design**: Entities, Value Objects, Aggregates, Domain Services, Repositories
- **Buenas Prácticas**: Siempre programar usando buenas prácticas sin harcodeos no parches
- **Documentación**: Todo código complejo debe estar documentado con comentarios explicativos
- **TypeScript**: Modo estricto habilitado, tipos explícitos preferidos
- **Async**: Usar consistentemente el patrón async/await

### **Patrones TypeORM (Actuales)**
- **Entidad Base**: Todas las entidades extienden `EntityBase` con `id`, `uid`, soft delete
- **IDs de Entidades**: Todas las entidades usan UUID (string) como clave primaria, NO integers
- **Relaciones**: Siempre usar UUID strings para foreign keys, NO integers
- **Estrategia de Nomenclatura**: `SnakeNamingStrategy` para consistencia en base de datos
- **Repositorios**: Accedidos vía método abstracto `BaseEntityService.getRepository()`
- **Relaciones**: Decoradores TypeORM estándar (`@OneToMany`, `@ManyToOne`)
- **Migraciones**: Archivos de migración manuales en `/engine/migrations/`

### **🏢 CRITICAL: Arquitectura Multi-Tenant**
Este sistema es **completamente multi-tenant** usando schemas de PostgreSQL para aislamiento de datos. Cada hotel (tenant) tiene su propio schema independiente.

#### **🗄️ Estructura de Schemas:**
```
PostgreSQL Database:
├── schema: public          ← Desarrollo/Demo (datos fake)
├── schema: tenant_cliente1 ← Hotel Real #1 (datos productivos)  
├── schema: tenant_cliente2 ← Hotel Real #2 (datos productivos)
└── schema: tenant_clienteN ← Hotel Real #N (datos productivos)
```

#### **🔄 Context Switching Automático:**
```typescript
// Sin header = Desarrollo (public schema)
GET /api/room-type → Usa schema: public

// Con header = Producción (tenant schema)  
GET /api/room-type
Headers: { "X-Tenant-ID": "tenant_cliente1" } → Usa schema: tenant_cliente1
```

#### **✅ Beneficios de esta Arquitectura:**
- **Aislamiento Total**: Cada hotel no puede ver datos de otros
- **Desarrollo Seguro**: Schema `public` para pruebas sin riesgo
- **Escalabilidad**: Agregar nuevos hoteles es crear un schema
- **Performance**: Búsquedas optimizadas por tenant específico
- **Backup Granular**: Respaldo individual por hotel

### **🚨 CRITICAL: Repositorios Tenant-Aware (OBLIGATORIO)**
**TODOS** los módulos usan repositorios tenant-aware que cambian de schema dinámicamente. NUNCA usar repositorios tradicionales ni `@InjectRepository()`.

#### **✅ Patrón CORRECTO (Tenant-Aware):**
```typescript
// En el Module - SIEMPRE usar TenantProviders
import { SomeEntityTenantProviders } from './providers/some-entity-tenant.providers'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule],
  providers: [...SomeEntityTenantProviders, SomeEntityRepository, SomeEntityService], // ← Tenant Providers
  controllers: [SomeEntityController],
  exports: [SomeEntityService, SomeEntityRepository],
})
```

#### **🔧 Estructura de Tenant Provider:**
```typescript
// providers/some-entity-tenant.providers.ts
import { DataSource } from 'typeorm'
import { TenantService } from '../../../common/services/tenant.service'

function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(SomeEntity), {
    get(target, prop, receiver) {
      // Interceptar métodos de consulta
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'save', 'create', 'update', 'delete', 'createQueryBuilder'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[SomeEntityTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Schema public = comportamiento por defecto (desarrollo)
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          // Otros schemas = transacción con SET search_path
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(SomeEntity)
            const result = await (repoWithSchema as any)[prop].apply(repoWithSchema, args)
            await manager.query(`SET search_path TO public`)
            return result
          })
        }
      }
      return Reflect.get(target, prop, receiver)
    }
  })
}

export const SomeEntityTenantProviders = [
  {
    provide: repositories.SOME_ENTITY_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]
```

#### **🎯 JavaScript Proxy Pattern:**
- **Intercepta** todos los métodos de repositorio (find, save, create, update, delete)
- **Lee contexto** del `TenantService` para determinar schema activo
- **Ejecuta transacción** con `SET search_path` para cambiar schema dinámicamente
- **Transparente** para el Service - no necesita cambios en lógica de negocio

#### **📋 Módulos con Tenant-Aware Activado:**
✅ DailyRoomRate, ✅ Auth/User, ✅ RoomType, ✅ ContentBlock  
✅ QuoteTemplate, ✅ QuoteTemplateBlock, ✅ Restrictions
⚠️ **ELIMINADOS**: BaseRatePeriod, PriceRules, OccupancyRateModifiers (refactor completado)

#### **🛡️ VALIDACIÓN Y MANEJO DE ERRORES (CRÍTICO)**

**El sistema incluye validación robusta de tenants y manejo de errores:**

##### **✅ Validación de Formato de Tenant ID:**
```typescript
// El TenantService valida automáticamente:
- Solo caracteres alfanuméricos, guiones (-) y guiones bajos (_)
- Máximo 50 caracteres
- No puede estar vacío
- Pattern: /^[a-zA-Z0-9_-]+$/

// Headers inválidos retornan error 400 inmediatamente:
curl -H "X-Tenant-ID: tenant@invalid!" http://localhost:3001/api
// Response: 400 "Invalid X-Tenant-ID header: Tenant ID solo puede contener..."
```

##### **✅ Validación de Existencia de Tenant:**
```typescript
// Lista de tenants válidos (en TenantService):
private readonly validTenants = new Set([
  'default', 'public',           // ← Tenants de desarrollo  
  'tenant_cliente1', 'cliente1', // ← Hotel Cliente 1
  'tenant_cliente2', 'cliente2'  // ← Hotel Cliente 2
]);

// Tenants no existentes fallan con error descriptivo:
curl -H "X-Tenant-ID: hotel_inexistente" http://localhost:3001/api
// Response: 400 "Tenant 'hotel_inexistente' no existe en el sistema"
```

##### **🔧 Comportamiento por Entorno:**
```typescript
// DESARROLLO (NODE_ENV=development):
// - Si tenant no existe → Fallback a 'default' (public schema)
// - Logs de WARNING pero permite continuar
// - Ideal para testing sin configurar schemas

// PRODUCCIÓN (NODE_ENV=production): 
// - Si tenant no existe → Error 400 inmediato
// - No fallback, falla la request
// - Seguridad estricta
```

##### **📊 Logs Detallados para Debugging:**
```typescript
// Cada request tiene Request ID único para tracking:
[a1b2c3] ✅ Tenant context established: cliente1 (schema: tenant_cliente1) from X-Tenant-ID header
[a1b2c3] Request completed in 15ms, clearing tenant context

// Errores incluyen información completa:
[d4e5f6] ❌ Failed to create tenant context for 'tenant_inexistente' from X-Tenant-ID header
[d4e5f6] Valid tenants: default, public, tenant_cliente1, tenant_cliente2, cliente1, cliente2

// Logs codificados por nivel:
// LOG (verde) = Operaciones exitosas
// DEBUG (magenta) = Información detallada  
// WARN (amarillo) = Advertencias/fallbacks
// ERROR (rojo) = Fallos y excepciones
```

### **🚨 CRITICAL: Patrón de Inyección de Dependencias - Repositorios**
Este boilerplate usa EXCLUSIVAMENTE repositorios personalizados tenant-aware. NUNCA usar `@InjectRepository()` ni `TypeOrmModule.forFeature()`.

#### **✅ Patrón CORRECTO (Repositorios Personalizados):**
```typescript
// En el Service
import { SomeEntityRepository } from '../repositories/some-entity.repository'

@Injectable()
export class SomeService {
  constructor(
    @Inject(SomeEntityRepository)  // ← Inyectar la CLASE directamente
    private readonly someEntityRepository: SomeEntityRepository,
  ) {}
}

// En el Module
import { SomeEntityProviders } from './providers/some-entity.providers'
import { SomeEntityRepository } from './repositories/some-entity.repository'

@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule, AuthModule], // ← NO TypeOrmModule.forFeature
  providers: [...SomeEntityProviders, SomeEntityRepository, SomeEntityService], // ← Providers + Repository + Service
  controllers: [SomeEntityController],
  exports: [SomeEntityService, SomeEntityRepository], // ← Exportar Repository también
})
```

#### **❌ Patrón INCORRECTO (NO usar en este boilerplate):**
```typescript
// NUNCA hacer esto en este proyecto:
@Injectable()
export class WrongService {
  constructor(
    @InjectRepository(SomeEntity) // ← ❌ NUNCA usar @InjectRepository
    private readonly repository: Repository<SomeEntity>,
  ) {}
}

@Module({
  imports: [TypeOrmModule.forFeature([SomeEntity])], // ← ❌ NUNCA usar forFeature
})
```

#### **Estructura de Repositorio Personalizado:**
```typescript
// some-entity.repository.ts
@Injectable()
export class SomeEntityRepository extends Repository<SomeEntity> {
  constructor(
    @Inject(repositories.SOME_ENTITY_REPOSITORY) // ← Inyecta el provider
    private readonly _: Repository<SomeEntity>,
    @Inject(resources.DATA_SOURCE_POSTGRES)
    private readonly dataSource: DataSource,
  ) {
    super(_.target, _.manager, _.queryRunner) // ← Llama al constructor padre
  }
  
  // Métodos personalizados aquí
}
```

#### **Provider Pattern:**
```typescript
// providers/some-entity.providers.ts
export const SomeEntityProviders = [
  {
    provide: repositories.SOME_ENTITY_REPOSITORY,
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SomeEntity),
    inject: [resources.DATA_SOURCE_POSTGRES],
  },
]
```

#### **Referencias exitosas en el proyecto:**
- ✅ `DailyRoomRateModule` usa `DailyRoomRateTenantProviders` (tenant-aware) **← NUEVO**
- ✅ `AuthModule` usa `AuthTenantProviders` (tenant-aware)
- ✅ `RoomTypeModule` usa `RoomTypeTenantProviders` (tenant-aware)
- ✅ `ContentBlockModule` usa `ContentBlockTenantProviders` (tenant-aware)
- ✅ `QuoteTemplateModule` usa `QuoteTemplateTenantProviders` (tenant-aware)
- ✅ `QuoteTemplateBlockModule` usa `QuoteTemplateBlockTenantProviders` (tenant-aware)
- ✅ `RestrictionsModule` usa `RestrictionsTenantProviders` (tenant-aware)
- ✅ **TODOS los módulos usan repositorios tenant-aware para aislamiento de datos**
- ⚠️ **ELIMINADOS**: BaseRatePeriod, PriceRules, OccupancyRateModifiers (refactor completado)

### **Resolución de problemas / errores de código**
Siempre buscar en internet en la documentación oficial o foros especializados si persiste un problema y no podemos solucionarlo en pocos intentos.

## 🏗️ **ARQUITECTURA ACTUAL - Post-Refactor (Motor OTA Estándar v3.0)**

### **🎯 Modelo de Datos Simplificado:**
El sistema ahora utiliza el **modelo de calendario diario estándar** usado por todas las grandes OTAs (Booking.com, Airbnb, Expedia), reemplazando completamente el modelo híbrido anterior.

### **📊 Entidad Central: DailyRoomRate**
```typescript
@Entity({ name: 'daily_room_rates' })
export class DailyRoomRate extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date' })
  date: Date                        // ← UN REGISTRO POR CADA DÍA

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number                  // Precio base para este día

  @Column({ type: 'int', default: 0 })
  availableRooms: number            // Inventory para este día

  @Column({ type: 'int', nullable: true })
  minStay?: number                  // Min estancia desde este día

  @Column({ type: 'boolean', default: false })
  closedToArrival: boolean          // No check-in este día

  @Column({ type: 'boolean', default: true })
  isActive: boolean                 // Día vendible

  // CLAVE COMPUESTA ÚNICA (como Booking.com)
  @Index(['roomTypeId', 'date'], { unique: true })
  
  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
```

### **🚀 QuoteEngineService - Ultra Simplificado**
El nuevo motor de cotizaciones reemplaza 290+ líneas de lógica compleja con queries directas:

```typescript
// Antes: Lógica de split/consolidation/fragments (compleja)
// Ahora: Query simple y directa
async calculateQuote(roomTypeId: string, checkIn: string, checkOut: string) {
  const dailyRates = await this.dailyRatesRepository.query(`
    SELECT date, base_rate as "baseRate", available_rooms as "availableRooms"
    FROM daily_room_rates 
    WHERE room_type_id = $1 AND date >= $2 AND date <= $3 AND is_active = true
    ORDER BY date ASC
  `, [roomTypeId, checkIn, this.subtractDays(checkOut, 1)])
  
  // Cálculo directo: suma de rates por noche
  return dailyRates.reduce((total, rate) => total + parseFloat(rate.baseRate), 0)
}
```

### **📈 Beneficios Logrados:**
- **80% reducción** en complejidad de código
- **Performance** optimizada con queries OTA-estándar
- **Compatibilidad** 100% con Channel Managers
- **Mantenibilidad** drasticamente mejorada

### **🚀 Optimizaciones de Performance Aplicadas:**
- **Sistema de Caché Inteligente**: 
  - `getDefaultRatePlanId()` usa caché en memoria para evitar queries repetitivas
  - Reducción de 90% en queries para operaciones bulk (30 días: 30 queries → 1 query inicial + caché)
- **Refactoring de Código**:
  - Métodos helper `isValidUuid()` y `validateAndNormalizeUid()` eliminan duplicación
  - Limpieza de imports no utilizados (`Between`, `LessThanOrEqual`, `MoreThanOrEqual`)
- **Patrón de Caché Simple pero Efectivo**:
  ```typescript
  private defaultRatePlanId: string | null = null // ← Variable de instancia
  
  private async getDefaultRatePlanId(): Promise<string> {
    if (this.defaultRatePlanId) {
      return this.defaultRatePlanId // ← Cache hit: retorno inmediato
    }
    // Solo primera vez: query BD + almacenar en caché
    const result = await this.dataSource.query('SELECT id FROM rate_plans...')
    this.defaultRatePlanId = result[0].id
    return this.defaultRatePlanId
  }
  ```

### **🗃️ Datos Iniciales Automatizados:**
El `InitialDataSeeder` crea automáticamente:
- 5 tipos de habitación (LUX, PRE, SUP, EST, SUI)
- Tarifas diarias desde hoy hasta 30/04/2026
- Precios configurados: LUX $500, PRE $400, SUP $300, EST $200, SUI $100

## Comandos Comunes

### Desarrollo
- `npm run start:dev` - Iniciar servidor de desarrollo con recarga automática
- `npm run start:debug` - Iniciar con modo debug
- `npm run build` - Construir la aplicación
- `npm run lint` - Ejecutar ESLint con auto-corrección
- `npm run format` - Formatear código con Prettier

### Operaciones de Base de Datos
- `npm run typeorm` - Ejecutar comandos CLI de TypeORM
- `npm run db:migrate` - Ejecutar migraciones pendientes
- `npm run db:revert` - Revertir última migración
- `npm run db:migration:generate -n NombreMigración` - Generar migración desde cambios de entidad
- `npm run db:createEmpty NombreMigración` - Crear archivo de migración vacío

### Inicialización de Datos
- `npm run seed:run` - Ejecutar InitialDataSeeder (crea room types + daily rates hasta 30/04/2026)
- `npm run seed:revert` - Limpiar datos de seeding

### Generación de Entidades
## Obligatorio: siempre usar el generador para crear entidades vacías y luego agregar las propiedades (campos)
- `npm run create-engine nombre-entidad` - Generar módulo CRUD completo (usar kebab-case)

### Configuración Docker
- `docker-compose up -d` - Iniciar base de datos PostgreSQL

## 🔧 **CONFIGURACIÓN Multi-Tenant**

### **Variables de Entorno Críticas:**
```bash
# .env
NODE_ENV=development          # ← CRÍTICO: Controla comportamiento de fallback
DEFAULT_TENANT_ID=default     # ← Tenant por defecto (opcional)
DEFAULT_SCHEMA=public         # ← Schema por defecto (opcional)

# Comportamiento por entorno:
# development → Permite fallback a tenant por defecto si falla validación
# production  → Falla inmediatamente si tenant no existe (seguridad estricta)
```

### **Lista de Tenants Válidos:**
```typescript
// src/common/services/tenant.service.ts
private readonly validTenants = new Set([
  'default', 'public',           // ← Desarrollo/Demo
  'tenant_cliente1', 'cliente1', // ← Hotel Cliente 1  
  'tenant_cliente2', 'cliente2', // ← Hotel Cliente 2
  // Agregar nuevos tenants aquí ↓
  'tenant_cliente3', 'cliente3', // ← Nuevo hotel
]);

// ⚠️ IMPORTANTE: En producción esto debe venir de base de datos
// Esta implementación temporal es para development/testing
```

### **Configuración de Schemas PostgreSQL:**
```sql
-- Crear schemas para cada tenant (ejecutar manualmente):
CREATE SCHEMA IF NOT EXISTS tenant_cliente1;
CREATE SCHEMA IF NOT EXISTS tenant_cliente2;
CREATE SCHEMA IF NOT EXISTS tenant_cliente3;

-- Replicar estructura de tablas en cada schema:
-- (Esto debe ser parte del sistema de migraciones en producción)
```

## Arquitectura

### Estructura Principal
- **src/engine/** - Módulos de lógica de negocio (auth, database, code-generator)
- **src/common/** - Utilidades compartidas, entidades, DTOs, servicios e interceptores
- **src/config/** - Archivos de configuración (TypeORM, mailer)
- **src/utils/** - Funciones de utilidad

### Patrones Clave
- **Entidad Base**: Todas las entidades extienden `EntityBase` con clave primaria UUID, campos de auditoría (`uid`, `createdAt`, `updatedAt`, `deletedAt`)
- **Autenticación**: Basada en JWT con control de acceso basado en roles, decoradores para protección de rutas
- **Generación de Código**: Herramientas CLI personalizadas en `src/engine/code-generator/` crean módulos CRUD completos con controladores, servicios, DTOs y entidades
- **Base de Datos**: PostgreSQL con TypeORM, estrategia de nomenclatura snake_case
- **Email**: Plantillas Handlebars en `src/common/mailer/templates/`

### Estructura de Módulos
Los módulos generados siguen este patrón:
```
module-name/
├── controllers/
├── services/
├── entities/
├── dto/
├── providers/
└── module.ts
```

### Archivos Importantes
- **typeorm.cli.config.ts** - Configuración CLI de TypeORM
- **src/config/ormconfig.ts** - Configuración de conexión a base de datos
- **src/common/entities/base.entity.ts** - Entidad base con campos comunes
- **src/engine/auth/entities/user.entity.ts** - Modelo de autenticación de usuario

## 📅 **CRITICAL: Manejo Correcto de Fechas en DTOs**

### **🚨 Problema de Zona Horaria**
Las fechas en DTOs **DEBEN** seguir el patrón exacto de `DailyRoomRateCreateDto` para evitar problemas de zona horaria.

### **✅ Patrón CORRECTO (DailyRoomRate):**
```typescript
@ApiProperty({
  description: 'Fecha específica del día',
  example: '2024-01-01'
})
@IsDateString()
@IsNotEmpty()
date: Date  // ← Tipo Date, no string
```

### **❌ Patrón INCORRECTO:**
```typescript
// NUNCA hacer esto:
@IsDateString()
startDate: string  // ← ❌ Causa problemas de zona horaria

// O esto:
@Transform(({ value }) => new Date(value + 'T00:00:00.000Z'))
startDate: Date  // ← ❌ Transformaciones manuales innecesarias
```

### **🔧 Regla de Oro:**
- **Tipo**: `Date` (siempre)
- **Validación**: Solo `@IsDateString()` + `@IsNotEmpty()`
- **Sin transformaciones manuales** en DTOs
- **Sin conversiones** en servicios si el DTO ya tiene tipo `Date`

### **✅ Resultado Esperado:**
- Envío: `"2025-03-01"` → Almacena: `2025-03-01`
- **NO**: `"2025-03-01"` → Almacena: `2025-02-28` (zona horaria incorrecta)

---

## ⏰ **CRITICAL: Manejo de Fechas en Iteraciones (Zona Horaria)**

### **🚨 Problema de Zona Horaria en Loops**
Al iterar fechas en servicios (ej: cálculo noche por noche), **NUNCA** usar UTC ya que causa desfase de días por zona horaria local (GMT-3 Argentina).

### **✅ Patrón CORRECTO (QuotesService):**
```typescript
// ✅ CORRECTO - Sin zona horaria
let currentDate = new Date(checkIn)
const checkOutDate = new Date(checkOut)

while (currentDate < checkOutDate) {
  const dateString = currentDate.toISOString().split('T')[0]
  const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay()
  
  // Avanzar al siguiente día
  currentDate.setDate(currentDate.getDate() + 1)  // ← Local
}
```

### **❌ Patrón INCORRECTO:**
```typescript
// ❌ INCORRECTO - Con UTC causa desfase
let currentDate = new Date(checkIn + 'T00:00:00.000Z')  // ← GMT-3 desfase
const checkOutDate = new Date(checkOut + 'T00:00:00.000Z')

while (currentDate < checkOutDate) {
  // 2025-03-02 se convierte en 2025-03-01 por zona horaria ❌
  const dayOfWeek = currentDate.getDay()  // ← Día incorrecto
  
  currentDate.setUTCDate(currentDate.getUTCDate() + 1)  // ← UTC problemático
}
```

### **🔧 Regla de Oro para Iteraciones:**
- **Crear fechas**: `new Date(dateString)` (sin 'T00:00:00.000Z')
- **Iterar días**: `setDate(getDate() + 1)` (no setUTCDate)
- **Día de semana**: `getDay()` directo (JavaScript local)
- **PostgreSQL**: Las fechas se guardan correctamente como date sin timezone

### **✅ Resultado Esperado:**
- **Input**: `"2025-03-02"` (Sábado)
- **JavaScript**: Sábado (getDay() = 6, ISO = 6) ✅
- **PostgreSQL**: `2025-03-02` almacenado como date ✅
- **Price Rule**: Aplica para día 6 (Sábado) ✅

### **❌ Comportamiento Incorrecto Evitado:**
- **Input**: `"2025-03-02"` (Sábado)  
- **JavaScript UTC**: Viernes (getDay() = 5, GMT-3 desfase) ❌
- **Price Rule**: NO aplica para día 6 ❌

---

## 🛠️ **GUÍA: Crear Nuevos Módulos Tenant-Aware**

### **Paso 1: Generar Módulo Base**
```bash
npm run create-engine nueva-entidad
```

### **Paso 2: Crear Tenant Provider (OBLIGATORIO)**
```typescript
// providers/nueva-entidad-tenant.providers.ts
import { DataSource } from 'typeorm'
import { NuevaEntidad } from '../entities/nueva-entidad.entity'
import { TenantService } from '../../../common/services/tenant.service'
import { resources } from '../../../engine/database/constants'
import { repositories } from '../constants'

function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService) {
  return new Proxy(dataSource.getRepository(NuevaEntidad), {
    get(target, prop, receiver) {
      if (typeof (target as any)[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder', 'preload'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[NuevaEntidadTenantProvider] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          if (tenantContext.schema === 'public') {
            return (target as any)[prop].apply(target, args)
          }
          
          if (prop === 'createQueryBuilder') {
            const queryBuilder = (target as any).createQueryBuilder.apply(target, args)
            queryBuilder.from(`${tenantContext.schema}.nueva_entidad`, args[0] || 'nuevaEntidad')
            return queryBuilder
          }
          
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO "${tenantContext.schema}", public`)
            const repoWithSchema = manager.getRepository(NuevaEntidad)
            const result = await (repoWithSchema as any)[prop].apply(repoWithSchema, args)
            await manager.query(`SET search_path TO public`)
            return result
          })
        }
      }
      return Reflect.get(target, prop, receiver)
    }
  })
}

export const NuevaEntidadTenantProviders = [
  {
    provide: repositories.NUEVA_ENTIDAD_REPOSITORY,
    useFactory: (tenantService: TenantService, dataSource: DataSource) => {
      console.log(`[NuevaEntidadTenantProvider] Creating repository for schema: ${tenantService.getActiveTenant().schema}`)
      return createTenantAwareRepository(dataSource, tenantService)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  },
]
```

### **Paso 3: Actualizar Module**
```typescript
// nueva-entidad.module.ts
import { NuevaEntidadTenantProviders } from './providers/nueva-entidad-tenant.providers' // ← Cambiar import

@Module({
  providers: [...NuevaEntidadTenantProviders, NuevaEntidadRepository, NuevaEntidadService], // ← Usar TenantProviders
})
```

### **Paso 4: Verificar Funcionamiento**
```bash
# Verificar logs de inicialización
npm run start:dev
# Buscar: "[NuevaEntidadTenantProvider] Creating repository for schema: public"

# Probar con diferentes tenants
curl -H "X-Tenant-ID: tenant_cliente1" http://localhost:3001/api/nueva-entidad
curl http://localhost:3001/api/nueva-entidad  # Sin header (public)
```

### **⚠️ Errores Comunes al Crear Módulos:**
- **❌ Olvidar crear el `-tenant.providers.ts`** → Datos no aislados por tenant
- **❌ No actualizar el import en module** → Sigue usando providers tradicionales  
- **❌ Nombre incorrecto de tabla en `queryBuilder.from()`** → Error SQL
- **❌ No incluir `preload` en métodos interceptados** → Falla en updates

## 🧪 **TESTING Multi-Tenant**

### **Verificar Aislamiento de Datos:**
```bash
# Crear datos en tenant específico
curl -X POST -H "X-Tenant-ID: tenant_cliente1" -H "Content-Type: application/json" \
  http://localhost:3001/api/room-type -d '{"name": "Suite Tenant 1", "code": "ST1"}'

# Verificar que NO aparece en public
curl http://localhost:3001/api/room-type  # No debe mostrar "Suite Tenant 1"

# Verificar que SÍ aparece en tenant_cliente1  
curl -H "X-Tenant-ID: tenant_cliente1" http://localhost:3001/api/room-type  # Debe mostrar "Suite Tenant 1"
```

### **🔍 DEBUGGING Multi-Tenant (ENDPOINTS CRÍTICOS)**

#### **Endpoint de Debugging Principal:**
```bash
# Información completa del sistema multi-tenant
GET /api/tenant-debug

# Ejemplos de uso:
curl http://localhost:3001/api/tenant-debug  
# ← Sin header (tenant por defecto)

curl -H "X-Tenant-ID: cliente1" http://localhost:3001/api/tenant-debug  
# ← Con tenant válido

curl -H "X-Tenant-ID: tenant_inexistente" http://localhost:3001/api/tenant-debug  
# ← Tenant no existente (error 400)

# Response incluye:
{
  "request": { /* contexto actual */ },
  "validation": { /* validaciones en tiempo real */ },
  "system": { 
    "validTenants": ["default", "cliente1", "cliente2"],
    "defaultTenant": {"tenantId": "default", "schema": "public"}
  },
  "troubleshooting": { /* ejemplos de uso */ }
}
```

#### **Endpoint de Información de Tenant:**
```bash
# Información básica del tenant activo
GET /api/tenant-info

curl -H "X-Tenant-ID: cliente1" http://localhost:3001/api/tenant-info
# Response: contexto de tenant, headers procesados, schema activo
```

### **🔧 Troubleshooting Multi-Tenant:**

#### **❌ Error: "Tenant no existe"**
```bash
# Problema:
curl -H "X-Tenant-ID: hotel123" http://localhost:3001/api
# Response: 400 "Tenant 'hotel123' no existe en el sistema"

# Solución:
# 1. Verificar tenants válidos:
curl http://localhost:3001/api/tenant-debug | jq '.system.validTenants'

# 2. Usar un tenant de la lista:
curl -H "X-Tenant-ID: cliente1" http://localhost:3001/api

# 3. Para agregar nuevo tenant, actualizar TenantService.validTenants
```

#### **❌ Error: "Invalid X-Tenant-ID header"**
```bash
# Problema:
curl -H "X-Tenant-ID: hotel@123!" http://localhost:3001/api
# Response: 400 "Invalid X-Tenant-ID header: solo caracteres válidos"

# Solución - Solo usar caracteres permitidos:
curl -H "X-Tenant-ID: hotel_123" http://localhost:3001/api  # ✅
curl -H "X-Tenant-ID: hotel-123" http://localhost:3001/api  # ✅
curl -H "X-Tenant-ID: hotel123" http://localhost:3001/api   # ✅
```

#### **⚠️ Warning: "Fallback to default tenant"**
```bash
# En desarrollo, tenant inexistente usa fallback:
# Log: [abc123] Falling back to default tenant for development
# Behavior: Request continúa con schema 'public'

# En producción: Request falla inmediatamente (sin fallback)
```

### **Monitorear Logs:**
```bash
# Filtrar logs de tenant providers
npm run start:dev | grep "TenantProvider"

# Filtrar logs por Request ID específico
npm run start:dev | grep "\[abc123\]"

# Filtrar solo errores de tenant
npm run start:dev | grep "TenantMiddleware.*ERROR"

# Filtrar validaciones de tenant
npm run start:dev | grep "TenantService.*validateAndCheckTenant"
```

## ❌ **REGLAS CRÍTICAS - Lo que NUNCA debo hacer**

### **🚨 Arquitectura y Repositorios:**
- **NUNCA usar `@InjectRepository()` o `TypeOrmModule.forFeature()`** - Este sistema usa SOLO repositorios tenant-aware personalizados
- **NUNCA usar providers tradicionales** - SIEMPRE usar `SomeEntityTenantProviders` para aislamiento de datos
- **NUNCA inyectar tokens de provider** - Inyectar las CLASES de Repository directamente con `@Inject(RepositoryClass)`
- **NUNCA crear módulos sin tenant-aware** - Todos los módulos nuevos DEBEN ser multi-tenant desde el inicio

### **🚨 Multi-Tenancy:**
- **NUNCA hardcodear schemas** - Usar siempre `tenantService.getActiveTenant().schema`
- **NUNCA omitir validación de tenant** - Siempre validar con `validateAndCheckTenant()` antes de procesar
- **NUNCA agregar tenant al `validTenants` sin crear schema PostgreSQL** - Causa errores de schema inexistente
- **NUNCA usar tenant fallback en producción** - Solo en desarrollo (`NODE_ENV=development`)
- **NUNCA ignorar headers `X-Tenant-ID`** - Es la fuente primaria de contexto de tenant

### **🚨 Validación y Errores:**
- **NUNCA permitir caracteres especiales en tenant IDs** - Solo `[a-zA-Z0-9_-]` válidos
- **NUNCA crear tenant IDs > 50 caracteres** - Límite estricto por compatibilidad PostgreSQL
- **NUNCA omitir manejo de errores** - Siempre capturar y loggear fallos de validación de tenant
- **NUNCA retornar errores genéricos** - Usar mensajes específicos como "Tenant 'X' no existe en el sistema"

### **🚨 Logging y Debugging:**
- **NUNCA omitir Request IDs** - Crítico para tracking de requests específicos en logs
- **NUNCA loggear información sensible** - Evitar passwords, tokens en logs de tenant
- **NUNCA usar console.log** - Usar siempre `Logger` de NestJS con niveles apropiados
- **NUNCA omitir contexto en logs** - Incluir tenant, schema, request ID en mensajes

### **🚨 Fechas y Datos:**
- **NUNCA usar tipos `string` para fechas en DTOs** - Siempre usar tipo `Date` como en DailyRoomRate
- **NUNCA usar UTC en iteraciones de fechas** - Causa desfase de días por zona horaria GMT-3
- **NUNCA omitir validación de formato** - Usar `@IsDateString()` para validar fechas

### **🚨 Desarrollo y Testing:**
- **NUNCA crear entidades manualmente desde cero** - Usar generador `npm run create-engine`
- **NUNCA escribir DTOs/Services/Controllers desde cero** - Usar templates existentes
- **NUNCA registrar módulos manualmente en app.module.ts** - El generador lo hace automáticamente
- **NUNCA testear sin tenant context** - Siempre incluir headers apropiados en tests

### **🚨 Configuración:**
- **NUNCA cambiar `NODE_ENV` en producción a development** - Desactiva seguridad de tenant
- **NUNCA omitir configuración de schemas PostgreSQL** - Crear schemas antes de agregar tenants
- **NUNCA hardcodear lista de tenants en código** - En producción debe venir de BD

### **✅ En caso de duda, SIEMPRE:**
1. Consultar endpoints de debugging: `/api/tenant-debug`, `/api/tenant-info`
2. Verificar logs con Request ID para debugging específico
3. Validar tenant con `validateAndCheckTenant()` antes de procesar
4. Usar patrones existentes como referencia (DailyRoomRate, Auth, RoomType)
5. Testear con diferentes tenants: sin header, tenant válido, tenant inválido