# 🚀 Postman cURL Collection - Motor de Precios v2.3

## 📋 Variables de Postman Requeridas
```
{{baseUrl}} = http://localhost:3001/api
{{authToken}} = tu-token-jwt-aquí
```

---

## 🎯 **API Principal: Calendar Management**

### **1. Bulk Edit - Fin de Semana Premium (+25%)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-03-01",
    "endDate": "2025-03-31",
    "daysOfWeek": [6, 7],
    "adjustmentType": "percentage",
    "adjustmentValue": 25.0
}'
```

### **2. Bulk Edit - Promoción Entre Semana (-$500)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-04-01", 
    "endDate": "2025-04-30",
    "daysOfWeek": [2, 3, 4],
    "adjustmentType": "fixed_amount",
    "adjustmentValue": -500.0
}'
```

### **3. Bulk Edit - Viernes Precio Fijo ($15,000)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-06-01",
    "endDate": "2025-08-31", 
    "daysOfWeek": [5],
    "adjustmentType": "fixed_price",
    "adjustmentValue": 15000.0
}'
```

### **4. Bulk Edit - Múltiples Habitaciones**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": [
        "2c48743c-c86f-493e-9cb7-c124add397f2",
        "uuid-suite-deluxe",
        "uuid-standard-room"
    ],
    "startDate": "2025-07-01",
    "endDate": "2025-07-31",
    "daysOfWeek": [6, 7],
    "adjustmentType": "percentage", 
    "adjustmentValue": 30.0
}'
```

### **5. Preview de Cambios (Sin Aplicar)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit/preview' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-05-01",
    "endDate": "2025-05-31",
    "daysOfWeek": [1, 2, 3, 4, 5],
    "adjustmentType": "percentage",
    "adjustmentValue": -15.0
}'
```

---

## ⚙️ **API de Price Rules (Nivel Bajo)**

### **6. Crear Price Rule Individual**
```bash
curl --location '{{baseUrl}}/admin/price-rules' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeId": "2c48743c-c86f-493e-9cb7-c124add397f2",
    "startDate": "2025-09-01",
    "endDate": "2025-09-30",
    "daysOfWeek": [1],
    "priority": 5,
    "adjustmentType": "fixed_amount",
    "adjustmentValue": -200.0
}'
```

### **7. Bulk Create Price Rules**
```bash
curl --location '{{baseUrl}}/admin/price-rules/bulk' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": [
        "2c48743c-c86f-493e-9cb7-c124add397f2",
        "uuid-another-room-type"
    ],
    "startDate": "2025-10-01",
    "endDate": "2025-10-31",
    "daysOfWeek": [7],
    "adjustmentType": "percentage",
    "adjustmentValue": 20.0
}'
```

### **8. Listar Price Rules con Filtros**
```bash
curl --location '{{baseUrl}}/admin/price-rules?page=0&pageSize=10&search=deluxe' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json'
```

### **9. Obtener Price Rule por ID**
```bash
curl --location '{{baseUrl}}/admin/price-rules/uuid-price-rule-id' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json'
```

### **10. Actualizar Price Rule**
```bash
curl --location --request PATCH '{{baseUrl}}/admin/price-rules/uuid-price-rule-id' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "adjustmentValue": 35.0,
    "priority": 10
}'
```

### **11. Eliminar Price Rule**
```bash
curl --location --request DELETE '{{baseUrl}}/admin/price-rules/uuid-price-rule-id' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json'
```

---

## 💰 **API de Quotes (Testing del Algoritmo)**

### **12. Calcular Cotización con Price Rules**
```bash
curl --location '{{baseUrl}}/quotes/calculate' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "pax": 2,
    "checkInDate": "2025-03-01",
    "checkOutDate": "2025-03-05"
}'
```

### **13. Cotización para Fin de Semana (Con Rules Aplicadas)**
```bash
curl --location '{{baseUrl}}/quotes/calculate' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "pax": 4,
    "checkInDate": "2025-07-05",
    "checkOutDate": "2025-07-07"
}'
```

---

## 📊 **Casos de Uso Específicos**

### **14. Temporada Alta Completa (+40% Todos los Días)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-12-20",
    "endDate": "2026-01-05",
    "daysOfWeek": [1, 2, 3, 4, 5, 6, 7],
    "adjustmentType": "percentage",
    "adjustmentValue": 40.0
}'
```

### **15. Lunes Blue Monday (-30%)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "daysOfWeek": [1],
    "adjustmentType": "percentage",
    "adjustmentValue": -30.0
}'
```

### **16. Miércoles de Promoción (Precio Fijo $8,000)**
```bash
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-02-01",
    "endDate": "2025-11-30",
    "daysOfWeek": [3],
    "adjustmentType": "fixed_price",
    "adjustmentValue": 8000.0
}'
```

---

## 🛠️ **Debugging y Administración**

### **17. Ver Base Rate Period Original**
```bash
curl --location '{{baseUrl}}/base-rate-period/' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json'
```

### **18. Crear Base Rate Period (Para Testing)**
```bash
curl --location '{{baseUrl}}/base-rate-period/' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeId": "2c48743c-c86f-493e-9cb7-c124add397f2",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31", 
    "price": 12000
}'
```

---

## 📈 **Tests de Integración**

### **19. Test Complejo: Weekend + Promoción Entre Semana**
```bash
# Paso 1: Crear regla de fin de semana
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-05-01",
    "endDate": "2025-05-31",
    "daysOfWeek": [6, 7],
    "adjustmentType": "percentage",
    "adjustmentValue": 25.0
}'

# Paso 2: Crear regla entre semana  
curl --location '{{baseUrl}}/admin/calendar/bulk-edit' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "roomTypeIds": ["2c48743c-c86f-493e-9cb7-c124add397f2"],
    "startDate": "2025-05-01",
    "endDate": "2025-05-31",
    "daysOfWeek": [2, 3, 4],
    "adjustmentType": "fixed_amount",
    "adjustmentValue": -300.0
}'

# Paso 3: Test la cotización 
curl --location '{{baseUrl}}/quotes/calculate' \
--header 'Authorization: Bearer {{authToken}}' \
--header 'Content-Type: application/json' \
--data '{
    "pax": 2,
    "checkInDate": "2025-05-01",
    "checkOutDate": "2025-05-08"
}'
```

---

## 🎉 **Notas de Uso**

### **Días de la Semana (ISO 8601)**
- `1` = Lunes
- `2` = Martes  
- `3` = Miércoles
- `4` = Jueves
- `5` = Viernes
- `6` = Sábado
- `7` = Domingo

### **Tipos de Ajuste**
- `"fixed_price"` = Precio fijo final
- `"fixed_amount"` = Suma/resta cantidad al precio base
- `"percentage"` = Porcentaje sobre precio base

### **Lógica de Decisión Automática**
- **7 días seleccionados** → Modifica `base_rate_period` (cambio fundamental)
- **< 7 días seleccionados** → Crea `price_rules` (excepción)

---

*Generado automáticamente para Motor de Precios v2.3*  
*Proyecto: Ruqq Hotel Management System*