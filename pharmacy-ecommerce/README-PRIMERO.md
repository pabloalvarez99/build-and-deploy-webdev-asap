# 🚀 Tu Farmacia - Guía de Deployment

## ⭐ EMPIEZA AQUÍ

Todo está listo para desplegar tu aplicación. Solo necesitas 30 minutos.

---

## 📖 Archivos de Deployment (En Orden)

### 1. **LISTO-PARA-DEPLOY.md** 👈 LEE ESTO PRIMERO
Resumen de todo lo que está listo y lo que falta.

### 2. **TODO-AHORA.txt**
Lista simple de tareas inmediatas (30 min).

### 3. **FIX-RAILWAY-DASHBOARD.md** ⭐ USA ESTE AHORA
Paso a paso para desplegar backend en Railway (15 min).

### 4. **DEPLOY-FRONTEND.md**
Paso a paso para desplegar frontend en Vercel (10 min).

### 5. **CHECKLIST-FINAL.md**
Checklist completo con verificación.

---

## ⚡ Quick Start (3 Pasos)

### Paso 1: Railway (15 min)
```
1. Abre: https://railway.app
2. Sigue: FIX-RAILWAY-DASHBOARD.md
3. Configura 3 servicios
```

### Paso 2: Migraciones DB (2 min)
```
1. Railway → PostgreSQL → Query
2. Ejecuta: database/migrations/001_initial.sql
3. Ejecuta: database/migrations/002_guest_checkout.sql
```

### Paso 3: Vercel (10 min)
```
1. cd apps\web
2. vercel login && vercel
3. Sigue: DEPLOY-FRONTEND.md
```

---

## 🔑 Variables Que Necesitas

### ✓ Ya Las Tienes (están en FIX-RAILWAY-DASHBOARD.md)
- DATABASE_URL
- REDIS_URL
- JWT_SECRET

### ⚠ Debes Obtener
- MERCADOPAGO_ACCESS_TOKEN (de tu cuenta MercadoPago)
- MERCADOPAGO_PUBLIC_KEY (de tu cuenta MercadoPago)

**Obtén credenciales:** https://www.mercadopago.com.cl/developers/panel/app

---

## 📚 Referencia Completa de Archivos

### Guías de Deployment
| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| **README-PRIMERO.md** | Este archivo | Ahora |
| **LISTO-PARA-DEPLOY.md** | Estado del proyecto | Antes de empezar |
| **TODO-AHORA.txt** | Lista de tareas | Referencia rápida |
| **FIX-RAILWAY-DASHBOARD.md** | Deploy backend | Paso 1 (15 min) |
| **DEPLOY-FRONTEND.md** | Deploy frontend | Paso 3 (10 min) |
| **CHECKLIST-FINAL.md** | Checklist completo | Durante deployment |
| **RESUMEN-DEPLOY.md** | Overview general | Referencia |

### Referencia Técnica
| Archivo | Propósito |
|---------|-----------|
| **START-HERE.md** | Comandos CLI alternativos |
| **RUN-THIS.md** | Comandos paso a paso (CLI) |
| **DEPLOY-COMMANDS.md** | Referencia de comandos |
| **RAILWAY-FIX.md** | Troubleshooting Railway |
| **DEPLOY.md** | Documentación completa |

### Scripts
| Archivo | Propósito |
|---------|-----------|
| **deploy-simple.ps1** | Script PowerShell (si prefieres CLI) |
| **deploy-all.ps1** | Script completo automático |
| **deploy.bat** | Script Windows batch |
| **verify-ready.ps1** | Verificación pre-deployment |

---

## 🎯 Arquitectura

```
Vercel (Frontend)           Railway (Backend)
┌──────────────┐           ┌─────────────────────┐
│  Next.js 14  │ ────────> │  product-service    │
│  Tu Farmacia │           │  order-service      │
│              │           │  auth-service       │
│  - Carrito   │           │  ─────────────────  │
│  - Checkout  │           │  PostgreSQL         │
│  - MercadoPago│          │  Redis              │
└──────────────┘           └─────────────────────┘
```

---

## ✅ Estado del Proyecto

### Completado
- [x] Backend: 3 microservicios en Rust
- [x] Frontend: Next.js 14 con TypeScript
- [x] Guest checkout (sin necesidad de login)
- [x] Integración MercadoPago
- [x] Carrito persistente (localStorage)
- [x] Migraciones de base de datos
- [x] Docker containers
- [x] Configuraciones Railway
- [x] Documentación completa

### Por Hacer (Manual)
- [ ] Configurar servicios en Railway Dashboard (15 min)
- [ ] Ejecutar migraciones (2 min)
- [ ] Deploy frontend en Vercel (10 min)
- [ ] Actualizar URLs de webhook y frontend (3 min)

---

## 🚦 Siguiente Paso

**Abre:** `LISTO-PARA-DEPLOY.md`

Lee el resumen completo, luego sigue con `FIX-RAILWAY-DASHBOARD.md`.

---

## ⏱️ Tiempo Estimado

| Tarea | Tiempo |
|-------|--------|
| Railway Backend | 15 min |
| Migraciones DB | 2 min |
| Vercel Frontend | 10 min |
| Actualizar URLs | 3 min |
| **Total** | **~30 min** |

---

## 🆘 ¿Problemas?

1. Lee `RAILWAY-FIX.md` para troubleshooting
2. Revisa logs en Railway Dashboard
3. Verifica que todas las variables estén configuradas
4. Usa las URLs internas (*.railway.internal) para conexiones entre servicios

---

## 📞 Recursos

- **Railway:** https://railway.app
- **Vercel:** https://vercel.com
- **MercadoPago Developers:** https://www.mercadopago.com.cl/developers
- **Tarjetas de prueba MP:** https://www.mercadopago.com.cl/developers/es/docs/checkout-api/testing

---

**¡Listo para desplegar!** Abre `LISTO-PARA-DEPLOY.md` para empezar. 🎉
