# Configuración Nginx Multi-Tenant

## Instalación y Configuración

### 1. Copiar configuración a Nginx
```bash
sudo cp nginx/sites-available/ruqq-multitenant /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/ruqq-multitenant /etc/nginx/sites-enabled/
```

### 2. Verificar configuración
```bash
sudo nginx -t
```

### 3. Recargar Nginx
```bash
sudo systemctl reload nginx
```

### 4. Configurar hosts locales para pruebas (opcional)
Agregar a `/etc/hosts`:
```
127.0.0.1 cliente1.tudominio.com
127.0.0.1 hotel-abc.midominio.com
127.0.0.1 www.tudominio.com
```

## Funcionamiento

### Mapeo de Subdominios
- `cliente1.tudominio.com` → `X-Tenant-ID: tenant_cliente1`
- `hotel-abc.midominio.com` → `X-Tenant-ID: tenant_hotel-abc`  
- `www.tudominio.com` → `X-Tenant-ID: default`
- `tudominio.com` (sin subdominio) → `X-Tenant-ID: default`

### Logs
- Access: `/var/log/nginx/ruqq-multitenant.access.log`
- Error: `/var/log/nginx/ruqq-multitenant.error.log`

### Verificación
Una vez configurado, puedes probar:
```bash
curl -H "Host: cliente1.tudominio.com" http://localhost/tenant-info
curl -H "Host: hotel-abc.midominio.com" http://localhost/tenant-info
```

## SSL/HTTPS
Para habilitar HTTPS, descomenta la sección SSL en el archivo de configuración y configura tus certificados.