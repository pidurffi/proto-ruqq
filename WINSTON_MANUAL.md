# 📋 Manual de Winston Logger - Guía Completa

## 🎯 Introducción

Este manual documenta la implementación de **Winston Logger** en nuestro proyecto NestJS, incluyendo logging automático, auditoría y notificaciones por email.

## 📁 Arquitectura del Sistema

### Estructura de Archivos
```
src/common/
├── services/
│   └── winston-logger.service.ts    # Servicio principal de Winston
├── interceptors/
│   └── audit.interceptor.ts         # Interceptor para auditoría automática
├── mailer/
│   ├── mailer.service.ts           # Servicio de envío de emails
│   ├── mailer.controller.ts        # Controlador para testing de emails
│   └── sendmail.dto.ts             # DTO para estructura de emails
└── index.ts                        # Exports del módulo común

logs/
├── app-YYYY-MM-DD.log              # Logs generales (INFO, WARN, DEBUG)
├── audit-YYYY-MM-DD.log            # Logs de auditoría (CREATE, UPDATE, DELETE)
├── error-YYYY-MM-DD.log            # Solo errores (ERROR level)
└── .{hash}-audit.json              # Metadata de control de Winston
```

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
# Configuración del entorno
ENVIRONMENT=development

# Configuración del mailer
MAILER_HOST=smtp.gmail.com
MAILER_PORT=587
MAILER_SECURE=true
MAILER_USER=your-email@gmail.com
MAILER_PASS=your-app-password

# Configuración de emails de notificación de Winston
MAIL_ERROR=admin@example.com        # Emails de errores críticos
MAIL_LOG=logs@example.com          # Emails de logs generales
MAIL_WARN=warnings@example.com     # Emails de advertencias
MAIL_DEBUG=debug@example.com       # Emails de debug
MAIL_VERBOSE=verbose@example.com   # Emails de información detallada
```

### Configuración de Winston
```typescript
// winston-logger.service.ts - Configuración automática
new winston.transports.DailyRotateFile({
  filename: 'logs/app-%DATE%.log',     // Logs generales
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',                     // Retención: 30 días
})

new winston.transports.DailyRotateFile({
  filename: 'logs/error-%DATE%.log',   // Solo errores
  level: 'error',
  maxFiles: '30d',
})

new winston.transports.DailyRotateFile({
  filename: 'logs/audit-%DATE%.log',   // Solo auditoría
  maxFiles: '90d',                     // Retención: 90 días (más tiempo)
  level: 'info'
})
```

## 🚀 Uso Básico

### Inyección del Servicio
```typescript
import { WinstonLoggerService } from '../common'

@Injectable()
export class MyService {
  constructor(
    private readonly logger: WinstonLoggerService,
  ) {}
}
```

### Métodos Disponibles

#### 1. **Log General (INFO)**
```typescript
await this.logger.log({
  message: 'Usuario creado exitosamente',
  context: 'UserService',
  sendEmail: false,  // opcional, default: false
})
```

#### 2. **Error (ERROR)**
```typescript
await this.logger.error({
  message: 'Error al conectar con la base de datos',
  context: 'DatabaseService',
  stack: error.stack,     // opcional
  sendEmail: true,        // ENVÍA EMAIL si es crítico
})
```

#### 3. **Advertencia (WARN)**
```typescript
await this.logger.warn({
  message: 'Conexión lenta detectada',
  context: 'NetworkService',
  sendEmail: false,
})
```

#### 4. **Debug (DEBUG)**
```typescript
await this.logger.debug({
  message: 'Procesando datos de usuario',
  context: 'UserProcessor',
  sendEmail: false,
})
```

#### 5. **Información Detallada (VERBOSE)**
```typescript
await this.logger.verbose({
  message: 'Detalles de la operación completa',
  context: 'DetailedService',
  sendEmail: false,
})
```

#### 6. **Auditoría Automática**
```typescript
// Este método es llamado automáticamente por el interceptor
// NO lo uses manualmente en servicios
this.logger.audit('CREATE', 'user', userId, currentUserId, userData)
```

## 📧 Sistema de Notificaciones por Email

### Cuándo se Envían Emails

Los emails se envían **ÚNICAMENTE** cuando se establece `sendEmail: true` en cualquier método de logging.

### Configuración de Recipients

Los destinatarios se configuran por **tipo de log**:
- `MAIL_ERROR` → emails de `.error()`
- `MAIL_LOG` → emails de `.log()`
- `MAIL_WARN` → emails de `.warn()`
- `MAIL_DEBUG` → emails de `.debug()`
- `MAIL_VERBOSE` → emails de `.verbose()`

### Formato del Email
```
Subject: [ENVIRONMENT][LOG_TYPE] fecha
Body: mensaje del log
```

Ejemplo:
```
Subject: [PRODUCTION][ERROR] Wed Aug 14 2025 18:30:45 GMT-0300
Body: Error al conectar con la base de datos
```

## 🔍 Ejemplos Prácticos

### Ejemplo 1: Error Crítico con Email
```typescript
@Injectable()
export class PaymentService {
  constructor(private readonly logger: WinstonLoggerService) {}

