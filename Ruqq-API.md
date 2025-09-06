# 🏨 Ruqq - Sistema Integral de Gestión Hotelera y Motor de Precios v2.3

## 🎯 Resumen Ejecutivo

**Ruqq** es un sistema integral de gestión hotelera y generación de presupuestos construido sobre **NestJS**, **PostgreSQL** y **TypeORM**. El sistema implementa un **Motor de Precios v2.3** revolucionario con precios diferenciados por día de la semana, estrategias de split inteligente, y un sistema de capas que elimina la fragmentación innecesaria de períodos tarifarios.

### 🏗️ Arquitectura General
- **Framework**: NestJS 11.x con TypeScript en modo estricto
- **Base de Datos**: PostgreSQL con estrategia de nomenclatura snake_case
- **ORM**: TypeORM 0.3.25 con repositorios personalizados
- **Autenticación**: JWT con control de acceso basado en roles (RBAC)
- **Patrones**: Domain-Driven Design, SOLID, Repository Pattern, Strategy Pattern

---

## 🏗️ Arquitectura del Motor de Precios v2.3

### **Modelo de Capas Implementado**

```mermaid
graph TD
    A[Tarifa Base - base_rate_period] --> B[Reglas de Precio - price_rules]
    B --> C[Precio Final por Noche]
    
    A1[Capa 1: Lienzo Base] --> B1[Capa 2: Overrides/Calcomanías]
    B1 --> C1[Resultado: Precio Calculado]
```

- **🎨 Capa 1**: `base_rate_period` - **Tarifa Base**
  - Actúa como el precio "por defecto" para rangos largos
  - Es el lienzo sobre el que trabajamos
  - Maneja períodos extensos sin fragmentar
  - **Split Strategy**: División inteligente de períodos solapados

- **⚡ Capa 2**: `price_rules` - **Reglas de Precio** 
  - Son "overrides" que se aplican bajo condiciones específicas
  - Como "calcomanías" que modifican el precio final
  - Manejan excepciones por días de la semana
  - **Consolidación automática** de reglas consecutivas idénticas

---

## 📊 Modelo de Datos Completo

### **Sistema de Gestión de Cotizaciones y Templates**

Ruqq incluye un sistema completo de gestión de cotizaciones formateadas que combina el motor de precios con plantillas personalizables para generar presupuestos listos para enviar.

### **Entidad Base: `EntityBase`**
Todas las entidades del sistema extienden esta clase base:
```typescript
abstract class EntityBase {
  @PrimaryGeneratedColumn('uuid')
  id: string                    // UUID como clave primaria

  @Column({ type: 'uuid' })
  uid: string                   // Usuario que creó/modificó

  @DeleteDateColumn()
  deletedAt?: Date             // Soft delete

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()  
  updatedAt: Date
}
```

### **Entidad: `RoomType` (Tipos de Habitación)**
```typescript
@Entity({ name: 'room_type' })
export class RoomType extends EntityBase {
  @Column({ length: 255 })
  name: string                  // "Suite Deluxe", "Habitación Doble"

  @Column({ length: 50, unique: true })
  code: string                  // "STE_DLX", "HAB_DBL" 

  @Column({ type: 'int' })
  totalInventory: number        // Habitaciones físicas disponibles

  @Column({ type: 'int' })
  baseCapacity: number          // Capacidad base (ej: 2 personas)

  @Column({ type: 'int' })
  maxCapacity: number           // Capacidad máxima (ej: 4 personas)

  // Relaciones
  @OneToMany(() => BaseRatePeriod, period => period.roomType)
  baseRatePeriods: BaseRatePeriod[]

  @OneToMany(() => PriceRule, rule => rule.roomType)
  priceRules: PriceRule[]
}
```

### **Entidad: `BaseRatePeriod` (Capa 1 - Tarifa Base)**
```typescript
@Entity({ name: 'base_rate_period' })
export class BaseRatePeriod extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date               // Fecha inicio del período

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date                 // Fecha fin del período

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2 
  })
  price: number                 // Precio base por noche

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType

  @OneToMany(() => OccupancyRateModifier, modifier => modifier.baseRatePeriod)
  occupancyModifiers: OccupancyRateModifier[]
}
```

### **Entidad: `PriceRule` (Capa 2 - Reglas de Precio)**
```typescript
@Entity({ name: 'price_rules' })
export class PriceRule extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date

  @Column({ 
    type: 'int', 
    array: true,
    name: 'days_of_week',
    comment: 'ISO 8601: Lunes=1, Martes=2, ..., Domingo=7'
  })
  daysOfWeek: number[]

  @Column({ 
    type: 'int',
    default: 0,
    comment: 'Para resolver conflictos. Mayor número = mayor prioridad'
  })
  priority: number

  @Column({ 
    type: 'enum', 
    enum: AdjustmentType,
    name: 'adjustment_type'
  })
  adjustmentType: AdjustmentType

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    name: 'adjustment_value'
  })
  adjustmentValue: number

  @Column({ 
    type: 'varchar', 
    nullable: true, 
    name: 'promotion_name',
    comment: 'Nombre de la promoción (opcional, para diferenciación semántica en frontend)'
  })
  promotionName?: string

  @Column({ 
    type: 'varchar', 
    nullable: true, 
    name: 'promotion_description',
    comment: 'Descripción de la promoción (opcional, para contexto adicional)'
  })
  promotionDescription?: string

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
```

### **Entidad: `OccupancyRateModifier` (Modificadores de Ocupación)**
```typescript
@Entity({ name: 'occupancy_rate_modifiers' })
export class OccupancyRateModifier extends EntityBase {
  @Column({ type: 'uuid', name: 'base_rate_period_id' })
  baseRatePeriodId: string

  @Column({ 
    type: 'enum',
    enum: ModifierType,
    name: 'modifier_type' 
  })
  modifierType: 'fixed' | 'percentage'

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'modifier_value'
  })
  modifierValue: number        // Valor del modificador por huésped extra

  @ManyToOne(() => BaseRatePeriod)
  @JoinColumn({ name: 'base_rate_period_id' })
  baseRatePeriod: BaseRatePeriod
}
```

### **Entidad: `ContentBlock` (Bloques de Contenido Reutilizables)**
```typescript
@Entity({ name: 'content_block' })
export class ContentBlock extends EntityBase {
  @Column({ length: 255 })
  name: string                    // Nombre interno del bloque

  @Column({ type: 'text' })
  content: string                // Contenido de texto del bloque

  @Column({ 
    type: 'enum',
    enum: ContentBlockType,
    default: ContentBlockType.GENERAL_INFO
  })
  type: ContentBlockType         // Tipo de contenido

  // Relaciones
  @OneToMany(() => QuoteTemplateBlock, block => block.contentBlock)
  templateBlocks: QuoteTemplateBlock[]
}

export enum ContentBlockType {
  GREETING = 'greeting',
  SERVICES = 'services',
  TERMS = 'terms',
  CANCELLATION_POLICY = 'cancellation_policy',
  FOOTER = 'footer',
  GENERAL_INFO = 'general_info'
}
```

### **Entidad: `QuoteTemplate` (Plantillas de Cotización)**
```typescript
@Entity({ name: 'quote_template' })
export class QuoteTemplate extends EntityBase {
  @Column({ length: 255 })
  name: string                    // "Presupuesto Estándar WhatsApp"

  @Column({ default: false })
  isDefault: boolean             // Marca plantilla por defecto

  // Relaciones
  @OneToMany(() => QuoteTemplateBlock, block => block.quoteTemplate)
  templateBlocks: QuoteTemplateBlock[]
}
```

### **Entidad: `QuoteTemplateBlock` (Estructura de Plantillas)**
```typescript
@Entity({ name: 'quote_template_block' })
export class QuoteTemplateBlock extends EntityBase {
  @Column({ type: 'uuid', name: 'quote_template_id' })
  quoteTemplateId: string

  @Column({ type: 'uuid', name: 'content_block_id' })
  contentBlockId: string

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder: number              // Orden del bloque en la plantilla

  @ManyToOne(() => QuoteTemplate)
  @JoinColumn({ name: 'quote_template_id' })
  quoteTemplate: QuoteTemplate

  @ManyToOne(() => ContentBlock)
  @JoinColumn({ name: 'content_block_id' })
  contentBlock: ContentBlock
}
```

### **Entidad: `Restrictions` (Restricciones de Reserva)**
```typescript
@Entity({ name: 'restrictions' })
export class Restrictions extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date

  @Column({ 
    type: 'int',
    name: 'min_length_of_stay',
    nullable: true 
  })
  minLengthOfStay?: number     // Mínimo de noches

  @Column({ 
    type: 'int',
    name: 'max_length_of_stay',
    nullable: true 
  })
  maxLengthOfStay?: number     // Máximo de noches

  @Column({ 
    type: 'boolean',
    name: 'closed_to_arrival',
    default: false 
  })
  closedToArrival: boolean     // No permite check-in

  @Column({ 
    type: 'boolean',
    name: 'closed_to_departure',
    default: false 
  })
  closedToDeparture: boolean   // No permite check-out

  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
```

