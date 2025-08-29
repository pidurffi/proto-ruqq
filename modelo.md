🏛️ Diseño del Motor de Precios y Disponibilidad v2.1
Este documento describe la arquitectura final para la creación de un motor de cotización y precios de nivel profesional. El objetivo es lograr un control total sobre la estrategia comercial, maximizar los ingresos y ofrecer una flexibilidad completa para futuras necesidades de negocio.

### 1. El Modelo de Datos Final

Esta estructura de base de datos es el pilar de todo el sistema. Es robusta, normalizada y está diseñada para escalar.

Tabla room_types (Tipos de Unidad):
El inventario físico y sus capacidades.

id: uuid, pk

name: varchar

description: text

base_capacity: integer (Ocupación incluida en el precio estándar)

max_capacity: integer (Límite máximo de personas)

sort_order: integer

Tabla base_rate_period (Tarifas Estándar):
El precio fundamental del cual todo deriva. Es la tarifa para la ocupación base.

id: uuid, pk

room_type_id: uuid, fk

start_date: date

end_date: date

price: decimal(10, 2) (Precio para la base_capacity)

uid: uuid (usuario que creó)

created_at: timestamp

updated_at: timestamp

deleted_at: timestamp (soft delete)

Tabla occupancy_rate_modifiers (Modificadores de Ocupación):
La lógica híbrida para gestionar pasajeros adicionales.

id: uuid, pk

base_rate_period_id: uuid, fk

modifier_value: decimal(10, 2) (El valor, ej: 15000 o 20)

modifier_type: ENUM('fixed', 'percentage') (El tipo de cálculo)

uid: uuid (usuario que creó)

created_at: timestamp

updated_at: timestamp

deleted_at: timestamp (soft delete)

Tabla derived_rate_rules (Reglas de Tarifas Derivadas):
⭐ Concepto Superador #1. Permite crear planes de tarifa adicionales basados en la tarifa estándar.

id: serial, pk

name: varchar (ej: "Tarifa No Reembolsable", "Incluye Desayuno")

description: text

adjustment_value: decimal(10, 2) (ej: -10 o 5000)

adjustment_type: ENUM('fixed_amount', 'percentage')

is_active: boolean

Tabla promotions (Promociones y Descuentos):
⭐ Concepto Superador #2. Gestiona descuentos y ofertas especiales de forma dinámica.

id: serial, pk

promo_code: varchar, unique (ej: "VERANO2026")

description: text

discount_value: decimal(10, 2)

discount_type: ENUM('fixed_amount', 'percentage')

valid_from: date

valid_to: date

is_active: boolean

Tabla restrictions (Restricciones de Estadía):
Las reglas de negocio que controlan la disponibilidad.

id: serial, pk

room_type_id: uuid, fk

start_date: date

end_date: date

min_length_of_stay: integer

max_length_of_stay: integer

closed_to_arrival: boolean

closed_to_departure: boolean

### 2. 🧠 El Flujo de Cotización: Lógica Integral

El QuotesService ahora orquesta una secuencia de validaciones y cálculos mucho más rica.

Input: checkInDate, checkOutDate, pax, promoCode (opcional)

Filtro por Capacidad Máxima: SELECT \* FROM room_types WHERE max_capacity >= :pax;

Iteración por Unidades Válidas: Para cada unidad que pasó el filtro, se inicia el proceso.

Chequeo de Restricciones: Se verifica si la estadía viola alguna regla en la tabla restrictions (MLOS, CTA, CTD). Si lo hace, la unidad se descarta.

Cálculo de la Tarifa Estándar Total: Se calcula el precio base de la estadía, incluyendo los modificadores por ocupación.

Se buscan los base_rate_period y sus occupancy_rate_modifiers.

Se calcula el precio total, aplicando la lógica híbrida (fixed vs. percentage) para pasajeros adicionales. A este resultado lo llamamos standard_total_price.

Aplicación de Promociones:

Si se proveyó un promoCode, se busca en la tabla promotions.

Si es válido y activo, se calcula el descuento sobre el standard_total_price para obtener el final_base_price. Si no hay código, final_base_price es igual a standard_total_price.

Generación de Tarifas Derivadas:

Se buscan todas las derived_rate_rules activas.

Para cada regla (ej: "No Reembolsable", -10%), se calcula su precio final a partir del final_base_price.

precio_no_reembolsable = final_base_price \* 0.90

Ensamblado de la Respuesta Final: La API devuelve un array de unidades disponibles. Cada objeto de unidad contendrá:

roomTypeInfo: Datos de la habitación.

availableRates: Un array con los diferentes planes de tarifa calculados:

{ name: "Tarifa Estándar", price: final_base_price }

{ name: "Tarifa No Reembolsable", price: precio_no_reembolsable }

etc.

### 3. ⚙️ Casos de Uso Avanzados Implementados

Tarifas Derivadas: Te permite ofrecer múltiples productos para la misma habitación.

Caso de uso: Para una misma búsqueda, el cliente puede elegir entre la "Tarifa Estándar" (flexible), la "Tarifa No Reembolsable" (10% más barata) o la "Tarifa con Desayuno" ($5,000 ARS más cara). Esto aumenta drásticamente la conversión.

Códigos Promocionales: Permite crear campañas de marketing dirigidas.

Caso de uso: Lanzas una campaña en Instagram con el código "INSTA15" que da un 15% de descuento para reservas en temporada baja. Puedes medir el éxito de la campaña y gestionarla sin tocar el código.

### 4. 📅 Gestión en el Panel de Administración

La interfaz de administración debe reflejar esta nueva flexibilidad:

Calendario de Tarifas (Vista Principal): Seguirá siendo la herramienta central para cargar el precio de la Tarifa Estándar, los modificadores por ocupación y las restricciones en rangos de fechas.

Sección "Planes de Tarifa": Un nuevo CRUD para gestionar las derived_rate_rules. Aquí creas y editas tus tarifas derivadas (ej: "No Reembolsable", "Media Pensión").

Sección "Promociones": Otro CRUD para gestionar los promotions. Aquí creas códigos, defines su descuento y estableces sus fechas de validez.

Este diseño final te proporciona un sistema de clase mundial, listo no solo para reemplazar tu hoja de cálculo, sino para competir con las herramientas de los grandes portales de reservas.
