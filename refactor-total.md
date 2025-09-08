# 🏨 Plan de Refactorización Total - Modelo de Calendario Diario

## 🎯 Resumen Ejecutivo

**OBJETIVO**: Refactorizar completamente el sistema de precios de Ruqq desde el modelo híbrido de rangos actual hacia el **modelo de calendario diario estándar de las OTAs**.

**JUSTIFICACIÓN**: Evidencia técnica inequívoca demuestra que Booking.com, Airbnb, Expedia y todas las grandes OTAs usan el modelo "un registro por día" para precios y disponibilidad.

---

## 📊 **ESTADO ACTUAL vs ESTADO OBJETIVO**

### ❌ **Modelo Actual (Híbrido - Incorrecto)**
```
base_rate_period (rangos) + price_rules (overrides) + occupancy_rate_modifiers
→ Lógica compleja de split/consolidation
→ 290+ líneas de código para manejar solapamientos
→ No es estándar OTA
```

### ✅ **Modelo Objetivo (Calendario Diario - Estándar OTA)**
```
daily_room_rates (un registro por día)
→ room_type_id + date + price + availability + restrictions
→ Queries simples: WHERE date BETWEEN startDate AND endDate
→ Compatibilidad directa con APIs de OTAs
```

---

## 🏗️ **ARQUITECTURA NUEVA - Modelo OTA Estándar**

### **Entidad Central: DailyRoomRate**
```typescript
@Entity({ name: 'daily_room_rates' })
export class DailyRoomRate extends EntityBase {
  @Column({ type: 'uuid', name: 'room_type_id' })
  roomTypeId: string

  @Column({ type: 'date' })
  date: Date                        // ← UN REGISTRO POR CADA DÍA

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number                  // Precio base para este día

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  singleOccupancyRate?: number      // Para 1 persona

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  extraPersonRate?: number          // Por persona adicional

  @Column({ type: 'int', default: 0 })
  availableRooms: number            // Inventory para este día

  @Column({ type: 'int', nullable: true })
  minStay?: number                  // Min estancia desde este día

  @Column({ type: 'int', nullable: true })
  maxStay?: number                  // Max estancia desde este día

  @Column({ type: 'boolean', default: false })
  closedToArrival: boolean          // No check-in este día

  @Column({ type: 'boolean', default: false })
  closedToDeparture: boolean        // No check-out este día

  @Column({ type: 'boolean', default: true })
  isActive: boolean                 // Día vendible

  // CLAVE COMPUESTA ÚNICA (como Booking.com)
  @Index(['roomTypeId', 'date'], { unique: true })
  
  @ManyToOne(() => RoomType)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType
}
```

### **Ventajas del Nuevo Modelo:**
1. **✅ Estándar OTA**: Exacto mismo diseño que Booking.com
2. **✅ Queries Simples**: `SELECT * WHERE date BETWEEN ? AND ?`
3. **✅ Performance Predecible**: Índices (room_type_id, date) 
4. **✅ Flexibilidad Total**: Cada día puede tener precio/restricciones únicos
5. **✅ Compatibilidad API**: XML directo `<date value="2025-01-15">`

---

## 📋 **PLAN DE MIGRACIÓN - 7 FASES**

### **FASE 1: Preparación y Análisis**
- [ ] Backup completo de base de datos actual
- [ ] Análisis de volumen de datos existente
- [ ] Crear scripts de migración de datos
- [ ] Configurar entorno de testing para validación

### **FASE 2: Nueva Estructura de Base de Datos**
- [ ] Crear entidad `DailyRoomRate` con campos completos
- [ ] Generar migración TypeORM para nueva tabla
- [ ] Configurar índices optimizados: `(room_type_id, date)`
- [ ] Validar constraints y relaciones

### **FASE 3: Servicios de Transformación**
- [ ] Crear `DailyRatesService` (reemplazo de BaseRatePeriodService)
- [ ] Implementar `DailyRatesRepository` con tenant-aware
- [ ] Crear utilidades para generar rangos de fechas
- [ ] Crear bulk operations para carga masiva

### **FASE 4: Migración de Datos**
- [ ] **Script 1**: Expandir `base_rate_period` → días individuales
- [ ] **Script 2**: Aplicar `price_rules` día por día donde corresponda  
- [ ] **Script 3**: Integrar `occupancy_rate_modifiers` como campos
- [ ] **Script 4**: Migrar `restrictions` como campos por día
- [ ] **Script 5**: Validar integridad de datos migrados

### **FASE 5: Refactorización de QuotesService**
- [ ] Simplificar `calculateQuote()` - eliminando lógica de split
- [ ] Nuevo método: `getRatesForPeriod(roomTypeId, startDate, endDate)`
- [ ] Eliminar toda la lógica de consolidation/fragments
- [ ] Mantener validaciones de negocio (capacidad, restricciones)

### **FASE 6: APIs y Controllers**
- [ ] Adaptar endpoints existentes al nuevo modelo
- [ ] Crear nuevos endpoints para bulk operations
- [ ] Actualizar DTOs para reflejar modelo diario
- [ ] Testing exhaustivo de APIs

### **FASE 7: Limpieza y Optimización**
- [ ] Eliminar entidades obsoletas: BaseRatePeriod, PriceRule, OccupancyRateModifiers
- [ ] Eliminar servicios/repositories obsoletos
- [ ] Limpieza de código muerto (split/consolidation logic)
- [ ] Optimización de performance con índices específicos

---

## 🔧 **SERVICIOS SIMPLIFICADOS - Nuevo Paradigma**