### **Enum: `AdjustmentType`**
```typescript
export enum AdjustmentType {
  FIXED_PRICE = 'fixed_price',     // Precio fijo final
  FIXED_AMOUNT = 'fixed_amount',   // Suma/resta cantidad
  PERCENTAGE = 'percentage'        // Porcentaje sobre base
}
```

---

## 🧮 Algoritmo de Cálculo - Noche por Noche v2.3

### **Algoritmo Principal Implementado en `QuotesService`**

```typescript
/**
 * ALGORITMO POR NOCHE v2.3:
 * 1. Obtener precio base de base_rate_period
 * 2. Aplicar modificador de ocupación para huéspedes extra
 * 3. Buscar y aplicar price_rule (override) si existe para día específico
 * 4. Validar restricciones (min/max stay, arrival/departure)
 * 5. Calcular precio final de la noche
 * 6. Agrupar noches consecutivas con mismo precio en segmentos
 */
private async calculateNightlyPrices(
  roomType: RoomType,
  checkIn: string,
  checkOut: string, 
  pax: number
): Promise<QuoteSegmentDto[]>
```

### **Flujo de Procesamiento Detallado**

#### **1. 🌙 Iteración Noche por Noche**
```typescript
// CRÍTICO: Uso de fechas locales para evitar desfase por zona horaria GMT-3
let currentDate = new Date(checkIn)
const checkOutDate = new Date(checkOut)

while (currentDate < checkOutDate) {
  const dateString = currentDate.toISOString().split('T')[0]
  const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay()
  
  // Procesar noche individual...
  currentDate.setDate(currentDate.getDate() + 1)  // Avanzar día (NO UTC)
}
```

#### **2. 💰 Obtención del Precio Base**
```typescript
const basePrice = await this.baseRatePeriodRepository
  .createQueryBuilder('brp')
  .where('brp.roomTypeId = :roomTypeId', { roomTypeId })
  .andWhere('brp.startDate <= :date', { date: dateString })
  .andWhere('brp.endDate >= :date', { date: dateString })
  .getOne()
```

#### **3. 👥 Aplicación de Modificador de Ocupación**
```typescript
private async applyOccupancyAdjustment(
  roomType: RoomType,
  periodId: string,
  basePrice: number,
  pax: number
): Promise<number> {
  if (pax <= roomType.baseCapacity) return basePrice

  const extraGuests = pax - roomType.baseCapacity
  const modifier = await this.getOccupancyModifier(periodId)
  
  if (!modifier) return basePrice

  if (modifier.modifierType === 'fixed') {
    return basePrice + (modifier.modifierValue * extraGuests)
  } else {
    return basePrice * (1 + (modifier.modifierValue * extraGuests / 100))
  }
}
```

#### **4. ⚡ Aplicación de Regla de Precio (Override)**
```typescript
const priceRule = await this.priceRulesService.findApplicableRule(
  roomType.id, 
  currentDate
)

let finalPrice = occupancyAdjustedPrice

if (priceRule) {
  finalPrice = this.priceRulesService.calculateAdjustedPrice(
    occupancyAdjustedPrice, 
    priceRule
  )
}
```

#### **5. 🛡️ Validación de Restricciones**
```typescript
const restrictions = await this.getRestrictionsForDate(roomType.id, dateRange)

// Validar llegada
if (isFirstNight && restrictions?.closedToArrival) {
  return { available: false, reason: 'CLOSED_TO_ARRIVAL' }
}

// Validar salida  
if (isLastNight && restrictions?.closedToDeparture) {
  return { available: false, reason: 'CLOSED_TO_DEPARTURE' }
}

// Validar duración de estadía
const stayLength = this.calculateStayLength(checkIn, checkOut)
if (restrictions?.minLengthOfStay && stayLength < restrictions.minLengthOfStay) {
  return { available: false, reason: 'MIN_STAY_NOT_MET' }
}
```

#### **6. 📊 Agrupación Inteligente en Segmentos**
```typescript
// Agrupar noches consecutivas con mismo precio
const segments: QuoteSegmentDto[] = []
let currentSegment = null

for (const night of nightlyPrices) {
  if (!currentSegment || currentSegment.pricePerNight !== night.finalPrice) {
    // Iniciar nuevo segmento
    currentSegment = {
      startDate: night.date,
      endDate: night.date,
      nights: 1,
      pricePerNight: night.finalPrice,
      totalPrice: night.finalPrice
    }
    segments.push(currentSegment)
  } else {
    // Extender segmento existente
    currentSegment.endDate = night.date
    currentSegment.nights++
    currentSegment.totalPrice += night.finalPrice
  }
}
```

---

## 🤖 Estrategias de Split y Optimización

### **BaseRatePeriodService - Split Inteligente**

#### **Algoritmo de Split para Períodos Base**
```typescript
/**
 * ESTRATEGIA DE SPLIT INTELIGENTE:
 * - Solo modifica segmentos donde el precio realmente cambia
 * - Analiza cada período solapado para determinar qué partes necesitan cambio
 * - Evita splits innecesarios cuando el precio ya es igual
 * - Aplica consolidación automática después del split
 */
private async splitRateForPeriod(
  createDto: BaseRatePeriodCreateDto,
  uid: string,
  queryRunner: QueryRunner
): Promise<BaseRatePeriod[]>
```

#### **Lógica de Consolidación Automática**
```typescript
/**
 * Consolida períodos consecutivos con el mismo precio para evitar fragmentación.
 * 
 * Ejemplo: 
 * [1/1-10/1 $100] + [11/1-20/1 $100] + [21/1-31/1 $100] = [1/1-31/1 $100]
 */
private async consolidateConsecutivePeriods(
  roomTypeId: string,
  queryRunner: QueryRunner
): Promise<BaseRatePeriod[]>
```

### **PriceRulesService - Split para Reglas de Precio**

#### **Comparación Multi-Campo para Reglas**
```typescript
/**
 * Verifica si dos reglas son idénticas en TODOS los campos relevantes:
 * - roomTypeId, daysOfWeek, priority, adjustmentType, adjustmentValue
 */
private areRulesIdentical(rule1: PriceRule, rule2: PriceRule): boolean {
  return (
    rule1.roomTypeId === rule2.roomTypeId &&
    rule1.priority === rule2.priority &&
    rule1.adjustmentType === rule2.adjustmentType &&
    Number(rule1.adjustmentValue) === Number(rule2.adjustmentValue) &&
    JSON.stringify(rule1.daysOfWeek.sort()) === JSON.stringify(rule2.daysOfWeek.sort())
  )
}
```

#### **Split Inteligente Considerando Días de la Semana**
```typescript
/**
 * Para que NO se haga SPLIT: TODOS los campos deben ser iguales
 * Para CONSOLIDACIÓN: Reglas idénticas con períodos consecutivos
 * Para SPLIT: Solapamiento con diferencias en cualquier campo
 */
private async splitRuleForPeriod(
  createDto: CreatePriceRuleDto,
  uid: string,
  queryRunner: QueryRunner
): Promise<PriceRule[]>
```

---

## 🎯 Lógica de Decisión Inteligente - CalendarService

### **Regla de Oro: Todos los Días vs Días Específicos**

```typescript
/**
 * CalendarService - Orchestrator de Alto Nivel
 * 
 * LÓGICA DE DECISIÓN AUTOMÁTICA:
 * - Si daysOfWeek.length === 7: Modificar base_rate_period
 * - Si daysOfWeek.length < 7: Crear price_rules
 */
@Injectable()
export class CalendarService {
  async bulkEdit(bulkEditDto: CalendarBulkEditDto, uid: string) {
    const { daysOfWeek } = bulkEditDto

    if (daysOfWeek.length === 7) {
      // TODOS LOS DÍAS: Modificar tarifa base fundamental
      // TODO: Integrar con BaseRatePeriodService para modificar tarifa base
      throw new Error('Edición masiva para todos los días (modificar base_rate_period) no implementada aún')
    } else {
      // DÍAS ESPECÍFICOS: Crear reglas de precio (overrides)
      return await this.priceRulesService.applyBulkPriceEdit(bulkEditDto, uid)
    }
  }
}
```

### **Ejemplos de Decisión Automática**

| Días Seleccionados | Acción del Sistema | Razón |
|---|---|---|
| `[1,2,3,4,5,6,7]` | Modificar `base_rate_period` | Cambio fundamental de tarifa |
| `[6,7]` | Crear `price_rules` | Excepción de fin de semana |
| `[2,3,4]` | Crear `price_rules` | Promoción entre semana |
| `[1]` | Crear `price_rules` | Oferta especial de lunes |

---

## 🔐 Sistema de Autenticación y Autorización

