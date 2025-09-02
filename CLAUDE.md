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

### **🚨 CRITICAL: Patrón de Inyección de Dependencias - Repositorios**
Este boilerplate usa EXCLUSIVAMENTE repositorios personalizados. NUNCA usar `@InjectRepository()` ni `TypeOrmModule.forFeature()`.

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
- `QuotesService` inyecta `BaseRatePeriodRepository` ✅
- `BaseRatePeriodModule` usa `BaseRatePeriodProviders` ✅
- Todos los módulos generados siguen este patrón ✅

### **Resolución de problemas / errores de código**
Siempre buscar en internet en la documentación oficial o foros especializados si persiste un problema y no podemos solucionarlo en pocos intentos.

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

### Generación de Entidades
## Obligatorio: siempre usar el generador para crear entidades vacías y luego agregar las propiedades (campos)
- `npm run create-engine nombre-entidad` - Generar módulo CRUD completo (usar kebab-case)

### Configuración Docker
- `docker-compose up -d` - Iniciar base de datos PostgreSQL

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
Las fechas en DTOs **DEBEN** seguir el patrón exacto de `BaseRatePeriodCreateDto` para evitar problemas de zona horaria.

### **✅ Patrón CORRECTO (BaseRatePeriod):**
```typescript
@ApiProperty({
  description: 'Fecha de inicio del período',
  example: '2024-01-01'
})
@IsDateString()
@IsNotEmpty()
startDate: Date  // ← Tipo Date, no string
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

## ❌ Lo que NO debo hacer

- Crear entidades manualmente desde cero
- Escribir DTOs/Services/Controllers desde cero
- Crear estructura de carpetas manualmente
- Registrar módulos manualmente en app.module.ts
- **🚨 NUNCA usar `@InjectRepository()` o `TypeOrmModule.forFeature()`** - Este boilerplate usa SOLO repositorios personalizados
- **🚨 NUNCA inyectar tokens de provider** - Inyectar las CLASES de Repository directamente con `@Inject(RepositoryClass)`
- **🚨 NUNCA usar tipos `string` para fechas en DTOs** - Siempre usar tipo `Date` como en BaseRatePeriod
- **🚨 NUNCA usar UTC en iteraciones de fechas** - Causa desfase de días por zona horaria GMT-3