  async processPayment(amount: number, userId: string) {
    try {
      // Lógica de procesamiento
      const result = await this.chargeCard(amount)
      
      // Log de éxito (sin email)
      await this.logger.log({
        message: `Pago procesado exitosamente: $${amount} para usuario ${userId}`,
        context: 'PaymentService',
        sendEmail: false,
      })
      
      return result
    } catch (error) {
      // Error crítico - ENVÍA EMAIL
      await this.logger.error({
        message: `PAGO FALLIDO: $${amount} para usuario ${userId} - ${error.message}`,
        context: 'PaymentService',
        stack: error.stack,
        sendEmail: true,  // ← CRITICAL: Envía email al admin
      })
      
      throw new BadRequestException('Error procesando pago')
    }
  }
}
```

### Ejemplo 2: Monitoreo de Performance
```typescript
@Injectable()
export class DatabaseService {
  constructor(private readonly logger: WinstonLoggerService) {}

  async executeQuery(query: string) {
    const startTime = Date.now()
    
    try {
      const result = await this.database.query(query)
      const duration = Date.now() - startTime
      
      if (duration > 5000) {
        // Query lenta - Enviar alerta
        await this.logger.warn({
          message: `Query lenta detectada: ${duration}ms - ${query}`,
          context: 'DatabaseService',
          sendEmail: true,  // ← Notificar al equipo de performance
        })
      } else {
        // Log normal de debug
        await this.logger.debug({
          message: `Query ejecutada en ${duration}ms`,
          context: 'DatabaseService',
          sendEmail: false,
        })
      }
      
      return result
    } catch (error) {
      await this.logger.error({
        message: `Error en query: ${query} - ${error.message}`,
        context: 'DatabaseService',
        stack: error.stack,
        sendEmail: true,  // ← Error de BD es crítico
      })
      throw error
    }
  }
}
```

### Ejemplo 3: Autenticación y Seguridad
```typescript
@Injectable()
export class AuthService {
  constructor(private readonly logger: WinstonLoggerService) {}

  async login(email: string, password: string, ip: string) {
    try {
      const user = await this.findUserByEmail(email)
      
      if (!user) {
        // Intento de login con usuario inexistente - ALERTA DE SEGURIDAD
        await this.logger.error({
          message: `Intento de login con email inexistente: ${email} desde IP: ${ip}`,
          context: 'AuthService',
          sendEmail: true,  // ← SECURITY: Posible ataque
        })
        throw new UnauthorizedException('Credenciales inválidas')
      }
      
      if (!bcrypt.compareSync(password, user.password)) {
        // Password incorrecto - ALERTA DE SEGURIDAD
        await this.logger.error({
          message: `Password incorrecto para ${email} desde IP: ${ip}`,
          context: 'AuthService',
          sendEmail: true,  // ← SECURITY: Posible ataque de fuerza bruta
        })
        throw new UnauthorizedException('Credenciales inválidas')
      }
      
      // Login exitoso
      await this.logger.log({
        message: `Login exitoso: ${email} desde IP: ${ip}`,
        context: 'AuthService',
        sendEmail: false,  // Login normal, no necesita email
      })
      
      return this.generateJWT(user)
    } catch (error) {
      // Error inesperado en el sistema de autenticación
      await this.logger.error({
        message: `Error crítico en autenticación: ${error.message}`,
        context: 'AuthService',
        stack: error.stack,
        sendEmail: true,  // ← CRITICAL: Fallo del sistema de auth
      })
      throw error
    }
  }
}
```

### Ejemplo 4: Monitoreo de Recursos
```typescript
@Injectable()
export class SystemMonitoringService {
  constructor(private readonly logger: WinstonLoggerService) {}