### **Entidad: `User`**
```typescript
@Entity({ name: 'users' })
export class User extends EntityBase {
  @Column({ length: 255 })
  firstName: string

  @Column({ length: 255 })  
  lastName: string

  @Column({ unique: true })
  email: string

  @Column({ select: false })
  password: string              // Hash bcrypt (10 rounds)

  @Column({ 
    type: 'enum',
    enum: ValidRoles,
    array: true,
    default: [ValidRoles.USER]
  })
  roles: ValidRoles[]

  @Column({ default: true })
  isActive: boolean

  // Métodos de validación
  checkFieldsToUpdate(updateUserDto: UpdateUserDto): void
  
  static hashPassword(password: string): string
}
```

### **Enum: `ValidRoles`**
```typescript
export enum ValidRoles {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin', 
  USER = 'user'
}
```

### **Guards y Decoradores**
```typescript
// Protección de rutas
@RoleProtected(ValidRoles.SUPER_ADMIN)
@UseGuards(AuthGuard(), UserRoleGuard)

// Obtener usuario autenticado
@GetUser() user: User

// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload
    const user = await this.userRepository.findByIdOrFail(id)
    
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive')
    }
    
    return user
  }
}
```

---

## 🔗 API Endpoints Completos

### **🎯 Endpoint Principal: Edición de Calendario (Recomendado)**
```http
POST /admin/calendar/bulk-edit
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "roomTypeIds": ["uuid-1", "uuid-2", "uuid-3"],
  "startDate": "2024-03-01",
  "endDate": "2024-03-31", 
  "daysOfWeek": [6, 7],
  "adjustmentType": "percentage",
  "adjustmentValue": 25.0
}
```

**Respuesta:**
```json
{
  "action": "price_rules_created",
  "result": [/* reglas de precio creadas con split aplicado */],
  "summary": {
    "roomTypesAffected": 3,
    "daysSelected": [6, 7],
    "dateRange": {
      "startDate": "2024-03-01",
      "endDate": "2024-03-31"
    }
  }
}
```

### **📊 Endpoint Principal: Matriz de Precios (NUEVO)**
```http
POST /admin/price-matrix/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Respuesta: Matriz Completa con Estadísticas**
```json
{
  "startDate": "2025-01-01",
  "endDate": "2025-01-31", 
  "dateHeaders": ["2025-01-01", "2025-01-02", "2025-01-03", "..."],
  "rows": [
    {
      "roomType": {
        "id": "uuid-suite-premium",
        "name": "Suite Premium",
        "code": "STE_PREM",
        "baseCapacity": 2,
        "maxCapacity": 4
      },
      "prices": [
        {
          "date": "2025-01-01",
          "price": 350.00,
          "available": true,
          "source": "price_rule",
          "appliedRuleId": "rule-weekend-boost"
        },
        {
          "date": "2025-01-02", 
          "price": 280.00,
          "available": true,
          "source": "base_rate"
        }
      ],
      "averagePrice": 312.50,
      "minPrice": 280.00,
      "maxPrice": 450.00
    }
  ],
  "summary": {
    "totalRoomTypes": 5,
    "totalDays": 31,
    "averagePriceAcrossAll": 325.75,
    "priceRange": {
      "min": 150.00,
      "max": 500.00
    }
  }
}
```

**🎯 Características Clave:**
- **Motor v2.3 Completo**: Aplica `base_rate_period` + `price_rules` 
- **Arquitectura Extensible**: Preparado para futuras promociones
- **Estadísticas Integradas**: Min/Max/Promedio por fila y globales
- **Source Tracking**: Identifica qué regla aplicó (`base_rate`, `price_rule`, `promotion`)
- **Visualización Optimizada**: Estructura ideal para frontend (filas=unidades, columnas=fechas)

### **📝 Endpoint Principal: Generación de Cotizaciones Formateadas**
```http
POST /quote-generator/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "pax": 2,
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-18",
  "templateId": "uuid-template-whatsapp"
}
```

**Respuesta:**
```json
{
  "formattedQuote": "¡Hola! Gracias por contactarnos.\n\nPresupuesto para su estadía:\n\n🏨 Suite Deluxe\nCheck-in: 15/03/2024\nCheck-out: 18/03/2024\nHuéspedes: 2\n\nDetalles de precio:\n- 15/03 al 16/03: $12,000 por noche (2 noches)\n- 17/03: $15,000 por noche\n\nTOTAL: $39,000\n\nServicios incluidos:\n- Desayuno buffet\n- Wi-Fi\n- Acceso al spa\n\nPolítica de cancelación...\n\n¡Esperamos su confirmación!",
  "templateName": "Presupuesto Estándar WhatsApp"
}
```

### **💰 Endpoint Principal: Cálculo de Cotizaciones (Motor de Precios)**
```http
POST /quotes/calculate
Content-Type: application/json

{
  "pax": 2,
  "checkInDate": "2024-03-15",
  "checkOutDate": "2024-03-18"
}
```

**Respuesta:**
```json
{
  "available": [
    {
      "roomType": {
        "id": "uuid-room-type",
        "name": "Suite Deluxe",
        "code": "STE_DLX",
        "baseCapacity": 2,
        "maxCapacity": 4
      },
      "segments": [
        {
          "startDate": "2024-03-15",
          "endDate": "2024-03-16", 
          "nights": 2,
          "pricePerNight": 12000,
          "totalPrice": 24000
        },
        {
          "startDate": "2024-03-17",
          "endDate": "2024-03-17",
          "nights": 1, 
          "pricePerNight": 15000,
          "totalPrice": 15000
        }
      ],
      "totalPrice": 39000,
      "totalNights": 3
    }
  ],
  "unavailable": [
    {
      "roomType": {
        "id": "uuid-room-type-2",
        "name": "Habitación Doble"
      },
      "reason": "MIN_STAY_NOT_MET",
      "details": "Mínimo 4 noches requeridas"
    }
  ]
}
```

### **📄 Endpoints de Gestión de Contenido y Templates**

#### **Gestión de Bloques de Contenido**
```http
GET /content-block                    # Listar bloques con paginación
GET /content-block/:id                # Obtener bloque específico
POST /content-block                   # Crear nuevo bloque (SUPER_ADMIN)
PATCH /content-block/:id              # Actualizar bloque (SUPER_ADMIN)
DELETE /content-block/:id             # Eliminar bloque (SUPER_ADMIN)
```

#### **Gestión de Plantillas**
```http
GET /quote-template                   # Listar plantillas
GET /quote-template/:id               # Obtener plantilla específica
POST /quote-template                  # Crear plantilla (SUPER_ADMIN)
PATCH /quote-template/:id             # Actualizar plantilla (SUPER_ADMIN)
DELETE /quote-template/:id            # Eliminar plantilla (SUPER_ADMIN)
```

#### **Estructura de Plantillas (Orden de Bloques)**
```http
GET /quote-template-block             # Listar asociaciones
POST /quote-template-block            # Vincular bloque a plantilla
PATCH /quote-template-block/:id       # Cambiar orden
DELETE /quote-template-block/:id      # Desvincular bloque
```

### **⚙️ Endpoints de Gestión de Tarifas Base**

#### **Crear/Actualizar Períodos Base (con Split)**
```http
POST /admin/base-rate-period
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "roomTypeId": "uuid-room-type",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "price": 10000
}
```

#### **Listar Períodos Base con Filtros**
```http
GET /admin/base-rate-period?page=0&pageSize=10&roomTypeId=uuid&startDate=2024-01-01&endDate=2024-12-31
```

### **📊 Endpoints de Matriz de Precios**

#### **Generar Matriz Completa**
```http
POST /admin/price-matrix/generate
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "startDate": "2025-01-01", 
  "endDate": "2025-01-31"
}
```

**Casos de Uso:**
- 📈 **Dashboard Administrativo**: Visualización completa de precios
- 🎯 **Revenue Management**: Análisis de estrategias de precios
- 📊 **Reportes Gerenciales**: Estadísticas y tendencias de pricing
- 🔍 **Debugging del Motor v2.3**: Verificar aplicación de reglas

**Validaciones:**
- ✅ Rango máximo: 365 días (evita sobrecarga)
- ✅ Fecha inicio < fecha fin
- ✅ Solo SUPER_ADMIN tiene acceso

### **⚡ Endpoints de Reglas de Precio**

#### **Crear Regla Individual (con Split)**
```http
POST /admin/price-rules
Content-Type: application/json

{
  "roomTypeId": "uuid-del-room-type",
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "daysOfWeek": [6, 7],
  "priority": 1,
  "adjustmentType": "percentage", 
  "adjustmentValue": 25.0,
  "promotionName": "Fin de Semana Premium",
  "promotionDescription": "25% incremento en fines de semana"
}
```

#### **Crear Reglas Masivas (con Split)**
```http
POST /admin/price-rules/bulk
Content-Type: application/json

{
  "roomTypeIds": ["uuid-1", "uuid-2", "uuid-3"],
  "startDate": "2024-03-01",
  "endDate": "2024-03-31", 
  "daysOfWeek": [6, 7],
  "adjustmentType": "percentage",
  "adjustmentValue": 25.0,
  "priority": 0,
  "promotionName": "Descuento Primavera 2024",
  "promotionDescription": "25% descuento en múltiples tipos de habitación"
}
```

#### **Filtrar Solo Promociones**
```http
GET /admin/price-rules?promotionsOnly=true&page=0&pageSize=10
Authorization: Bearer <jwt-token>

