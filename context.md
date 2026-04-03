# Tu Farmacia — Contexto de Herramientas y Entorno

> **Para el agente que retome esta sesión:** Este archivo documenta todo lo disponible en este equipo y repositorio para Claude Code.
> Última actualización: 2026-04-03

---

## 1. Sistema Operativo y Entorno

- **OS:** Windows 11 Pro (Build 26200)
- **Shell:** bash (Git Bash / MinGW64) — usar rutas Unix (`/c/Users/Pablo/...`) no Windows
- **Cuenta gcloud:** timadapa@gmail.com
- **CWD del proyecto:** `C:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap`
- **Web app:** `pharmacy-ecommerce/apps/web`

---

## 2. CLIs Instalados en bash

| CLI | Versión | Notas |
|-----|---------|-------|
| `node` | v24.13.0 | Runtime principal |
| `npm` | 11.6.2 | Package manager |
| `pnpm` | 10.32.1 | Package manager alternativo |
| `vercel` | 50.13.1 | Deploy + env vars. `.vercel/project.json` en raíz apunta a `prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7` |
| `git` | 2.53.0 | Control de versiones |
| `gcloud` | SDK 563.0.0 | Google Cloud (autenticado como timadapa@gmail.com) |
| `firebase` | 15.12.0 | Firebase CLI |
| `cargo` | 1.93 | Rust package manager |
| `rustup` | 1.28 | Rust toolchain manager |
| `docker` | 29.2.1 | Contenedores |
| `curl` | MinGW64 | HTTP requests |

**Requieren path completo desde bash (no en PATH automáticamente):**
- `gh` v2.89.0 — instalado en `/c/Program Files/GitHub CLI/gh.exe`. Autenticado como pabloalvarez99. Agregar al PATH: `echo 'export PATH="$PATH:/c/Program Files/GitHub CLI"' >> ~/.bashrc`
- `flyctl` — no instalado
- `python` — no disponible en PATH

---

## 3. Proyecto — Stack Técnico

- **Framework:** Next.js 14.1.0 (App Router) + Tailwind CSS + TypeScript
- **DB + Auth:** Supabase — project ref `jvagvjwrjiekaafpjbit`
- **Pagos:** Transbank Webpay Plus (producción activa)
  - Commerce code: `597053071888`
  - Environment: production
- **Deploy:** Vercel — auto-deploy via `git push origin main`
  - URL: https://tu-farmacia.cl / https://tu-farmacia.vercel.app
  - Admin: https://tu-farmacia.vercel.app/admin
  - Team: `team_slBDUpChUWbGxQNGQWmWull3`
  - Project ID: `prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7`
- **Cart:** Zustand + localStorage
- **Auth:** Supabase Auth + Zustand store

---

## 4. Build & Deploy — Reglas Críticas

```bash
# Build — SIEMPRE desde apps/web/, NUNCA npx (trae Next.js 16)
cd pharmacy-ecommerce/apps/web
./node_modules/.bin/next build

# Deploy — push a main dispara auto-deploy en Vercel
git push origin main
```

- **Vercel root dir:** `pharmacy-ecommerce/apps/web` (configurado en proyecto Vercel)
- **`.vercel/project.json`** debe estar en la raíz del repo para `vercel deploy --prod`
- **CRLF bug Windows:** usar `printf` en vez de `echo` para env vars (echo agrega `\r`)

---

## 5. Plugins Claude Code Instalados (24 plugins)

### Navegación y Código
| Plugin | Para qué sirve |
|--------|---------------|
| `serena` | Navegación semántica del codebase (find_symbol, get_symbols_overview) |
| `typescript-lsp` | LSP para TypeScript/TSX — hover types, go-to-definition |
| `context7` | Docs actualizadas de librerías (Next.js, Tailwind, Supabase, etc.) |
| `claude-mem` | Memoria persistente entre sesiones (cross-session search) |

### Desarrollo y Arquitectura
| Plugin | Para qué sirve |
|--------|---------------|
| `feature-dev` | Explorar codebase + arquitectura de features + code review |
| `superpowers` | Brainstorming, planes, ejecución paralela, debugging sistemático |
| `frontend-design` | UI profesional con alta calidad visual |
| `code-review` | Revisión de código contra el plan |
| `code-simplifier` | Simplificar y refactorizar código |

### Plataforma
| Plugin | Para qué sirve |
|--------|---------------|
| `vercel` | Deploy, env vars, logs, documentación Vercel |
| `supabase` | Conexión directa a Supabase (queries, auth, RLS) |
| `playwright` | Testing E2E en browser (navegación, screenshots, clicks) |

### Git y CI/CD
| Plugin | Para qué sirve |
|--------|---------------|
| `commit-commands` | `/commit`, `/commit-push-pr` — commits y PRs automáticos |
| `ralph-loop` | Loop de tareas repetitivas |
| `claude-code-setup` | Hooks y configuración de Claude Code |
| `claude-md-management` | Mejorar y revisar CLAUDE.md |