  @Cron('*/5 * * * *') // Cada 5 minutos
  async checkSystemHealth() {
    const memoryUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    
    // Memory usage normal
    if (heapUsedMB < 500) {
      await this.logger.debug({
        message: `Memoria en uso: ${heapUsedMB}MB`,
        context: 'SystemMonitoring',
        sendEmail: false,
      })
    }
    // Memory usage high
    else if (heapUsedMB < 800) {
      await this.logger.warn({
        message: `Uso de memoria elevado: ${heapUsedMB}MB`,
        context: 'SystemMonitoring',
        sendEmail: false,  // Warning, pero no crítico aún
      })
    }
    // Memory usage critical
    else {
      await this.logger.error({
        message: `MEMORIA CRÍTICA: ${heapUsedMB}MB - Posible memory leak`,
        context: 'SystemMonitoring',
        sendEmail: true,  // ← CRITICAL: Alerta inmediata
      })
    }
  }
}
```

## 🤖 Auditoría Automática

### Interceptor de Auditoría

El sistema incluye un **interceptor automático** que registra todas las operaciones CRUD:

```typescript
// Se ejecuta automáticamente en:
POST   /api/users     → CREATE user {id} by {userId}
PUT    /api/users/123 → UPDATE user 123 by {userId}  
PATCH  /api/users/123 → UPDATE user 123 by {userId}
DELETE /api/users/123 → DELETE user 123 by {userId}
```

### Logs de Auditoría Generados

```json
{
  "auditData": {
    "operation": "CREATE",
    "entity": "user", 
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "uid": "987fcdeb-51f2-43d1-8b7a-123456789abc",
    "timestamp": "2025-08-14T21:30:00.000Z",
    "data": { "name": "Juan Pérez", "email": "juan@example.com" }
  },
  "level": "info",
  "message": "AUDIT: CREATE user 123e4567-e89b-12d3-a456-426614174000 by 987fcdeb-51f2-43d1-8b7a-123456789abc",
  "timestamp": "2025-08-14T21:30:00.000Z"
}
```

## 📁 Gestión de Archivos de Log

### Archivos Generados

1. **`app-YYYY-MM-DD.log`** - Todos los logs (INFO, WARN, DEBUG, VERBOSE)
2. **`audit-YYYY-MM-DD.log`** - Solo auditoría (operaciones CRUD)
3. **`error-YYYY-MM-DD.log`** - Solo errores (ERROR level)
4. **`.{hash}-audit.json`** - Metadatos de control de Winston

### Rotación Automática

- **Rotación**: Diaria (nuevo archivo cada día)
- **Tamaño máximo**: 20MB por archivo
- **Retención**: 30 días (90 días para auditoría)
- **Limpieza**: Automática de archivos antiguos

### Mantenimiento

```bash
# Ver logs en tiempo real
tail -f logs/app-$(date +%Y-%m-%d).log

# Buscar errores del día
grep "ERROR" logs/app-$(date +%Y-%m-%d).log

# Limpiar logs de desarrollo (seguro)
rm logs/*.log logs/.*.json

# .gitignore recomendado
echo "logs/" >> .gitignore
echo "*.log" >> .gitignore
echo ".*.json" >> .gitignore
```

## 🔧 Configuración de Desarrollo vs Producción

### Desarrollo
```typescript
// En desarrollo - logs verbose, sin emails críticos
if (process.env.NODE_ENV === 'development') {
  await this.logger.debug({
    message: 'Información detallada de debug',
    context: 'DevService',
    sendEmail: false,  // ← No spam en desarrollo
  })
}
```

### Producción
```typescript
// En producción - solo logs importantes, emails críticos
if (process.env.NODE_ENV === 'production') {
  await this.logger.error({
    message: 'Error crítico en producción',
    context: 'ProdService',
    sendEmail: true,  // ← Alerta inmediata en producción
  })
}
```

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)

1. **Usa contextos descriptivos**: `'UserService'`, `'PaymentProcessor'`
2. **Incluye información relevante**: IDs, amounts, user info
3. **Usa el nivel correcto**: ERROR para fallos, WARN para alertas, INFO para eventos
4. **Envía emails solo para eventos críticos**: Errores de seguridad, fallos de pago, etc.
5. **Incluye stack traces en errores**: `stack: error.stack`
6. **Usa await con métodos de logging**: Son operaciones async

### ❌ DON'T (No hacer)

1. **No logees información sensible**: Passwords, tokens, datos personales
2. **No envíes emails para logs normales**: Solo para eventos críticos
3. **No uses logging síncrono**: Siempre `await` los métodos
4. **No logues en loops intensivos**: Puede degradar performance
5. **No olvides el contexto**: Siempre incluye de dónde viene el log

### 📝 Ejemplo de Context Descriptivo

```typescript
// ❌ Mal - contexto genérico
await this.logger.error({
  message: 'Error',
  context: 'Service',
})

// ✅ Bien - contexto específico
await this.logger.error({
  message: `Error procesando pago ${paymentId} para usuario ${userId}: ${error.message}`,
  context: 'PaymentService.processPayment',
  stack: error.stack,
})
```

## 🐛 Troubleshooting

### Problema: No se generan logs
```bash
# Verificar permisos de carpeta
chmod 755 logs/

# Verificar que existe la carpeta
mkdir -p logs
```

### Problema: No se envían emails
```bash
# Verificar variables de entorno
echo $MAIL_ERROR
echo $MAILER_HOST

# Verificar configuración del mailer en .env
```

### Problema: Archivos de log muy grandes
```typescript
// Ajustar configuración en winston-logger.service.ts
maxSize: '10m',  // Reducir de 20m a 10m
maxFiles: '15d', // Reducir retención
```

## 📚 Referencias

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Daily Rotate File](https://github.com/winstonjs/winston-daily-rotate-file)
- [NestJS Logger](https://docs.nestjs.com/techniques/logger)

---

**Última actualización**: Agosto 2025  
**Versión**: 1.0  
**Mantenedor**: Equipo de Desarrollo