# Respuesta: Solo price-rules que tienen promotionName definido
```

### **🔍 Preview de Cambios**
```http
POST /admin/calendar/bulk-edit/preview
Content-Type: application/json

{
  "roomTypeIds": ["uuid-1", "uuid-2"],
  "startDate": "2024-03-01",
  "endDate": "2024-03-31",
  "daysOfWeek": [6, 7],
  "adjustmentType": "percentage",
  "adjustmentValue": 25.0
}
```

### **🏨 Endpoints de Gestión de Room Types**
```http
GET /admin/room-types                    # Listar tipos de habitación
POST /admin/room-types                   # Crear nuevo tipo
PUT /admin/room-types/{id}              # Actualizar tipo
DELETE /admin/room-types/{id}           # Eliminar tipo
```

### **🔐 Endpoints de Autenticación**
```http
POST /auth/login                        # Login con email/password
POST /auth/register                     # Registro de usuario
GET /auth/check-status                  # Validar token JWT
```

---

## 🛠️ Implementación Técnica Avanzada

### **Patrón de Repositorios Personalizados**

#### **🚨 CRÍTICO: NO usar `@InjectRepository()`**

```typescript
// ✅ PATRÓN CORRECTO - Repositorios Personalizados
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
  
  // Métodos de consulta personalizados
  async findByFiltersPaginated(payload: QueryDto): Promise<PaginatedResult<SomeEntity>>
}

// ✅ Inyección en Services
@Injectable()
export class SomeService {
  constructor(
    @Inject(SomeEntityRepository)  // Inyectar la CLASE directamente
    private readonly repository: SomeEntityRepository,
  ) {}
}

// ✅ Configuración del Module  
@Module({
  imports: [ConfigModule, DatabaseModule, CommonModule],
  providers: [...SomeEntityProviders, SomeEntityRepository, SomeService],
  controllers: [SomeEntityController],
  exports: [SomeEntityService, SomeEntityRepository]
})
```

#### **Provider Pattern**
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

### **Sistema de Generación de Código**

#### **Comando de Generación**
```bash
npm run create-engine <entity-name>
```

#### **Estructura Generada Automáticamente**
```
src/resources/entity-name/
├── controllers/                    # REST endpoints con decoradores Swagger
│   └── entity-name.controller.ts  
├── services/                      # Lógica de negocio y validaciones
│   └── entity-name.service.ts     
├── entities/                      # Definición TypeORM con relaciones
│   └── entity-name.entity.ts      
├── dto/                          # DTOs de request/response con validaciones
│   ├── entity-name-create.dto.ts
│   ├── entity-name-update.dto.ts
│   ├── entity-name-query.dto.ts
│   └── index.ts
├── repositories/                  # Patrón repository personalizado
│   └── entity-name.repository.ts
├── providers/                     # Configuración de inyección
│   └── entity-name.providers.ts
└── entity-name.module.ts         # Módulo NestJS con imports/exports
```

#### **Integración Automática**
- Actualiza `app.module.ts` con import del nuevo módulo
- Genera migraciones TypeORM automáticamente
- Configura rutas RESTful completas  
- Incluye documentación Swagger/OpenAPI

### **🚨 Manejo Crítico de Fechas (GMT-3 Argentina)**

#### **Patrón CORRECTO para DTOs**
```typescript
@ApiProperty({
  description: 'Fecha de inicio del período',
  example: '2024-01-01'
})
@IsDateString()
@IsNotEmpty()
startDate: Date  // ← Tipo Date, NO string
```

#### **Patrón CORRECTO para Iteraciones**
```typescript
// ✅ CORRECTO - Sin zona horaria para evitar desfase
let currentDate = new Date(checkIn)
const checkOutDate = new Date(checkOut)

while (currentDate < checkOutDate) {
  const dateString = currentDate.toISOString().split('T')[0]
  const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay()
  
  // Avanzar al siguiente día (LOCAL, no UTC)
  currentDate.setDate(currentDate.getDate() + 1)
}

// ❌ INCORRECTO - Causa desfase por GMT-3
let currentDate = new Date(checkIn + 'T00:00:00.000Z')  // ← Problemático
currentDate.setUTCDate(currentDate.getUTCDate() + 1)    // ← Desfase
```

### **Configuración de Base de Datos**

#### **TypeORM Config**
```typescript
// ormconfig.ts
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.PG_DB_HOST || 'localhost',
  port: parseInt(process.env.PG_DB_PORT) || 5432,
  username: process.env.PG_DB_USERNAME,
  password: process.env.PG_DB_PASSWORD,
  database: process.env.PG_DB_NAME,
  synchronize: false,  // ⚠️ NUNCA true en producción
  logging: process.env.PG_DB_LOGGING === 'true',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../engine/migrations/**/*{.ts,.js}'],
  namingStrategy: new SnakeNamingStrategy(),
}
```

#### **Estrategia de Migraciones**
```bash
# Generar migración automática
npm run db:migration:generate -- -n DescripcionCambio

# Ejecutar migraciones pendientes
npm run db:migrate

# Revertir última migración
npm run db:revert

# Crear migración vacía
npm run db:createEmpty -- NombreMigracion
```

---

## 💡 Casos de Uso Prácticos

### **🎉 Fin de Semana Premium (+25%)**
```json
{
  "roomTypeIds": ["uuid-suite-deluxe", "uuid-habitacion-doble"],
  "startDate": "2024-01-01", 
  "endDate": "2024-12-31",
  "daysOfWeek": [6, 7],
  "adjustmentType": "percentage",
  "adjustmentValue": 25.0,
  "promotionName": "Premium Weekend",
  "promotionDescription": "Incremento de fin de semana para suites y habitaciones dobles"
}
```
**Resultado**: Todos los sábados y domingos del año tendrán 25% de incremento sobre el precio base.

### **💸 Promoción Entre Semana (-$1,000)**
```json
{
  "roomTypeIds": ["uuid-suite-deluxe"],
  "startDate": "2024-03-01",
  "endDate": "2024-03-31", 
  "daysOfWeek": [2, 3, 4],
  "adjustmentType": "fixed_amount", 
  "adjustmentValue": -1000.0,
  "promotionName": "Descuento Entre Semana Marzo",
  "promotionDescription": "Promoción especial para aumentar ocupación entre semana"
}
```
**Resultado**: Martes, miércoles y jueves de marzo tienen $1,000 de descuento.

### **🔥 Ofertas de Temporada Alta (Precio Fijo)**
```json
{
  "roomTypeIds": ["uuid-standard-room"],
  "startDate": "2024-12-20",
  "endDate": "2024-12-31",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "adjustmentType": "fixed_price",
  "adjustmentValue": 18000.0,
  "promotionName": "Fin de Año 2024",
  "promotionDescription": "Precio especial fijo para últimas dos semanas del año"
}
```
**Resultado**: Toda la última semana de diciembre tiene precio fijo de $18,000 por noche.

### **⚡ Gestión de Restricciones**
```json
{
  "roomTypeId": "uuid-presidential-suite",
  "startDate": "2024-08-01",
  "endDate": "2024-08-31",
  "minLengthOfStay": 3,
  "closedToArrival": false,
  "closedToDeparture": false
}
```
**Resultado**: Suite presidencial requiere mínimo 3 noches en agosto.

---

## 📈 Arquitectura de Módulos y Servicios

### **Módulos Principales**

```
src/
├── engine/                        # Infraestructura del sistema
│   ├── auth/                     # Autenticación JWT y RBAC
│   ├── database/                 # Configuración PostgreSQL y constantes
│   ├── code-generator/           # Sistema de generación automática
│   └── migrations/               # Migraciones de base de datos
├── common/                       # Utilidades compartidas
│   ├── controllers/              # BaseController con CRUD genérico
│   ├── entities/                 # EntityBase abstracta
│   ├── services/                 # BaseEntityService genérico y TenantService
│   ├── middleware/               # TenantMiddleware para multi-tenancy
│   ├── interfaces/               # ITenantContext, ITenantService
│   ├── enums/                    # Enums del dominio (AdjustmentType, etc)
│   ├── interceptors/             # Interceptores de respuesta
│   └── mailer/                   # Sistema de emails con templates
├── resources/                    # Módulos de dominio
│   ├── quotes/                   # 🎯 Motor de Cotizaciones (cálculo de precios)
│   ├── quote-generator/          # 📝 Generador de Cotizaciones Formateadas
│   ├── quote-template/           # 📋 Gestión de Plantillas
│   ├── quote-template-block/     # 🔗 Estructura de Plantillas
│   ├── content-block/            # 📄 Bloques de Contenido Reutilizables
│   ├── base-rate-period/         # 🎨 Tarifas Base (Capa 1)
│   ├── price-rules/              # ⚡ Reglas de Precio (Capa 2)
│   ├── price-matrix/             # 📊 Matriz de Precios
│   ├── calendar/                 # 📅 Orchestrador de Alto Nivel
│   ├── room-type/                # 🏨 Gestión de Tipos de Habitación
│   ├── occupancy-rate-modifier/  # 👥 Modificadores por Ocupación
│   └── restrictions/             # 🛡️ Restricciones de Reserva
└── config/                       # Configuraciones del sistema
    ├── ormconfig.ts              # Configuración TypeORM
    └── mailer.config.ts          # Configuración de correo
