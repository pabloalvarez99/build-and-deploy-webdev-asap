# Retomar Proyecto en Otro PC

Guía rápida para continuar el desarrollo de Tu Farmacia E-commerce en otro computador.

---

## 1. Clonar Repositorio

```bash
git clone https://github.com/pabloalvarez99/build-and-deploy-webdev asap.git
cd "build and deploy webdev asap/pharmacy-ecommerce"
```

---

## 2. Leer Contexto (5-10 minutos)

**IMPORTANTE**: Lee estos archivos en orden antes de hacer cambios:

1. **`.claude/CONTEXTO-ACTUAL.md`** (5 min)
   - Estado del proyecto
   - Arquitectura del sistema
   - URLs y credenciales
   - Stack tecnológico

2. **`.claude/PROBLEMA-MERCADOPAGO.md`** (3 min)
   - Problema pendiente: Botón de pago deshabilitado
   - Posibles causas y soluciones
   - Próximos pasos de troubleshooting

3. **`ESTADO-ACTUAL.md`** (2 min)
   - Status de deployments
   - Health checks de servicios

4. **`.claude/HISTORIAL-CAMBIOS.md`** (opcional, 5 min)
   - Cronología de cambios importantes
   - Decisiones de arquitectura

---

## 3. Pre-requisitos

### Software Requerido

| Herramienta | Versión Mínima | Verificar |
|-------------|----------------|-----------|
| **Rust** | 1.75+ | `rustc --version` |
| **Bun** | 1.0+ | `bun --version` |
| **Node.js** | 18+ | `node --version` |
| **Git** | 2.x | `git --version` |
| **Railway CLI** | latest | `railway --version` |
| **Vercel CLI** | latest | `vercel --version` |

### Instalación de Herramientas

**Rust** (Windows):
```powershell
# Descargar e instalar desde:
https://www.rust-lang.org/tools/install
# O usar rustup:
winget install Rustlang.Rustup
```

**Bun** (Windows):
```powershell
# Descargar e instalar desde:
https://bun.sh/
# O usar PowerShell:
powershell -c "irm bun.sh/install.ps1|iex"
```

**Railway CLI**:
```bash
npm install -g @railway/cli
# O descargar desde: https://docs.railway.app/develop/cli
```

**Vercel CLI**:
```bash
npm install -g vercel
```

---

## 4. Verificar Deployments

### Frontend (Vercel)
```bash
# Abrir en navegador:
https://tu-farmacia.vercel.app

# O verificar con curl:
curl -I https://tu-farmacia.vercel.app
# Debería retornar: HTTP/2 200
```

### Backend Services (Railway)

**Health checks**:
```bash
# Order Service
curl https://build-and-deploy-webdev-asap-production.up.railway.app/health
# Debería retornar: OK

# Product Service (listar productos)
curl https://empathetic-wisdom-production-7d2f.up.railway.app/api/products
# Debería retornar JSON con productos

# Auth Service
curl https://efficient-patience-production.up.railway.app/health
# Debería retornar: OK (si tiene health endpoint)
```

**¿Todos los servicios responden?**
- ✅ **SÍ** → Continuar con Paso 5
- ❌ **NO** → Ver sección "Troubleshooting" abajo

---

## 5. Accesos a Dashboards

### GitHub
- **Repositorio**: https://github.com/pabloalvarez99/build-and-deploy-webdev-asap
- **Branch**: main

### Railway
- **Dashboard**: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
- **Login**: `railway login`
- **Link project**: `railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d`

### Vercel
- **Dashboard**: https://vercel.com/pablo-figueroas-projects-015bb2fb/tu-farmacia
- **Login**: `vercel login`
- **Link project**: `vercel link`

### MercadoPago
- **Developer Panel**: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084
- **Integration Quality**: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
- **Transactions**: https://www.mercadopago.com.cl/activities

---

## 6. Desarrollo Local (Opcional)

### Frontend (Next.js)

```bash
cd apps/web
bun install
bun run dev
# Abre http://localhost:3000
```

**Nota**: El frontend usa API Gateway (rewrites en `next.config.js`) que apunta a Railway, así que **NO necesitas correr los backends localmente** para desarrollo del frontend.

### Backend (Rust)

Solo si necesitas hacer cambios en el backend:

1. **Instalar dependencias de PostgreSQL**:
   ```bash
   # Windows: Descargar desde https://www.postgresql.org/download/windows/
   # O instalar solo libpq:
   choco install postgresql-libs
   ```

2. **Configurar variables de entorno**:
   ```bash
   # Copiar desde Railway Dashboard o desde .claude/CONTEXTO-ACTUAL.md
   cp .env.example .env
   # Editar .env con valores reales
   ```

3. **Correr servicio**:
   ```bash
   cd apps/order-service
   cargo run
   # Escucha en http://localhost:3003
   ```

