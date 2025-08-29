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

## ❌ Lo que NO debo hacer

- Crear entidades manualmente desde cero
- Escribir DTOs/Services/Controllers desde cero
- Crear estructura de carpetas manualmente
- Registrar módulos manualmente en app.module.ts