```

### **Servicios Clave y Responsabilidades**

#### **QuotesService** - Motor de Cotizaciones
```typescript
@Injectable()
export class QuotesService {
  // Método principal público
  async calculateQuote(calculateQuoteDto: CalculateQuoteDto): Promise<QuoteResponseDto>
  
  // Algoritmo de cálculo por noche
  private async calculateNightlyPrices(...): Promise<QuoteSegmentDto[]>
  
  // Aplicación de modificadores de ocupación
  private async applyOccupancyAdjustment(...): Promise<number>
  
  // Validación de restricciones
  private async validateRestrictions(...): Promise<RestrictionValidationResult>
  
  // Agrupación de noches en segmentos
  private groupConsecutiveNights(...): QuoteSegmentDto[]
}
```

#### **BaseRatePeriodService** - Gestión de Tarifas Base
```typescript
@Injectable()
export class BaseRatePeriodService extends BaseEntityService<BaseRatePeriod> {
  // Creación con split inteligente
  async createBaseRatePeriod(createDto: BaseRatePeriodCreateDto, uid: string): Promise<BaseRatePeriod[]>
  
  // Estrategia de split para períodos solapados
  private async splitRateForPeriod(...): Promise<BaseRatePeriod[]>
  
  // Consolidación automática de períodos consecutivos idénticos
  private async consolidateConsecutivePeriods(...): Promise<BaseRatePeriod[]>
  
  // Utilidades de manejo de fechas
  private addDays(dateString: string, days: number): string
  private subtractDays(dateString: string, days: number): string
}
```

#### **PriceRulesService** - Gestión de Reglas de Precio
```typescript
@Injectable() 
export class PriceRulesService extends BaseEntityService<PriceRule> {
  // Creación con split considerando días de la semana
  async createPriceRule(createDto: CreatePriceRuleDto, uid: string): Promise<PriceRule[]>
  
  // Split inteligente para reglas de precio
  private async splitRuleForPeriod(...): Promise<PriceRule[]>
  
  // Consolidación de reglas consecutivas idénticas
  private async consolidateConsecutiveRules(...): Promise<PriceRule[]>
  
  // Verificación de identidad completa entre reglas
  private areRulesIdentical(rule1: PriceRule, rule2: PriceRule): boolean
  
  // Búsqueda de regla aplicable por fecha
  async findApplicableRule(roomTypeId: string, date: Date): Promise<PriceRule | null>
  
  // Cálculo de precio ajustado según tipo de regla
  calculateAdjustedPrice(basePrice: number, rule: PriceRule): number
}
```

#### **QuoteGeneratorService** - Generador de Cotizaciones Formateadas
```typescript
@Injectable()
export class QuoteGeneratorService {
  // Generación de cotización formateada con plantilla
  async generateQuote(dto: QuoteGeneratorRequestDto): Promise<QuoteGeneratorResponseDto>
  
  // Obtención de plantilla con bloques ordenados
  private async getTemplateWithBlocks(templateId: string): Promise<QuoteTemplate>
  
  // Formateo de precios calculados
  private formatPricingData(quoteResponse: QuoteResponseDto): string
  
  // Ensamblaje de contenido final
  private assembleFormattedQuote(template: QuoteTemplate, pricingData: string): string
}
```

#### **CalendarService** - Orchestrador Inteligente
```typescript
@Injectable()
export class CalendarService {
  // Punto de entrada principal para edición masiva
  async bulkEdit(bulkEditDto: CalendarBulkEditDto, uid: string)
  
  // Preview de cambios sin aplicar
  async previewBulkEdit(bulkEditDto: CalendarBulkEditDto): Promise<PreviewResult>
}
```

---

## 🔧 Herramientas de Desarrollo

### **Comandos NPM Disponibles**
```bash
# Desarrollo
npm run start:dev                 # Servidor con hot-reload
npm run start:debug              # Servidor con debug habilitado
npm run build                    # Compilar para producción

# Base de Datos
npm run db:migrate               # Ejecutar migraciones
npm run db:revert                # Revertir migración
npm run db:migration:generate -- -n Nombre   # Generar migración
npm run db:createEmpty -- Nombre            # Crear migración vacía

# Generación de Código
npm run create-engine <nombre>   # Generar módulo CRUD completo

# Calidad de Código
npm run lint                     # ESLint con auto-corrección
npm run format                   # Prettier formatting
npm run typecheck               # Verificación de tipos TypeScript

# Docker
docker-compose up -d             # Levantar PostgreSQL
```

### **Variables de Entorno**
```bash
# Base de datos
PG_DB_HOST=localhost
PG_DB_PORT=5432
PG_DB_NAME=ruqq_local
PG_DB_USERNAME=ruqq_local
PG_DB_PASSWORD="password"
PG_DB_SYNCHRONIZE=false
PG_DB_LOGGING=false

# Aplicación
PORT=3001
HOST_API=http://localhost:3001/api
ENVIRONMENT=local

# Seguridad
JWT_SECRET=secret_key_here
CORS_WHITE_LIST=http://localhost:4200