**Nota**: Para desarrollo, es más fácil usar los servicios deployados en Railway que correr todo localmente.

---

## 7. Próximos Pasos

### A. Resolver Problema MercadoPago

**Ver**: `.claude/PROBLEMA-MERCADOPAGO.md`

**Acción inmediata** (2 min):
1. Ir a: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
2. Verificar puntaje de calidad de integración
3. Si es ≥73/100, probar pago nuevamente en https://tu-farmacia.vercel.app
4. Si sigue <73/100, ver "Próximos Pasos de Troubleshooting" en PROBLEMA-MERCADOPAGO.md

### B. Continuar Desarrollo

**Tareas pendientes**:
- [ ] Agregar campos nombre/apellido al checkout (si puntaje MercadoPago sigue bajo)
- [ ] Implementar funcionalidad "Retiro en tienda" dedicada
- [ ] Panel admin para gestión de productos y órdenes
- [ ] Tests automatizados

---

## Troubleshooting

### Backend no responde (502/503/504)

**1. Verificar Railway Dashboard**:
```
https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
```
- ¿Servicios están "Active" (verde)?
- ¿Últimos deployments exitosos?
- Revisar logs de cada servicio

**2. Ver logs**:
```bash
railway login
railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
railway logs --service build-and-deploy-webdev-asap
```

**3. Redeploy manualmente**:
```bash
# En Railway Dashboard:
# Service → Deployments → Latest → "Redeploy"
```

### Frontend no carga productos

**1. Verificar API Gateway**:
```bash
# Desde tu-farmacia.vercel.app, las requests van a:
https://tu-farmacia.vercel.app/backend/products/products

# Que se proxy a:
https://empathetic-wisdom-production-7d2f.up.railway.app/api/products
```

**2. Verificar next.config.js**:
```javascript
// Debe tener rewrites configurados:
rewrites() {
  return [
    {
      source: '/backend/products/:path*',
      destination: 'https://empathetic-wisdom-production-7d2f.up.railway.app/api/:path*'
    },
    // ...
  ];
}
```

**3. Verificar en consola del navegador**:
- F12 → Network tab
- Refresh página
- Ver requests a `/backend/products/products`
- ¿Status 200 con JSON de productos?

### Railway CLI no se conecta

```bash
# Re-login
railway logout
railway login

# Re-link project
railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
```

### Vercel CLI no se conecta

```bash
# Re-login
vercel logout
vercel login

# Re-link project (desde apps/web)
cd apps/web
vercel link
```

---

## Comandos Útiles de Referencia

### Git

```bash
# Ver estado
git status

# Ver últimos commits
git log --oneline -10

# Crear rama
git checkout -b feature/nombre

# Commit
git add .
git commit -m "Descripción del cambio"

# Push
git push origin main
```

### Railway

```bash
# Login
railway login

# Link project
railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d

# Ver logs (últimas 100 líneas)
railway logs --service build-and-deploy-webdev-asap --tail 100

# Ver variables de entorno
railway variables

# Deploy servicio
railway up --service build-and-deploy-webdev-asap
```

### Vercel

```bash
# Login
vercel login

# Link project
vercel link

# Deploy a producción
vercel --prod

# Ver logs
vercel logs tu-farmacia
```

### Cargo (Rust)

```bash
# Build
cargo build

# Build release
cargo build --release

# Run
cargo run

# Check (sin compilar binario)
cargo check

# Format
cargo fmt

# Linter
cargo clippy
```

### Bun (Frontend)

```bash
# Instalar dependencias
bun install

# Dev server
bun run dev

# Build producción
bun run build

# Linter
bun run lint
```

---

## Variables de Entorno de Referencia

### Railway - Order Service

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821
FRONTEND_URL=https://tu-farmacia.vercel.app
WEBHOOK_URL=https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
PORT=3003
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway
REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@centerbeam.proxy.rlwy.net:21710
```

**Nota**: Ver `.claude/CONTEXTO-ACTUAL.md` para todas las variables de todos los servicios.

---

## Recursos Adicionales

### Documentación del Proyecto
- `README.md` - Overview general
- `PRODUCCION-MERCADOPAGO.md` - Configuración de MercadoPago
- `.claude/CONTEXTO-ACTUAL.md` - Estado actual completo
- `.claude/PROBLEMA-MERCADOPAGO.md` - Problema pendiente
- `.claude/HISTORIAL-CAMBIOS.md` - Log de cambios

### Documentación Externa
- **Next.js 14**: https://nextjs.org/docs
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **MercadoPago**: https://www.mercadopago.com.cl/developers/es/docs
- **Rust/Axum**: https://docs.rs/axum/latest/axum/

---

**Última actualización**: 2026-01-11
**Tiempo estimado de setup**: 10-15 minutos (sin desarrollo local)
**Tiempo estimado con desarrollo local**: 30-45 minutos (instalación de Rust + PostgreSQL)
