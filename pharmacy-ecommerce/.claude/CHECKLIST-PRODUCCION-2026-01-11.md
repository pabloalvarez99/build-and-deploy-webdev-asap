# Checklist de Producción - Tu Farmacia E-commerce

**Fecha**: 2026-01-11  
**Estado**: Cambios implementados, listos para deploy

---

## ✅ Cambios Recientes Implementados

### MercadoPago - Campos name y surname
- ✅ Frontend: Campos nombre/apellido agregados al checkout
- ✅ Backend: Modelos actualizados para recibir name/surname
- ✅ Backend: Handler actualizado para enviar name/surname a MercadoPago
- ✅ API TypeScript: Tipos actualizados

**Archivos modificados**:
1. `apps/web/src/app/checkout/page.tsx`
2. `apps/web/src/lib/api.ts`
3. `apps/order-service/src/models/order.rs`
4. `apps/order-service/src/handlers/checkout.rs`

---

## 📋 Checklist Pre-Deploy

### Backend (Railway)

#### Order Service
- [ ] **Commit cambios**:
  ```bash
  git add .
  git commit -m "Agregar campos name y surname al checkout para mejorar calidad MercadoPago"
  git push origin main
  ```
- [ ] **Verificar deploy automático** en Railway Dashboard
- [ ] **Verificar logs** después del deploy:
  - Ir a: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
  - Service: `build-and-deploy-webdev-asap`
  - Verificar que no hay errores de compilación

#### Variables de Entorno (ya configuradas)
- ✅ `MERCADOPAGO_ACCESS_TOKEN` - Producción
- ✅ `FRONTEND_URL` - https://tu-farmacia.vercel.app
- ✅ `WEBHOOK_URL` - https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
- ✅ `DATABASE_URL` - Railway PostgreSQL
- ✅ `REDIS_URL` - Railway Redis
- ✅ `PORT` - 3003

### Frontend (Vercel)

- [ ] **Deploy a Vercel**:
  ```bash
  cd apps/web
  vercel --prod
  ```
- [ ] **Verificar build** exitoso
- [ ] **Verificar que el sitio carga**:
  - https://tu-farmacia.vercel.app

---

## 🧪 Testing Post-Deploy

### 1. Verificar Frontend

- [ ] **Homepage carga correctamente**
  - Ir a: https://tu-farmacia.vercel.app
  - Verificar que los productos se muestran

- [ ] **Checkout tiene campos nombre/apellido**
  - Agregar producto al carrito
  - Ir a /checkout
  - Verificar que aparecen campos:
    - ✅ Nombre * (requerido)
    - ✅ Apellido * (requerido)
    - ✅ Email * (requerido)
    - ✅ Dirección de envío
    - ✅ Notas adicionales

- [ ] **Validación funciona**
  - Intentar pagar sin llenar nombre/apellido
  - Verificar que muestra error
  - Llenar todos los campos requeridos
  - Verificar que el botón se habilita

### 2. Verificar Backend

- [ ] **Health check**:
  ```bash
  curl https://build-and-deploy-webdev-asap-production.up.railway.app/health
  ```
  Debe retornar: `OK`

- [ ] **Logs no muestran errores**:
  - Railway Dashboard → Service → Logs
  - Verificar que no hay errores relacionados con `name` o `surname`

### 3. Probar Checkout Completo

- [ ] **Flujo completo**:
  1. Agregar productos al carrito
  2. Ir a checkout
  3. Llenar nombre, apellido, email
  4. Click en "Pagar con MercadoPago"
  5. Verificar redirección a MercadoPago
  6. **NO completar el pago aún** (solo verificar que redirige)

---

## 📊 Verificar Calidad de Integración MercadoPago

### Inmediatamente después del deploy:
- [ ] Ir a: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
- [ ] **Anotar el puntaje actual** (puede seguir en 39/100)

### Después de 24 horas:
- [ ] **Revisar nuevamente** el puntaje
- [ ] **Esperado**: Puntaje ≥ 73/100
- [ ] Si es ≥ 73/100:
  - ✅ Probar pago completo con cuenta personal
  - ✅ Verificar que el botón "Pagar" está habilitado
- [ ] Si sigue < 73/100:
  - Revisar logs de Railway
  - Verificar que los campos se están enviando correctamente
  - Contactar soporte MercadoPago si es necesario

---

## 🔍 Verificación de Campos Enviados a MercadoPago

Para verificar que los campos se envían correctamente:

### Opción 1: Logs de Railway
1. Ir a Railway Dashboard
2. Service → Logs
3. Buscar logs de creación de preferencia
4. Verificar que el JSON incluye `payer.name` y `payer.surname`

### Opción 2: Panel de MercadoPago
1. Ir a: https://www.mercadopago.com.cl/activities
2. Ver transacciones recientes
3. Verificar información del comprador

### Opción 3: Código (debugging)
Si necesitas ver el JSON exacto que se envía:
- Agregar log en `apps/order-service/src/handlers/checkout.rs` línea ~436
- Revisar logs después del deploy

---

## ✅ Checklist de Producción General

### Funcionalidad Core
- [x] Productos se muestran correctamente
- [x] Carrito funciona
- [x] Checkout funciona
- [ ] **Pagos con MercadoPago funcionan** (pendiente verificación después de 24h)

### Seguridad
- [x] Variables de entorno no expuestas
- [x] JWT tokens funcionando
- [x] Credenciales de MercadoPago en producción

### Performance
- [x] Base de datos con índices
- [x] Redis cache funcionando
- [x] Docker containers optimizados

### Monitoreo
- [x] Health checks en todos los servicios
- [x] Logs accesibles en Railway
- [ ] **Métricas de MercadoPago** (revisar en panel)

---

## 🚨 Problemas Conocidos

### Botón de pago deshabilitado (EN RESOLUCIÓN)
- **Estado**: Cambios implementados, pendiente deploy y esperar 24h
- **Causa**: Calidad de integración baja (39/100)
- **Solución aplicada**: Agregados campos name y surname
- **Próximo paso**: Deploy y esperar re-evaluación de MercadoPago

---

## 📝 Notas Post-Deploy

### Después del deploy exitoso:

1. **Anotar fecha/hora del deploy**
2. **Verificar que los cambios están en producción**:
   - Frontend: Verificar campos nombre/apellido
   - Backend: Verificar logs sin errores

3. **Programar revisión en 24 horas**:
   - Verificar puntaje de calidad de MercadoPago
   - Probar pago completo si el puntaje es ≥ 73/100

4. **Si todo funciona**:
   - ✅ Considerar proyecto listo para producción
   - ✅ Monitorear primeros pagos reales
   - ✅ Revisar feedback de usuarios

---

## 🎯 Próximos Pasos (Opcionales)

### Alta Prioridad
- [ ] Verificar que pagos funcionan (después de 24h)
- [ ] Monitorear primeros pedidos reales

### Media Prioridad
- [ ] Funcionalidad "Retiro en tienda" dedicada
- [ ] Panel admin completo (gestión productos/órdenes)

### Baja Prioridad
- [ ] Testing automatizado
- [ ] Dominio personalizado
- [ ] Analytics y métricas

---

**Última actualización**: 2026-01-11  
**Estado**: ✅ Cambios listos para deploy