# Email (Winston Logger + Mailer)
MAILER_HOST=smtp.provider.com
MAILER_PORT=465
MAILER_SECURE=true
MAILER_USER=user@domain.com
MAILER_PASS=password
```

---

## 🚀 Beneficios del Sistema

### **🎯 Para el Negocio**
- **Flexibilidad Total**: Precios por día sin restricciones
- **Menos Fragmentación**: Split inteligente evita períodos innecesarios
- **Gestión Centralizada**: Una sola interfaz para todas las operaciones
- **Estrategias Complejas**: Combinación de reglas con prioridades
- **Transparencia de Precios**: El usuario ve exactamente cómo se calcula cada precio
- **Control Granular**: Cada día puede tener su precio específico

### **⚡ Para el Desarrollo**
- **Performance Optimizada**: Cálculo eficiente noche por noche
- **Arquitectura Escalable**: Fácil agregar nuevos tipos de ajuste
- **Código Limpio**: Principios SOLID y DDD implementados
- **Testing Friendly**: Lógica separada en servicios testables
- **Generación Automática**: Sistema de scaffolding completo
- **Patrones Consistentes**: Repository pattern y dependency injection unificados

### **👨‍💼 Para el Usuario Final**
- **Transparencia Total**: Ve exactamente cómo se calcula cada precio
- **UX Mejorada**: Segmentos agrupados automáticamente
- **Menos Confusión**: Reglas claras y comprensibles
- **Control Granular**: Cada día puede tener su precio específico
- **Feedback Inmediato**: Disponibilidad y precios en tiempo real
- **Gestión Intuitiva**: APIs RESTful con documentación Swagger

---

## 🧪 Testing y Validación

### **Arquitectura de Testing**
```typescript
// Ejemplo de test para QuotesService
describe('QuotesService', () => {
  let service: QuotesService
  let baseRatePeriodRepository: jest.Mocked<BaseRatePeriodRepository>
  let priceRulesService: jest.Mocked<PriceRulesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: BaseRatePeriodRepository,
          useValue: createMockRepository()
        },
        {
          provide: PriceRulesService, 
          useValue: createMockService()
        }
      ],
    }).compile()

    service = module.get<QuotesService>(QuotesService)
  })

  describe('calculateQuote', () => {
    it('should calculate correct price with base rate only', async () => {
      // Test implementation
    })
    
    it('should apply price rules correctly', async () => {
      // Test implementation  
    })
    
    it('should handle occupancy modifiers', async () => {
      // Test implementation
    })
  })
})
```

### **Testing Matriz de Precios**
```typescript
// Ejemplo de test para PriceMatrixService
describe('PriceMatrixService', () => {
  let service: PriceMatrixService
  let baseRatePeriodRepository: jest.Mocked<BaseRatePeriodRepository>
  let priceRulesService: jest.Mocked<PriceRulesService>

  describe('generatePriceMatrix', () => {
    it('should generate complete price matrix with statistics', async () => {
      // Mock room types and date range
      const result = await service.generatePriceMatrix({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      })
      
      expect(result.rows).toHaveLength(5) // 5 room types
      expect(result.dateHeaders).toHaveLength(31) // 31 days
      expect(result.summary.totalRoomTypes).toBe(5)
    })
    
    it('should apply Motor v2.3 layers correctly', async () => {
      // Test base_rate + price_rules integration
    })
    
    it('should handle date range validation', async () => {
      // Test max 365 days limit
    })
  })
})
```

### **Casos de Prueba Recomendados**

#### **1. 📊 Cálculo de Precios**
- ✅ Noche con solo precio base
- ✅ Noche con regla de precio aplicada
- ✅ Múltiples reglas con prioridades
- ✅ Modificadores de ocupación
- ✅ Combinación de todos los factores

#### **2. 🔄 Agrupación de Segmentos**
- ✅ Noches consecutivas mismo precio
- ✅ Cambio de precio en medio de estadía
- ✅ Múltiples segmentos por estadía
- ✅ Segmento único para toda la estadía

#### **3. ⚡ Lógica de Split**
- ✅ Split de períodos base solapados
- ✅ Split de reglas de precio solapadas
- ✅ Consolidación automática
- ✅ Casos edge con fechas límite

#### **4. 🛡️ Validación de Restricciones**
- ✅ Mínimo de noches requeridas
- ✅ Máximo de noches permitidas
- ✅ Closed to arrival/departure
- ✅ Capacidad de habitaciones

#### **5. 📊 Testing Matriz de Precios**
- ✅ Generación completa de matriz
- ✅ Aplicación correcta del Motor v2.3
- ✅ Estadísticas por fila y globales
- ✅ Validación de rangos de fecha (máx 365 días)
- ✅ Source tracking (base_rate vs price_rule)
- ✅ Manejo de room types sin tarifas

#### **6. 🌐 Timezone Handling**
- ✅ Fechas en GMT-3 (Argentina)
- ✅ Cálculo de días de la semana correctos
- ✅ Iteración sin desfase de fechas

---

## 📈 Roadmap y Evolución

### **Funcionalidades Completadas**
- ✅ Motor de precios v2.3 con cálculo noche por noche
- ✅ Split inteligente para base_rate_period y price_rules
- ✅ Consolidación automática de períodos/reglas consecutivas
- ✅ Sistema de reglas de precio por días de la semana
- ✅ **Sistema de promociones integrado** (campos `promotionName` y `promotionDescription`)
- ✅ **Diferenciación semántica** en frontend (price-rules vs promociones)
- ✅ **Filtrado de promociones** con parámetro `promotionsOnly`
- ✅ Modificadores de ocupación dinámicos
- ✅ Restricciones de reserva (min/max stay, closed dates)
- ✅ **Sistema completo de gestión de cotizaciones formateadas**
- ✅ **Plantillas de cotización personalizables con bloques reutilizables**
- ✅ **Generador de cotizaciones que combina precios con plantillas**
- ✅ API RESTful completa con documentación Swagger
- ✅ Sistema de autenticación JWT con RBAC
- ✅ Generador automático de módulos CRUD
- ✅ Manejo seguro de fechas (timezone GMT-3)
- ✅ **Sistema multi-tenant** completo con aislamiento por schemas

### **Próximas Funcionalidades**
- 🔄 Integración completa con BaseRatePeriodService para casos de 7 días
- 📊 Dashboard de visualización de reglas activas y promociones
- 🎯 Sistema de templates para reglas/promociones frecuentes  
- 📱 Notificaciones de conflictos de reglas
- 🧮 Simulador avanzado de precios con múltiples escenarios
- 📈 Analytics de revenue e impacto de promociones
- 🔍 Motor de búsqueda avanzada de disponibilidad
- 💰 **Sistema de promociones avanzadas** (códigos de descuento, límites de uso)
- 🎨 **Generador visual de promociones** para frontend Angular
- 📧 **Envío automático de cotizaciones por email con plantillas**
- 🌐 **Plantillas multi-idioma para mercados internacionales**
- 📊 **Tracking de conversión de cotizaciones a reservas**

### **Optimizaciones Futuras**
- 🚀 Cache Redis para consultas frecuentes de tarifas
- 📊 Métricas de performance del algoritmo de cálculo
- 🔍 Índices optimizados en base de datos
- 📈 Analytics en tiempo real de revenue y ocupación
- 🤖 Machine Learning para predicción de demanda
- 🌐 Multi-tenant architecture para múltiples hoteles
- 📱 API GraphQL para queries complejas
- 🔒 Audit log completo de cambios de precios

---

## 🎉 Conclusión

**Ruqq** representa un sistema integral de gestión hotelera de clase empresarial que combina un motor de precios avanzado, arquitectura escalable y excelentes prácticas de desarrollo. El **Motor de Precios v2.3** implementa algoritmos sofisticados de cálculo noche por noche, estrategias de split inteligente y consolidación automática que eliminan la fragmentación innecesaria.

### **Fortalezas Clave del Sistema**

#### **🏗️ Arquitectura Robusta**
- **Domain-Driven Design** con separación clara de responsabilidades
- **SOLID Principles** aplicados consistentemente
- **Repository Pattern** personalizado sin dependencias de TypeORM
- **Strategy Pattern** para diferentes tipos de ajustes de precio
- **Dependency Injection** limpia y testeable

#### **⚡ Motor de Precios Avanzado**
- **Cálculo noche por noche** para máxima precisión
- **Sistema de capas** (base rates + price rules) 
- **Split inteligente** que evita fragmentación innecesaria
- **Consolidación automática** de períodos/reglas consecutivas
- **Manejo seguro de zonas horarias** (GMT-3 Argentina)

#### **🔧 Excelencia Técnica**
- **TypeScript estricto** con tipado completo
- **Generación automática de código** con CLI personalizado
- **Migraciones de base de datos** versionadas
- **Documentación automática** con Swagger/OpenAPI
- **Patrón de configuración** flexible por entornos

#### **🎯 Funcionalidad de Negocio**
- **Precios dinámicos por día de la semana**
- **Modificadores de ocupación** para huéspedes extra
- **Sistema de restricciones** (min/max stay, closed dates)
- **Prioridades en reglas** para resolución de conflictos
- **Transparencia total** en cálculo de precios

### **Impacto y Beneficios**

La arquitectura de capas implementada no solo resuelve el problema inmediato de precios dinámicos por días de la semana, sino que establece las bases sólidas para futuras innovaciones en sistemas de revenue management hotelero.

El sistema está **listo para producción** con:
- Manejo robusto de errores y validaciones
- Seguridad empresarial con JWT y RBAC  
- Performance optimizada para consultas complejas
- Escalabilidad horizontal mediante arquitectura modular
- Mantenibilidad excepcional con código autodocumentado

**¡Ruqq es la plataforma definitiva para gestión hotelera moderna! 🚀**

---

## 🌐 Sistema Multi-Tenant

### **Resumen Ejecutivo**
Ruqq implementa un sistema multi-tenant completo utilizando PostgreSQL schemas separados por cliente/hotel, permitiendo aislamiento total de datos mientras se mantiene una única instancia de la aplicación. El sistema está **completamente operativo** con todos los módulos usando repositorios tenant-aware.

### **Arquitectura Multi-Tenant**

#### **Stack Tecnológico**
```
┌─────────────────┐
│ Nginx (Proxy)   │ → Procesa subdominios y añade headers
└─────────────────┘
         │ X-Tenant-ID
┌─────────────────┐
│ TenantMiddleware│ → Establece contexto de tenant por request
└─────────────────┘
         │ ITenantContext  
┌─────────────────┐
│ NestJS App      │ → APIs con contexto tenant-aware
└─────────────────┘
         │ Schema dinámico
┌─────────────────┐
│ PostgreSQL      │ → Schemas: public, tenant_cliente1, tenant_hotel_abc
└─────────────────┘
```

### **Componentes Implementados**

#### **1. Interfaces y Servicios Base**

##### **ITenantContext Interface**
```typescript
export interface ITenantContext {
  tenantId: string
  schema: string
}

export interface ITenant {
  getTenantContext(): ITenantContext | null
  setTenantContext(context: ITenantContext): void
}
```

##### **TenantService**
```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantService implements ITenant {
  private tenantContext: ITenantContext | null = null

  getTenantContext(): ITenantContext | null {
    return this.tenantContext
  }

  setTenantContext(context: ITenantContext): void {
    this.tenantContext = context
    console.log(`[TenantService] Context set:`, context)
  }

  getActiveTenant(): ITenantContext {
    return this.tenantContext || { tenantId: 'default', schema: 'public' }
  }

  async ensureSchemaExists(schemaName: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      const exists = await this.schemaExists(queryRunner, schemaName)
      
      if (!exists) {
        await queryRunner.query(`SELECT create_tenant_schema('${schemaName}')`)
        console.log(`[TenantService] Created schema: ${schemaName}`)
      }
    } finally {
      await queryRunner.release()
    }
  }
}
```

#### **2. Middleware de Detección**

##### **TenantMiddleware**
```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    @Inject(TenantService) private readonly tenantService: TenantService,
  ) {}

  use(req: Request & { tenant?: ITenantContext }, res: Response, next: NextFunction) {
    let tenantId = 'default'
    let detectedFrom = 'default'

    // Prioridad 1: Header X-Tenant-ID
    const headerTenantId = req.headers['x-tenant-id'] as string
    if (headerTenantId) {
      tenantId = headerTenantId
      detectedFrom = 'header'
      console.log(`[TenantMiddleware] Using tenant from X-Tenant-ID header: ${tenantId}`)
    }

    // Prioridad 2: Subdominio
    if (tenantId === 'default') {
      const host = req.headers.host || ''
      const subdomain = host.split('.')[0]
      
      if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
        tenantId = `tenant_${subdomain.replace(/-/g, '_')}`
        detectedFrom = 'subdomain'
        console.log(`[TenantMiddleware] Using tenant from subdomain: ${tenantId}`)
      }
    }

    // Establecer contexto
    const tenantContext: ITenantContext = {
      tenantId,
      schema: tenantId === 'default' ? 'public' : tenantId
    }

    this.tenantService.setTenantContext(tenantContext)
    req.tenant = tenantContext

    console.log(`[TenantMiddleware] Set tenant context:`, tenantContext)
    
    next()
  }
}
```

#### **3. Base de Datos Multi-Schema**

##### **Migración PostgreSQL**
```sql
-- Función para crear nuevo tenant
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Crear schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', tenant_id);
  
  -- Clonar estructura del schema public
  PERFORM clone_schema_structure('public', tenant_id);
  
  -- Registrar en log
  INSERT INTO public.tenant_creation_log (tenant_id, status)
  VALUES (tenant_id, 'active');
  
  RETURN format('Tenant schema %s created successfully', tenant_id);