### Otros
| Plugin | Para qué sirve |
|--------|---------------|
| `security-guidance` | Revisión de seguridad |
| `plugin-dev` | Crear nuevos plugins/skills |
| `skill-creator` | Crear nuevos skills |
| `gopls-lsp` | LSP para Go |
| `rust-analyzer-lsp` | LSP para Rust |
| `kotlin-lsp` | LSP para Kotlin |
| `pyright-lsp` | LSP para Python |
| `railway` | Deploy en Railway |

---

## 6. Skills Disponibles (slash commands)

```
/commit          — Crear commit git con mensaje automático
/commit-push-pr  — Commit + push + abrir PR
/deploy          — Pipeline completo de deploy Tu Farmacia
/review          — Code review de archivos modificados
/debug           — Framework de debugging sistemático
/continuar       — Leer estado del proyecto y continuar
/handover        — Generar HANDOVER.md completo
/simplify        — Simplificar código recién modificado

Superpowers:
/brainstorming          — Pensar soluciones antes de implementar
/writing-plans          — Escribir plan de implementación
/executing-plans        — Ejecutar plan con subagentes
/dispatching-parallel-agents — Lanzar múltiples agentes en paralelo
/systematic-debugging   — Debugging sistemático
/verification-before-completion — Verificar antes de marcar completo

Vercel:
/vercel:nextjs    — Guía Next.js App Router
/vercel:env-vars  — Manejo de variables de entorno
/vercel:deployments-cicd — Deploy y CI/CD
/vercel:shadcn    — Componentes shadcn/ui
```

---

## 7. MCP Servers (externos)

Sin MCP servers configurados en `~/.claude/settings.json` a nivel global.
Los MCP servers que aparecen en sesión (plugin:vercel, plugin:supabase, plugin:playwright, plugin:serena, plugin:context7) son provistos por los plugins instalados, no por configuración manual.

---

## 8. Archivos Clave del Proyecto

```
CLAUDE.md                          — Reglas para Claude Code (LEER PRIMERO)
bitacora.md                        — Historial completo de cambios
context.md                         — Este archivo
pharmacy-ecommerce/apps/web/
  src/
    app/                           — Páginas (App Router)
      page.tsx                     — Homepage
      producto/[slug]/page.tsx     — Detalle producto
      carrito/page.tsx             — Carrito
      checkout/page.tsx            — Checkout (Webpay + Retiro)
      checkout/reservation/        — Código de retiro
      checkout/webpay/             — Success/error Webpay
      mis-pedidos/                 — Historial de pedidos
      admin/                       — Panel admin
      auth/                        — Login/registro
      api/                         — API Routes
        webpay/                    — Transbank Webpay Plus
        store-pickup/              — Retiro en tienda
        admin/                     — CRUD admin
        cron/                      — Limpieza de órdenes
    components/
      Navbar.tsx                   — Navbar con toggle dark mode
      WhatsAppButton.tsx           — Botón flotante WhatsApp
    hooks/
      useTheme.ts                  — Dark mode hook (localStorage: 'theme')
    lib/
      api.ts                       — productApi, orderApi
      supabase/                    — Clients (anon + service role)
      transbank.ts                 — Webpay Plus client
    store/
      cart.ts                      — Zustand cart (localStorage)
      auth.ts                      — Zustand auth (Supabase)
    app/globals.css                — Dark mode palette overrides
  tailwind.config.js               — darkMode: 'class'
  .vercel/project.json             — Link al proyecto Vercel
vercel.json                        — Cron config (cleanup-orders)
.vercel/project.json               — En RAÍZ del repo (para vercel deploy)
```

---

## 9. Estado Actual del Proyecto (Abril 2026)

- ✅ E-commerce operativo en producción (https://tu-farmacia.cl)
- ✅ Transbank Webpay Plus activo en producción (Commerce: `597053071888`)
- ✅ Retiro en tienda con código de 6 dígitos (48h validez)
- ✅ Dark mode completo + elegante (paleta warm-neutral)
- ✅ Responsividad móvil corregida (320px-375px pantallas pequeñas)
- ✅ Productos con receta → solo WhatsApp (no carrito)
- ✅ Confirmación WhatsApp antes de pago Webpay
- ✅ 1189 productos en Supabase, 17 categorías
- ✅ Admin panel con gestión de productos/órdenes
- 📋 Pendiente: bulk activation/deactivation de productos en admin

---

## 10. Para Retomar Desde Otro PC

```bash
git clone https://github.com/pabloalvarez99/build-and-deploy-webdev-asap.git
cd build-and-deploy-webdev-asap

# Leer primero (en este orden):
cat CLAUDE.md          # reglas para Claude Code
cat bitacora.md        # historial completo del proyecto
cat context.md         # herramientas disponibles (este archivo)

# Instalar dependencias
cd pharmacy-ecommerce/apps/web
npm install

# Build local
./node_modules/.bin/next build

# Deploy → simplemente push a main
git push origin main
```

---

*Última actualización: 2026-04-03 — Dark mode elegante + responsividad móvil completa.*
