# Manual del Boilerplate NestJS

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Generador de Código](#generador-de-código)
5. [Sistema de Logging](#sistema-de-logging)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
8. [Manejo de Archivos](#manejo-de-archivos)
9. [Estructura de Servicios](#estructura-de-servicios)
10. [API Documentation](#api-documentation)
11. [Scripts Disponibles](#scripts-disponibles)
12. [Mejores Prácticas](#mejores-prácticas)

---

## 🚀 Introducción

Este boilerplate es una aplicación NestJS completamente configurada que proporciona:

- **Generador automático de código** para entidades CRUD completas
- **Sistema de logging avanzado** con Winston y notificaciones por email
- **Autenticación JWT** con roles y permisos
- **Base de datos PostgreSQL** con TypeORM y migraciones automáticas
- **Manejo de archivos** con procesamiento de imágenes
- **Documentación automática** con Swagger
- **Estructura modular** escalable y mantenible

**Autores**: Hernán Molinari - Gastón Rodríguez

---

## ⚙️ Instalación y Configuración

### 1. Requisitos Previos

- Node.js >= 18.x
- PostgreSQL >= 12.x
- npm o yarn

### 2. Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd boiler-00

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.template .env
```

### 3. Configuración de Variables de Entorno

Edita el archivo `.env` con tus valores:

```bash
# Entorno
ENVIRONMENT=local

# Base de datos
PG_DB_HOST=localhost
PG_DB_PORT=5432
PG_DB_NAME=your_database_name
PG_DB_USERNAME=your_username
PG_DB_PASSWORD=your_password
PG_DB_SYNCHRONIZE=false
PG_DB_LOGGING=false

# App
PORT=3001
HOST_API=http://localhost:3001/api

# Seguridad
JWT_SECRET=your_jwt_secret_here
CORS_WHITE_LIST=http://localhost:4200

# Mailer
MAILER_HOST=your_smtp_host
MAILER_PORT=465
MAILER_SECURE=true
MAILER_USER=your_email@example.com
MAILER_PASS=your_email_password

# Winston Logger Email Notifications
MAIL_LOG=your_log_email@example.com
MAIL_ERROR=your_error_email@example.com
MAIL_WARN=your_warn_email@example.com
MAIL_DEBUG=your_debug_email@example.com
MAIL_VERBOSE=your_verbose_email@example.com

# Archivos estáticos
STATIC_UPLOADS_PATH=static/uploads
STATIC_SERVE_ROOT=/public

# Configuración general de imágenes
IMG_THUMBS_WIDTH=400
IMG_THUMBS_FOLDER=thumbs
```

### 4. Configuración de Base de Datos

```bash
# Crear la base de datos
# Ejecutar las migraciones iniciales
npm run db:migrate

# Iniciar en modo desarrollo
npm run start:dev
```

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
src/
├── app.module.ts              # Módulo principal
├── main.ts                    # Punto de entrada
├── common/                    # Módulos compartidos
│   ├── common.module.ts       # Configuración común
│   ├── constants.ts           # Constantes globales
│   ├── dto/                   # DTOs base
│   ├── entities/              # Entidades base
│   ├── services/              # Servicios base
│   ├── interceptors/          # Interceptores
│   ├── mailer/               # Sistema de correo
│   └── uploads-handle/        # Manejo de archivos
├── config/                    # Configuraciones
│   ├── ormconfig.ts          # Configuración TypeORM
│   └── mailer.config.ts      # Configuración email
├── engine/                    # Motor del sistema
│   ├── auth/                 # Autenticación
│   ├── database/             # Configuración DB
│   ├── code-generator/       # Generador de código
│   ├── migration-generator/  # Generador de migraciones
│   └── migrations/           # Archivos de migración
├── resources/                 # Recursos generados
│   └── [entidades]/          # Entidades del negocio
└── utils/                     # Utilidades
```

### Principios Arquitectónicos

- **Modularidad**: Cada funcionalidad en su módulo
- **Separación de responsabilidades**: Servicios, repositorios y controladores
- **Inyección de dependencias**: Uso completo del sistema DI de NestJS
- **Principios SOLID**: Especialmente SRP y DIP

---

## 🔧 Generador de Código

### ¿Qué es el Generador?

El generador de código es una herramienta que crea automáticamente una estructura CRUD completa para una nueva entidad, incluyendo:

- **Entity**: Entidad TypeORM
- **Controller**: Controlador REST con todos los endpoints
- **Service**: Lógica de negocio
- **Repository**: Acceso a datos
- **DTOs**: Objetos de transferencia de datos
- **Module**: Configuración del módulo
- **Providers**: Configuración de inyección de dependencias

### Uso del Generador

```bash
# Sintaxis básica
npm run create-engine <nombre-entidad>

# Ejemplos
npm run create-engine user
npm run create-engine blog-post
npm run create-engine student-grade
```

### Convenciones de Nombres

El generador convierte automáticamente los nombres a diferentes formatos:

| Input | Formato | Uso | Ejemplo |
|-------|---------|-----|---------|
| `blog-post` | kebab-case | Archivos y URLs | `blog-post.service.ts` |
| `BlogPost` | PascalCase | Clases | `class BlogPostService` |
| `blogPost` | camelCase | Variables | `const blogPost` |
| `blog_post` | snake_case | Tablas DB | `blog_post` |
| `BLOG_POST` | UPPER_SNAKE_CASE | Constantes | `BLOG_POST_REPOSITORY` |

### Estructura Generada

Para la entidad `blog-post`, se genera:

```
src/resources/blog-post/
├── blog-post.module.ts
├── constants.ts
├── controllers/
│   └── blog-post.controller.ts
├── dto/
│   ├── index.ts
│   ├── blog-post-create.dto.ts
│   ├── blog-post-update.dto.ts
│   ├── blog-post-query.dto.ts
│   └── blog-post-list.dto.ts
├── entities/
│   └── blog-post.entity.ts
├── providers/
│   └── blog-post.providers.ts
├── repositories/
│   └── blog-post.repository.ts
└── services/
    └── blog-post.service.ts
```

### Endpoints Generados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/blog-post` | Listar con paginación y filtros |
| `GET` | `/blog-post/:id` | Obtener por ID |
| `POST` | `/blog-post` | Crear nuevo |
| `PATCH` | `/blog-post/:id` | Actualizar |
| `DELETE` | `/blog-post/:id` | Eliminar (soft delete) |

### Workflow Completo

1. **Generar código**:
   ```bash
   npm run create-engine blog-post
   ```

2. **Personalizar entidad** (agregar campos):
   ```typescript
   // src/resources/blog-post/entities/blog-post.entity.ts
   @Entity({ name: 'blog_post' })
   export class BlogPost extends EntityBase {
     @Column({ type: 'varchar', length: 255 })
     title: string

     @Column({ type: 'text' })
     content: string

     @Column({ type: 'boolean', default: true })
     isPublished: boolean
   }
   ```

3. **Generar migración**:
   ```bash
   npm run typeorm migration:generate -n blog-post
   ```

4. **Ejecutar migración**:
   ```bash
   npm run db:migrate
   ```

5. **Personalizar lógica de negocio** según necesidades

---

## 📊 Sistema de Logging

### Características del Sistema

- **Winston Logger** como motor principal
- **Rotación diaria de logs** con retención configurable
- **Múltiples niveles** de logging (debug, info, warn, error)
- **Notificaciones por email** opcionales
- **Auditoría automática** de operaciones CRUD
- **Logs estructurados** en formato JSON

### Tipos de Logs

#### 1. **Logs de Aplicación**
- **Archivo**: `logs/app-YYYY-MM-DD.log`
- **Retención**: 30 días
- **Contenido**: Logs generales de la aplicación

#### 2. **Logs de Error**
- **Archivo**: `logs/error-YYYY-MM-DD.log`
- **Retención**: 30 días
- **Contenido**: Solo errores y excepciones

#### 3. **Logs de Auditoría**
- **Archivo**: `logs/audit-YYYY-MM-DD.log`
- **Retención**: 90 días
- **Contenido**: Operaciones CRUD automáticas

### Arquitectura del Logging

#### BaseEntityService (Sin Logger)
Para entidades simples que solo necesitan CRUD básico:

```typescript
@Injectable()
export class SimpleService extends BaseEntityService<Entity> {
  constructor(
    @Inject(Repository)
    private readonly repository: Repository<Entity>,
  ) {
    super()
  }
  // Solo operaciones CRUD, logging automático via interceptor
}
```

#### LoggableEntityService (Con Logger)
Para entidades que necesitan logging manual y manejo de errores:

```typescript
@Injectable()
export class ComplexService extends LoggableEntityService<Entity> {
  constructor(
    @Inject(Repository)
    private readonly repository: Repository<Entity>,
    protected readonly logger: WinstonLoggerService,
  ) {
    super(logger)
  }

  async complexOperation() {
    try {
      // Lógica compleja
    } catch (error) {
      await this.handleErrors(error, 'ComplexService', true)
    }
  }
}
```

### Uso del Logger

#### Logging Manual

```typescript
// Inyectar el servicio
constructor(private readonly logger: WinstonLoggerService) {}

// Diferentes niveles
await this.logger.log({ message: 'Operación exitosa', context: 'UserService' })
await this.logger.error({ 
  message: 'Error crítico', 
  context: 'UserService',
  sendEmail: true 
})
await this.logger.warn({ message: 'Advertencia', context: 'UserService' })
await this.logger.debug({ message: 'Debug info', context: 'UserService' })
```

#### Logging Automático

El **AuditInterceptor** registra automáticamente:

- **CREATE**: Operaciones POST
- **UPDATE**: Operaciones PUT/PATCH
- **DELETE**: Operaciones DELETE

```json
{
  "level": "info",
  "message": "AUDIT: CREATE user 123 by admin-456",
  "timestamp": "2025-08-15T10:30:00.000Z",
  "auditData": {
    "operation": "CREATE",
    "entity": "user",
    "id": "123",
    "uid": "admin-456",
    "data": { ... }
  }
}
```

### Notificaciones por Email

Configura diferentes destinatarios por tipo de log:

```bash
MAIL_LOG=logs@empresa.com
MAIL_ERROR=admin@empresa.com
MAIL_WARN=dev@empresa.com
MAIL_DEBUG=debug@empresa.com
MAIL_VERBOSE=verbose@empresa.com
```

---

## 🔐 Sistema de Autenticación

### Características

- **JWT Authentication** con refresh tokens
- **Role-based Authorization** (RBAC)
- **Guards personalizados** para protección de rutas
- **Decoradores** para facilitar la autorización
- **Middleware de autenticación** integrado

### Roles Disponibles

```typescript
export enum ValidRoles {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super-admin',
  USER = 'user',
}
```

### Uso de Decoradores

```typescript
@Controller('users')
export class UserController {
  
  @Post()
  @Auth(ValidRoles.ADMIN)  // Solo admins pueden crear usuarios
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }

  @Get()
  @Auth()  // Usuario autenticado
  findAll(@GetUser() user: User) {
    return this.userService.findAll()
  }

  @Delete(':id')
  @Auth(ValidRoles.SUPER_ADMIN)  // Solo super-admin puede eliminar
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}
```

### Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/check-status` | Verificar token |
| `PATCH` | `/auth/promote` | Promover usuario (roles) |

---

## 🗄️ Base de Datos y Migraciones

### Configuración TypeORM

La aplicación usa TypeORM con PostgreSQL:

```typescript
// config/ormconfig.ts
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PG_DB_HOST,
  port: +process.env.PG_DB_PORT,
  username: process.env.PG_DB_USERNAME,
  password: process.env.PG_DB_PASSWORD,
  database: process.env.PG_DB_NAME,
  autoLoadEntities: true,
  synchronize: false, // NUNCA usar en producción
  logging: process.env.PG_DB_LOGGING === 'true',
}
```

### Entidad Base

Todas las entidades extienden de `EntityBase`:

```typescript
export abstract class EntityBase {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  uid: string  // Usuario que creó el registro

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn({ select: false })
  deletedAt?: Date  // Soft delete
}
```

### Scripts de Base de Datos

```bash
# Generar migración automática
npm run typeorm migration:generate -n nombre-migracion

# Crear migración vacía
npm run db:migration:empty nombre-migracion

# Ejecutar migraciones
npm run db:migrate

# Revertir última migración
npm run db:revert

# Crear migración vacía con generador personalizado
npm run db:createEmpty
```

### Ejemplo de Migración

```typescript
// src/engine/migrations/xxxxx-create-blog-post.ts
export class CreateBlogPost1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'blog_post',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'content', type: 'text' },
          { name: 'uid', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('blog_post')
  }
}
```

---

## 📁 Manejo de Archivos

### Características

- **Procesamiento de imágenes** con Sharp
- **Generación automática de thumbnails**
- **Validación de tamaño y tipo**
- **Almacenamiento organizado** por entidad
- **Optimización WebP** automática

### Configuración

```typescript
// Configuración por entidad
export interface UploadsHandleConfig {
  uploadsPath: string      // Ruta base
  maxFileSize: number      // Tamaño máximo (bytes)
  minWidth?: number        // Ancho mínimo
  minHeight?: number       // Alto mínimo
  thumbsWidth: number      // Ancho thumbnail
  maxWidth: number         // Ancho máximo
  maxHeight: number        // Alto máximo
}
```

### Uso del Servicio

```typescript
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadsService: UploadsHandleService
  ) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('entity') entity: string
  ) {
    const result = await this.uploadsService.handleUpload(file, entity)
    return {
      original: result.fileUploaded,
      thumbnail: result.thumbUploaded
    }
  }

  @Delete('image/:path')
  async deleteImage(@Param('path') imagePath: string) {
    await this.uploadsService.deleteFile(imagePath)
    return { message: 'Imagen eliminada' }
  }
}
```

### Estructura de Archivos

```
static/uploads/
├── users/
│   ├── uuid_1920-1080.webp     # Imagen original optimizada
│   └── uuid_400-300.webp       # Thumbnail
├── products/
│   ├── uuid_1920-1080.webp
│   └── uuid_400-300.webp
└── blogs/
    ├── uuid_1920-1080.webp
    └── uuid_400-300.webp
```

---

## 🛠️ Estructura de Servicios

### Jerarquía de Servicios

#### 1. BaseEntityService
Para servicios simples que solo necesitan CRUD:

```typescript
export abstract class BaseEntityService<T extends EntityBase> {
  protected abstract getRepository(): Repository<T>

  // Métodos CRUD básicos
  async findAll(options?: FindManyOptions<T>) { }
  async findById(id: string) { }
  async create(payload: DeepPartial<T>) { }
  async updateById(id: string, payload: DeepPartial<T>) { }
  async delete(id: string) { }
  // ... más métodos
}
```

#### 2. LoggableEntityService
Para servicios que necesitan logging manual y manejo de errores:

```typescript
export abstract class LoggableEntityService<T extends EntityBase> 
  extends BaseEntityService<T> {
  
  constructor(protected readonly logger: WinstonLoggerService) {
    super()
  }

  protected async handleErrors(error: any, context: string) { }
  protected async handleDBErrors(dberrors: DberrorsDto) { }
}
```

#### 3. BaseService
Para servicios que no son entidades pero necesitan logging:

```typescript
export class BaseService {
  constructor(protected readonly logger: WinstonLoggerService) {}

  protected async handleDBErrors(dberrors: DberrorsDto) { }
}
```

### Cuándo Usar Cada Servicio

| Servicio | Uso | Ejemplo |
|----------|-----|---------|
| `BaseEntityService` | CRUD simple, sin logging manual | ProductService, CategoryService |
| `LoggableEntityService` | CRUD + logging manual + manejo de errores | UserService, OrderService |
| `BaseService` | Servicios sin entidad pero con logging | AuthService, EmailService |

### Ejemplo Completo

```typescript
// Servicio simple
@Injectable()
export class ProductService extends BaseEntityService<Product> {
  constructor(
    @Inject(ProductRepository)
    private readonly repository: ProductRepository,
  ) {
    super()
  }

  protected getRepository() {
    return this.repository
  }
}

// Servicio con logging
@Injectable()
export class OrderService extends LoggableEntityService<Order> {
  constructor(
    @Inject(OrderRepository)
    private readonly repository: OrderRepository,
    protected readonly logger: WinstonLoggerService,
  ) {
    super(logger)
  }

  protected getRepository() {
    return this.repository
  }

  async processPayment(orderId: string) {
    try {
      // Lógica compleja de pago
      await this.logger.log({
        message: `Payment processed for order ${orderId}`,
        context: 'OrderService'
      })
    } catch (error) {
      await this.handleErrors(error, 'OrderService', true)
    }
  }
}
```

---

## 📚 API Documentation

### Swagger/OpenAPI

La documentación se genera automáticamente y está disponible en:
- **URL**: `http://localhost:3001/api`
- **JSON**: `http://localhost:3001/api-json`

### Configuración Swagger

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Boilerplate API')
  .setDescription('API documentation for the NestJS boilerplate')
  .setVersion('1.0')
  .addBearerAuth()
  .build()

const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api', app, document)
```

### Decoradores de Documentación

Los DTOs ya incluyen decoradores de Swagger:

```typescript
export class CreateUserDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'Contraseña del usuario',
    minLength: 8,
  })
  @MinLength(8)
  password: string
}
```

---

## 🚀 Scripts Disponibles

### Desarrollo

```bash
npm run start:dev      # Modo desarrollo con hot reload
npm run start:debug    # Modo debug
npm run build         # Compilar para producción
npm run start:prod    # Ejecutar en producción
```

### Base de Datos

```bash
npm run typeorm migration:generate -n <name>  # Generar migración
npm run db:migrate                            # Ejecutar migraciones
npm run db:revert                            # Revertir migración
npm run db:createEmpty                       # Migración vacía personalizada
```

### Generadores

```bash
npm run create-engine <entity-name>  # Generar entidad completa
```

### Calidad de Código

```bash
npm run lint          # Ejecutar ESLint
npm run format        # Formatear con Prettier
```

---

## ✨ Mejores Prácticas

### 1. Nomenclatura

- **Entidades**: PascalCase (`User`, `BlogPost`)
- **Archivos**: kebab-case (`user.service.ts`, `blog-post.entity.ts`)
- **Variables**: camelCase (`userService`, `blogPost`)
- **Constantes**: UPPER_SNAKE_CASE (`USER_REPOSITORY`)
- **Tablas DB**: snake_case (`users`, `blog_posts`)

### 2. Estructura de Módulos

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [EntityController],
  providers: [
    EntityService,
    ...entityProviders,
  ],
  exports: [EntityService],
})
export class EntityModule {}
```

### 3. Manejo de Errores

- Usar `LoggableEntityService` para servicios que necesitan manejo de errores
- Siempre loggear errores críticos con `sendEmail: true`
- Usar códigos de error consistentes
- Proporcionar mensajes de error claros al usuario

### 4. Validación

- Usar `class-validator` en todos los DTOs
- Validar en el punto de entrada (DTOs)
- Usar `ValidationPipe` global
- Sanitizar datos de entrada

### 5. Seguridad

- **Nunca** hardcodear secretos
- Usar variables de entorno para configuración
- Validar y sanitizar todas las entradas
- Implementar rate limiting en producción
- Usar HTTPS en producción

### 6. Base de Datos

- **Nunca** usar `synchronize: true` en producción
- Usar migraciones para cambios de esquema
- Implementar índices apropiados
- Usar soft delete por defecto

### 7. Logging

- Usar contexto descriptivo en todos los logs
- Loggear operaciones importantes
- Configurar retención apropiada de logs
- Monitorear logs de error activamente

---

## 🎯 Workflow Típico

### Crear Nueva Funcionalidad

1. **Generar código base**:
   ```bash
   npm run create-engine my-entity
   ```

2. **Personalizar entidad**:
   ```typescript
   // Agregar campos específicos
   @Column({ type: 'varchar', length: 255 })
   customField: string
   ```

3. **Generar migración**:
   ```bash
   npm run typeorm migration:generate -n my-entity
   ```

4. **Ejecutar migración**:
   ```bash
   npm run db:migrate
   ```

5. **Personalizar lógica de negocio**:
   - Agregar validaciones en DTOs
   - Implementar lógica específica en servicios
   - Personalizar endpoints en controladores

6. **Probar funcionalidad**:
   - Usar Swagger UI para probar endpoints
   - Verificar logs de auditoría
   - Validar permisos de usuario

### Despliegue

1. **Preparar producción**:
   ```bash
   npm run build
   ```

2. **Configurar variables de entorno** de producción

3. **Ejecutar migraciones**:
   ```bash
   npm run db:migrate
   ```

4. **Iniciar aplicación**:
   ```bash
   npm run start:prod
   ```

---

## 📞 Soporte

Para soporte y contribuciones:

- **Autores**: Hernán Molinari - Gastón Rodríguez
- **Documentación**: Este manual
- **Swagger**: `http://localhost:3001/api`

---

**¡Happy Coding! 🚀**