END;
$$ LANGUAGE plpgsql;

-- Función para clonar estructura
CREATE OR REPLACE FUNCTION clone_schema_structure(source_schema TEXT, target_schema TEXT)
RETURNS void AS $$
DECLARE
  object_record RECORD;
  create_statement TEXT;
BEGIN
  -- Clonar tablas
  FOR object_record IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = source_schema
    AND table_type = 'BASE TABLE'
    AND table_name NOT IN ('typeorm_metadata', 'tenant_creation_log')
  LOOP
    create_statement := format('CREATE TABLE %I.%I (LIKE %I.%I INCLUDING ALL)',
      target_schema, object_record.table_name,
      source_schema, object_record.table_name);
    EXECUTE create_statement;
  END LOOP;
  
  -- Clonar índices, constraints, etc.
  -- [código adicional de clonado]
END;
$$ LANGUAGE plpgsql;
```

##### **Tabla de Control de Tenants**
```sql
CREATE TABLE IF NOT EXISTS public.tenant_creation_log (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  metadata JSONB
);
```

#### **4. Repositorios Tenant-Aware**

##### **Factory de Repositorios Multi-Tenant**
```typescript
export function createTenantRepositoryProvider<T>(
  repositoryToken: string,
  entityClass: Type<T>
): Provider {
  return {
    provide: repositoryToken,
    useFactory: async (
      tenantService: TenantService,
      dataSource: DataSource
    ) => {
      // Crear proxy que intercepta operaciones del repositorio
      return createTenantAwareRepository(dataSource, tenantService, entityClass)
    },
    inject: [TenantService, resources.DATA_SOURCE_POSTGRES],
  }
}
```

##### **Repositorio con Proxy Pattern**
```typescript
function createTenantAwareRepository(dataSource: DataSource, tenantService: TenantService, Entity: any) {
  return new Proxy(dataSource.getRepository(Entity), {
    get(target, prop, receiver) {
      // Interceptar métodos de consulta
      if (typeof target[prop] === 'function' && 
          ['find', 'findOne', 'findBy', 'findOneBy', 'save', 'create', 'update', 'delete', 'remove', 'createQueryBuilder'].includes(prop as string)) {
        
        return function(...args: any[]) {
          const tenantContext = tenantService.getActiveTenant()
          console.log(`[TenantRepository] Executing ${String(prop)} on schema: ${tenantContext.schema}`)
          
          // Para schema public, usar comportamiento por defecto
          if (tenantContext.schema === 'public') {
            return target[prop].apply(target, args)
          }
          
          // Para createQueryBuilder, cambiar el schema
          if (prop === 'createQueryBuilder') {
            const queryBuilder = target.createQueryBuilder.apply(target, args)
            const tableName = target.metadata.tableName
            queryBuilder.from(`${tenantContext.schema}.${tableName}`, args[0] || tableName)
            return queryBuilder
          }
          
          // Para otros métodos, crear QueryRunner con schema específico
          return dataSource.transaction(async manager => {
            await manager.query(`SET search_path TO ${tenantContext.schema}`)
            const repoWithSchema = manager.getRepository(Entity)
            return repoWithSchema[prop].apply(repoWithSchema, args)
          })
        }
      }
      
      return Reflect.get(target, prop, receiver)
    }
  })
}
```

### **Configuración Nginx**

#### **Mapeo de Subdominios**
```nginx
# /etc/nginx/sites-available/ruqq-multitenant

# Mapeo de subdominios a tenant IDs
map $http_host $tenant_id {
    default              "default";
    
    # Formato: subdomain.domain.com -> tenant_subdomain
    ~^(?<subdomain>[^.]+)\..*$  "tenant_$subdomain";
}