### **Antes (Complejo - 290 líneas):**
```typescript
// BaseRatePeriodService con lógica de split
async splitRateForPeriod(...) {
  // 1. Buscar períodos solapados
  // 2. Eliminar períodos solapados  
  // 3. Crear fragmentos antes/después
  // 4. Consolidar períodos consecutivos
  // 290+ líneas de lógica compleja
}
```

### **Después (Simple - ~50 líneas):**
```typescript
// DailyRatesService ultra-simple
async setRatesForPeriod(
  roomTypeId: string, 
  startDate: string, 
  endDate: string, 
  rate: number
): Promise<DailyRoomRate[]> {
  const dates = this.generateDateRange(startDate, endDate)
  const records = dates.map(date => ({
    roomTypeId,
    date,
    baseRate: rate,
    // ... otros campos por defecto
  }))
  
  // UPSERT masivo - una operación simple
  return this.repository.upsert(records, ['roomTypeId', 'date'])
}
```

---

## ⚡ **CONSULTAS OPTIMIZADAS - Performance OTA**

### **Query Principal (Ultra-Simple):**
```sql
-- Obtener tarifas para cotización (una sola query)
SELECT date, base_rate, available_rooms, min_stay, closed_to_arrival
FROM daily_room_rates 
WHERE room_type_id = ? 
  AND date >= ? 
  AND date <= ?
  AND is_active = true
ORDER BY date;
```

### **Índices Críticos:**
```sql
-- Índice compuesto principal (como Booking.com)
CREATE INDEX idx_daily_rates_main ON daily_room_rates (room_type_id, date);

-- Índice para consultas por rango de fechas
CREATE INDEX idx_daily_rates_date_range ON daily_room_rates (date, is_active);

-- Índice para disponibilidad
CREATE INDEX idx_daily_rates_availability ON daily_room_rates (room_type_id, date, available_rooms) 
WHERE available_rooms > 0;
```

---

## 📈 **ESTIMACIONES DE ALMACENAMIENTO**

### **Cálculo Realista:**
```
Hotel pequeño: 5 tipos de habitación × 2 años × 365 días = 3,650 registros
Hotel mediano: 15 tipos × 2 años × 365 días = 10,950 registros  
Hotel grande: 30 tipos × 2 años × 365 días = 21,900 registros

Tamaño por registro: ~150 bytes
Storage total: 21,900 × 150 bytes = 3.3 MB (máximo)

→ COMPLETAMENTE MANEJABLE para cualquier hotel
```

### **Performance Esperado:**
- **Consulta cotización** (7 días): < 5ms
- **Bulk update** (temporada completa): < 100ms  
- **Compatibilidad OTA**: 100% directa

---

## ⚠️ **RIESGOS Y MITIGACIONES**

### **Riesgo 1: Volumen de Datos**
- **Mitigación**: Políticas de retención (mantener solo 2-3 años hacia adelante)
- **Monitoreo**: Scripts de limpieza automática de datos históricos

### **Riesgo 2: Performance en Bulk Updates**
- **Mitigación**: Usar UPSERT batch operations, no INSERT individual
- **Testing**: Probar con datasets de 50K+ registros

### **Riesgo 3: Downtime durante Migración**
- **Mitigación**: Migración por fases, parallel running de ambos sistemas
- **Rollback**: Scripts de reversión completa probados

---

## 🎯 **CRITERIOS DE ÉXITO**

### **Funcionales:**
- [ ] Cotizaciones generan mismo resultado que sistema actual
- [ ] APIs mantienen backward compatibility 
- [ ] Performance igual o superior a sistema actual
- [ ] 100% de datos migrados sin pérdida

### **Técnicos:**
- [ ] Queries de cotización < 10ms promedio
- [ ] Bulk operations < 1 segundo para 1000 registros
- [ ] Cobertura de tests > 90%
- [ ] Zero downtime deployment

### **Negocio:**
- [ ] Compatibilidad directa con Channel Managers
- [ ] Capacidad de integración con OTAs sin middleware
- [ ] Flexibilidad total para pricing dinámico
- [ ] Reducción 80% en complejidad de código de precios

---

## 📅 **CRONOGRAMA PROPUESTO**

| Fase | Duración | Entregables |
|------|----------|-------------|
| Fase 1: Preparación | 3 días | Scripts migración + testing environment |
| Fase 2: Nueva BD | 2 días | Entidad DailyRoomRate + migraciones |
| Fase 3: Servicios | 4 días | DailyRatesService + Repository + Utilities |
| Fase 4: Migración Datos | 3 días | Scripts completos + validación |
| Fase 5: QuotesService | 3 días | Refactorización + testing |
| Fase 6: APIs | 2 días | Controllers + DTOs + endpoints |
| Fase 7: Limpieza | 2 días | Eliminación código obsoleto |

**TOTAL: ~19 días de desarrollo**

---

## 💡 **PRÓXIMOS PASOS**

### **Paso 1**: Confirmación de Plan
- Validar enfoque y cronograma propuesto
- Acordar prioridades y recursos necesarios

### **Paso 2**: Setup Inicial  
- Configurar branch específico para refactor
- Crear ambiente de testing con datos reales

### **Paso 3**: Implementación Iterativa
- Comenzar con Fase 1 (Preparación)
- Reviews técnicos en cada fase
- Testing continuo con datos reales

---

**🏆 RESULTADO ESPERADO**: Sistema de precios ultra-simple, compatible 100% con estándares OTA, mantenible y escalable.

---