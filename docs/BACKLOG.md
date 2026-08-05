# Backlog

Ideas de evolución, sin priorizar contra el negocio. **Esto no es el plan de trabajo**: lo que hay
que hacer antes que nada está en [ESTADO.md](ESTADO.md), y ninguna de estas ideas debería tocarse
antes de cerrar los bloqueantes de ahí.

Este documento reemplaza al viejo `MEJORAS_IMAGINADAS_API.md`, escrito para el modelo
`base_rate_period` que se descartó en septiembre de 2025. Las propuestas que seguían teniendo
sentido se reescribieron sobre el modelo actual de calendario diario; las que el modelo nuevo ya
resolvió se descartaron.

---

## Funcionalidad de negocio

### Rate plans derivados

El modelo ya está: `rate_plans.parent_rate_plan_id` y `parent_adjustment_percent` existen, con la
autorreferencia TypeORM resuelta. Falta la lógica que los use.

Hoy, para ofrecer "No reembolsable = BAR − 10 %" hay que cargar y mantener sincronizadas 365 filas
propias en `daily_room_rates`. Con derivación, el plan hijo se calcula del padre al momento de
cotizar.

Decisión de diseño pendiente: **derivar al vuelo** (una sola fuente de verdad, más CPU por
cotización) o **materializar** al guardar el padre (lecturas más rápidas, riesgo de desincronización).
Para el volumen de un hotel, derivar al vuelo es lo correcto.

Es la funcionalidad con mejor relación valor/esfuerzo del backlog.

### Plantillas de temporada

Aplicar un patrón de temporadas sobre un rango, en lugar de cargar precios rango por rango:

```typescript
await applySeasonTemplate({
  roomTypeId: '…',
  basePrice: 500,
  seasons: [
    { name: 'alta',  multiplier: 1.5, from: '2026-07-01', to: '2026-08-31' },
    { name: 'media', multiplier: 1.2, from: '2026-06-01', to: '2026-06-30' },
    { name: 'baja',  multiplier: 0.8, from: '2026-09-01', to: '2026-09-30' },
  ],
})
```

Con el modelo diario esto se resuelve como una generación masiva de filas, sin la lógica de *split*
que exigía el modelo anterior.

### Validaciones de negocio

- **Rate fencing** — garantizar la jerarquía de precios entre categorías: una Suite no puede quedar
  más barata que una Superior. Validar al guardar, no al cotizar.
- **Blackout dates** — períodos donde ciertas operaciones sobre tarifas quedan bloqueadas.
- **Coherencia de restricciones** — detectar combinaciones imposibles, como `min_stay: 3` en un día
  con `closed_to_arrival: true` en los dos días siguientes.

### Persistencia de cotizaciones

Hoy las cotizaciones se calculan y se descartan (la tabla `quotes` se eliminó en el refactor). Eso
deja sin base tres cosas: histórico de lo que se le ofreció a cada huésped, analítica de conversión,
y trazabilidad si el precio cambia después de enviado el presupuesto.

Si se decide persistir, guardar **el resultado congelado**, no una referencia a las tarifas: el
sentido es poder reconstruir exactamente lo que vio el huésped.

### Motor de disponibilidad real

`available_rooms` se carga pero no se consume. Un motor de disponibilidad completo necesita además
descontar las reservas confirmadas —que hoy no existen como entidad— y manejar el *overbooking*
controlado que usa la industria.

---

## Integraciones

### Channel manager

El modelo de datos ya está alineado con el estándar OTA, y `rate_plans.booking_engine_code` y
`daily_room_rates.pricing_source` están puestos justamente para esto. Falta el adaptador:
sincronización bidireccional de tarifas, disponibilidad y restricciones contra Booking.com, Expedia
o un intermediario tipo SiteMinder.

Es el paso que convierte a Ruqq de herramienta interna en pieza del stack comercial del hotel.

### Rate shopping

Comparar precios contra la competencia y sugerir ajustes. Requiere el channel manager primero, y una
decisión explícita sobre si los ajustes se aplican automáticamente o quedan como sugerencia. La
respuesta correcta casi siempre es sugerencia: un bug en pricing automático se cobra en dinero real.

---

## Arquitectura

### Auditoría de cambios de precio

Registro inmutable de quién cambió qué tarifa, cuándo y por qué. `daily_room_rates` ya tiene
`last_updated_by` y `pricing_source`, pero sólo guardan el **último** estado: no hay historial.

Un log de eventos append-only sobre los cambios de tarifa da auditoría, permite reconstruir el
calendario a cualquier fecha pasada y habilita analítica de estrategia de precios. Event sourcing
completo sería sobreingeniería; una tabla de eventos de cambio de tarifa, no.

### Caché de tarifas

Redis ya es dependencia del proyecto (vía Bull). Cachear los rangos consultados con invalidación por
`room_type_id` al escribir tiene sentido **cuando haya evidencia de que las consultas son el cuello
de botella** — con los índices actuales y el volumen de un hotel, probablemente no lo sean todavía.

Medir antes de optimizar.

### Operaciones en lote transaccionales

La carga masiva de tarifas debería ser atómica: o entran todas las filas del rango, o no entra
ninguna. Hoy conviene revisar si `POST /rates/bulk` corre dentro de una transacción única.

---

## Herramientas

### Utilidades de testing

Cuando exista la suite (ver [ESTADO.md](ESTADO.md) §6), un generador de escenarios de tarifas paga
solo: rangos con huecos, planes que no cubren todas las noches, bordes de mes y de año, cambio de
horario. Son exactamente los casos donde el motor falla en silencio.

### Visualización del calendario de tarifas

Endpoint que devuelva la línea de tiempo de un tipo de habitación con huecos detectados, rango de
precios y estadísticas. Parte ya existe en `GET /rates/:roomTypeId/missing-dates` y `/stats`.

### Métricas de negocio

- Frecuencia de cambio de tarifas por tipo de habitación
- Volatilidad de precios por período
- Tasa de rechazo de cotizaciones por motivo (`CAPACITY_EXCEEDED` vs `NO_RATES_CONFIGURED`) — señala
  directamente los huecos de carga de tarifas
- Tiempo de respuesta del motor de cotización