server {
    listen 80;
    server_name *.tudominio.com tudominio.com;
    
    location / {
        # Añadir header X-Tenant-ID basado en el subdominio
        proxy_set_header X-Tenant-ID $tenant_id;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Proxy a la aplicación NestJS
        proxy_pass http://localhost:3001;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### **Flujo de Funcionamiento**

1. **Request Entrante**
   - Cliente accede a `cliente1.tudominio.com/api/quotes/calculate`
   - Nginx detecta el subdominio `cliente1`
   - Añade header `X-Tenant-ID: tenant_cliente1`

2. **Procesamiento en NestJS**
   - `TenantMiddleware` intercepta la request
   - Extrae `tenant_cliente1` del header
   - Establece contexto: `{ tenantId: 'tenant_cliente1', schema: 'tenant_cliente1' }`

3. **Ejecución de Consultas**
   - Repositorios usan el schema `tenant_cliente1`
   - Todas las operaciones de DB se ejecutan en ese schema
   - Aislamiento completo de datos

4. **Respuesta**
   - Datos específicos del tenant se devuelven
   - Contexto se limpia al finalizar la request

### **Testing del Sistema Multi-Tenant**

#### **Verificación de Tenant por Defecto**
```bash
curl http://localhost:3001/api/tenant-info

# Respuesta:
{
  "message": "Multi-tenant system is working!",
  "currentTenant": {
    "tenantId": "default",
    "schema": "public"
  }
}
```

#### **Verificación con Tenant Específico**
```bash
curl -H "X-Tenant-ID: tenant_hotel1" http://localhost:3001/api/tenant-info

# Respuesta:
{
  "message": "Multi-tenant system is working!",
  "currentTenant": {
    "tenantId": "tenant_hotel1",
    "schema": "tenant_hotel1"
  }
}
```

#### **API Real con Tenant**
```bash
curl -X POST http://localhost:3001/api/quotes/calculate \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: tenant_hotel_abc" \
  -d '{"pax": 2, "checkInDate": "2025-03-01", "checkOutDate": "2025-03-05"}'

# Respuesta con datos específicos del tenant_hotel_abc
```

### **Gestión de Tenants**

#### **Crear Nuevo Tenant**
```sql
-- Ejecutar en PostgreSQL
SELECT create_tenant_schema('tenant_nuevo_hotel');
```

#### **Listar Tenants Activos**
```sql
SELECT * FROM public.tenant_creation_log WHERE status = 'active';
```

#### **Eliminar Tenant**
```sql
-- Soft delete (marcar como inactivo)
SELECT delete_tenant_schema('tenant_hotel_xyz', false);

-- Hard delete (eliminar schema completamente)
SELECT delete_tenant_schema('tenant_hotel_xyz', true);
```

### **Variables de Entorno Multi-Tenant**
```bash
# .env
MULTI_TENANT_ENABLED=true
DEFAULT_TENANT_ID=default
DEFAULT_TENANT_SCHEMA=public
TENANT_HEADER_NAME=x-tenant-id
```

### **Consideraciones de Seguridad**

1. **Validación de Tenant ID**
   - Solo permitir caracteres alfanuméricos y guiones bajos
   - Prevenir SQL injection en nombres de schema

2. **Aislamiento de Datos**
   - Cada tenant tiene su propio schema PostgreSQL
   - No hay acceso cruzado entre schemas

3. **Rate Limiting**
   - Implementar límites por tenant
   - Prevenir abuso de recursos

4. **Audit Logs**
   - Registrar todas las operaciones por tenant
   - Trazabilidad completa de acciones

### **Estado Actual de Implementación**

#### **✅ Completado**
- Sistema de detección de tenants (headers y subdominios)
- Middleware de procesamiento de contexto con validación robusta
- TenantService con validación de formato y existencia
- Endpoints de debugging: `/tenant-info` y `/tenant-debug`
- Migraciones de base de datos multi-schema
- Funciones PostgreSQL para gestión de tenants
- Factory de repositorios tenant-aware con Proxy Pattern
- **TODOS los módulos usando repositorios tenant-aware:**
  - ✅ BaseRatePeriod, PriceRules, Auth/User, RoomType
  - ✅ OccupancyRateModifiers, ContentBlock, QuoteTemplate
  - ✅ QuoteTemplateBlock, Restrictions, QuoteGenerator
- Configuración Nginx para subdominios
- Testing y validación del sistema
- Manejo de errores con fallback a tenant por defecto en desarrollo

#### **⚠️ Recomendaciones para Producción**
1. ~~Activar repositorios tenant-aware en todos los módulos~~ ✅ COMPLETADO
2. Implementar cache por tenant (Redis)
3. Añadir métricas y monitoring por tenant (Prometheus)
4. Crear dashboard de administración de tenants
5. Implementar backup y restore por tenant
6. Migrar lista de tenants válidos desde código a base de datos
7. Implementar rate limiting por tenant
8. Añadir audit logs completos por tenant

### **Comandos Útiles**
```bash
# Ejecutar migraciones
npm run db:migrate

# Ver logs con información de tenant
tail -f logs/app.log | grep TenantMiddleware

# Verificar schemas en PostgreSQL
psql -d ruqq_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';"

# Test manual con curl
curl -H "X-Tenant-ID: tenant_demo" http://localhost:3001/api/tenant-info
```

---

## 🏷️ Sistema de Promociones

### **Implementación Completada**

El sistema de promociones está **completamente funcional** utilizando la infraestructura existente de `price-rules` con diferenciación semántica en el frontend.

### **Arquitectura de Promociones**

#### **Backend: Una sola API unificada**
```typescript
// API única para price-rules Y promociones
POST /api/price-rules  // Usado por ambos: "Edición Múltiple" y "Crear Promociones"
```

#### **Frontend: Dos experiencias diferentes**

##### **1. "Edición Múltiple" (Calendar-driven)**
```typescript
// Sin campos promocionales
{
  roomTypeIds: ["uuid1", "uuid2"],
  startDate: "2025-03-01",
  endDate: "2025-03-31", 
  daysOfWeek: [6, 7],
  adjustmentType: "PERCENTAGE",
  adjustmentValue: 20
  // promotionName y promotionDescription = undefined
}
```

##### **2. "Crear Promociones" (Form-driven)**  
```typescript
// Con campos promocionales
{
  roomTypeId: "uuid1",
  startDate: "2025-03-01",
  endDate: "2025-03-31",
  daysOfWeek: [6, 7], 
  adjustmentType: "PERCENTAGE",
  adjustmentValue: -15,
  promotionName: "Descuento Primavera",
  promotionDescription: "15% off en fines de semana durante toda la primavera"
}
```

### **Filtrado y Consultas**

#### **Obtener todas las reglas:**
```http
GET /api/price-rules
```

#### **Obtener solo promociones:**
```http
GET /api/price-rules?promotionsOnly=true
```

#### **Búsqueda en nombres de promoción:**
```http
GET /api/price-rules?search=Primavera
# Busca en roomType.name, roomType.code Y promotionName
```

### **Beneficios de esta Arquitectura**

#### **✅ Ventajas Técnicas**
- **Cero duplicación de código**: Una sola API para ambos casos
- **Motor v2.3 unificado**: Mismo algoritmo de cálculo  
- **Performance idéntico**: Sin overhead adicional
- **Mantenimiento simplificado**: Un solo endpoint que mantener

#### **✅ Ventajas de Negocio**
- **UX diferenciada**: Experiencias específicas por contexto
- **Reportes separados**: Filtrar promociones vs reglas operativas
- **Flexibilidad**: Reglas pueden convertirse en promociones agregando nombre
- **Escalabilidad**: Base sólida para promociones avanzadas futuras

### **Casos de Uso Promocionales**

#### **Promoción de Temporada**
```json
{
  "roomTypeIds": ["suite-deluxe", "suite-premium"],
  "startDate": "2025-06-01",
  "endDate": "2025-08-31", 
  "daysOfWeek": [6, 7],
  "adjustmentType": "PERCENTAGE",
  "adjustmentValue": -20,
  "promotionName": "Verano 2025",
  "promotionDescription": "20% descuento en suites durante el verano"
}
```

#### **Promoción de Lanzamiento**
```json
{
  "roomTypeId": "nueva-suite-presidential",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
  "adjustmentType": "FIXED_PRICE",
  "adjustmentValue": 15000,
  "promotionName": "Lanzamiento Suite Presidential",
  "promotionDescription": "Precio especial de lanzamiento para nueva suite"
}
```

### **Estado Actual**

#### **✅ Completado**
- Entity `PriceRule` con campos `promotionName` y `promotionDescription`
- DTOs actualizados para soportar campos promocionales
- Repository con filtrado `promotionsOnly`
- Migración de base de datos aplicada
- Búsqueda extendida que incluye nombres de promoción

#### **🎯 Listo para Frontend**
El backend está **100% preparado** para que el frontend Angular 20 implemente:

1. **Sección "Edición Múltiple"** → Llama a `/api/price-rules` sin campos promocionales
2. **Sección "Crear Promociones"** → Llama a `/api/price-rules` con `promotionName`/`promotionDescription`
3. **Lista de Promociones** → GET `/api/price-rules?promotionsOnly=true`
4. **Dashboard de Análisis** → Métricas separadas por tipo de regla

---

## 📝 Sistema de Gestión de Cotizaciones

### **Arquitectura del Sistema**

El sistema de cotizaciones de Ruqq combina el motor de precios con un sistema de plantillas flexible para generar presupuestos formateados listos para enviar a clientes.

### **Flujo de Generación de Cotizaciones**

```mermaid
graph LR
    A[Cliente solicita cotización] --> B[QuoteGenerator]
    B --> C[QuotesService<br/>Calcula precios]
    B --> D[QuoteTemplate<br/>Obtiene plantilla]
    D --> E[QuoteTemplateBlock<br/>Estructura ordenada]
    E --> F[ContentBlock<br/>Contenido de texto]
    C --> G[Formateo de precios]
    F --> H[Ensamblaje final]
    G --> H
    H --> I[Cotización formateada]
```

### **Componentes del Sistema**

#### **1. ContentBlock - Bloques Reutilizables**
- **Propósito**: Textos reutilizables para armar plantillas
- **Tipos**: Saludo, Servicios, Términos, Política de Cancelación, Footer, Info General
- **Gestión**: Solo SUPER_ADMIN puede crear/editar
- **Multi-tenant**: Cada tenant tiene sus propios bloques

#### **2. QuoteTemplate - Plantillas de Cotización**
- **Propósito**: Define estructura de cotizaciones
- **Funcionalidad**: Puede marcar una plantilla como default
- **Relación**: Una plantilla puede tener múltiples bloques ordenados
- **Multi-tenant**: Plantillas independientes por tenant

#### **3. QuoteTemplateBlock - Estructura y Orden**
- **Propósito**: Define qué bloques usar y en qué orden
- **Campo clave**: `sortOrder` para ordenamiento
- **Flexibilidad**: Permite reusar bloques en múltiples plantillas

#### **4. QuoteGenerator - Orquestador**
- **Propósito**: Combina precios calculados con plantillas
- **Integración**: Usa QuotesService para cálculo de precios
- **Formato**: Genera texto formateado listo para WhatsApp/Email
- **Acceso**: Cualquier usuario autenticado puede generar

### **Casos de Uso**

#### **Crear Plantilla para WhatsApp**
```json
// 1. Crear bloques de contenido
POST /content-block
{
  "name": "Saludo WhatsApp",
  "content": "¡Hola! Gracias por contactar con nosotros. A continuación su presupuesto:",
  "type": "greeting"
}

// 2. Crear plantilla
POST /quote-template
{
  "name": "Plantilla WhatsApp Estándar",
  "isDefault": true
}

// 3. Vincular bloques a plantilla
POST /quote-template-block
{
  "quoteTemplateId": "uuid-plantilla",
  "contentBlockId": "uuid-saludo",
  "sortOrder": 1
}

// 4. Generar cotización
POST /quote-generator/generate
{
  "pax": 2,
  "checkInDate": "2025-03-15",
  "checkOutDate": "2025-03-18",
  "templateId": "uuid-plantilla"
}
```

### **Beneficios del Sistema**

#### **Para el Negocio**
- **Consistencia**: Todas las cotizaciones siguen el mismo formato
- **Flexibilidad**: Múltiples plantillas para diferentes canales
- **Rapidez**: Generación instantánea de presupuestos
- **Personalización**: Contenido adaptable por hotel/tenant

#### **Para Desarrollo**
- **Separación de concerns**: Lógica de precios vs presentación
- **Reutilización**: Bloques compartidos entre plantillas
- **Mantenibilidad**: Cambios centralizados en contenido
- **Multi-tenant ready**: Aislamiento completo por cliente

---

*Documentación técnica completa - Ruqq Hotel Management System*  
*Actualizado el 2025-01-06 - Motor de Precios v2.3 con Sistema de Cotizaciones*  
*Sistema de gestión hotelera integral con arquitectura empresarial multi-tenant*