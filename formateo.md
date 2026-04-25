# Formateo — Manual de Operaciones de Documentación

> **Claude: lee este archivo AL INICIO de cada sesión, después del SessionStart hook.**
> Es el contrato que mantiene `pharmacy-ecommerce/bitacora.md`, `context.md` y `CLAUDE.md` vivos y veraces.
> Si lo violas, la próxima sesión empieza con información obsoleta. En producción con pagos reales (Webpay LIVE) eso se traduce en bugs reintroducidos y plata real perdida.

---

## 🎯 Entrada Rápida (TL;DR)

Tres docs, tres roles distintos, **una fuente de verdad por hecho**:

| Doc | Pregunta que responde | Naturaleza | Cambia con |
|-----|------------------------|------------|------------|
| `pharmacy-ecommerce/bitacora.md` | "¿Qué pasó? ¿Qué hicimos? ¿Qué decidimos?" | Diario cronológico | Cada cambio funcional, deploy, decisión |
| `context.md` (raíz) | "¿Cómo funciona este equipo? ¿Qué hay disponible ahora?" | Snapshot de estado actual | CLIs, URLs, secretos, fases ERP, entorno |
| `CLAUDE.md` (raíz) | "¿Cómo trabajo en este proyecto?" | Manual operativo | Convenciones, arquitectura, workflow, gotchas |

**Regla absoluta**: nunca pegar el mismo hecho en dos docs. Si dudas, link al canónico.

> ⚠️ **Bitácora vive en `pharmacy-ecommerce/bitacora.md`, NO en la raíz**. La raíz tiene `context.md` y `CLAUDE.md`.

---

## 📍 Matriz Fact → Doc (cero duplicación)

Para cualquier hecho nuevo, encuentra aquí su doc canónico:

| Tipo de hecho | Doc canónico (sección) | Ejemplo |
|---------------|------------------------|---------|
| Feature implementado | `bitacora.md` § Últimos cambios | "Agregado módulo Fidelización con `loyalty_transactions`" |
| Bug arreglado (root cause útil) | `bitacora.md` § Últimos cambios + `CLAUDE.md` § Gotchas si recurrente | "Fix: `isPickup` usa `payment_provider==='store'`, no `!!pickup_code`" |
| Decisión arquitectónica | `bitacora.md` § Decisiones técnicas | "Canjeo solo en retiro tienda — Webpay tiene riesgo de reversión" |
| Nueva URL/dominio | `context.md` § 1 Estado / § 6 Vercel | "Nuevo subdominio: pos.tu-farmacia.cl" |
| CLI instalado o actualizado | `context.md` § 12 CLIs Disponibles | "gh 2.91.0 (winget)" |
| Plugin/MCP de Claude Code agregado | `context.md` § 14 Plugins Claude Code | "context7 — docs actualizadas de librerías" |
| Variable de entorno nueva | `context.md` § 4 Credenciales o `CLAUDE.md` § Variables de entorno | "Resend API key rotada" |
| Convención de código | `CLAUDE.md` § Stack / § Diseño y UI | "Mobile-first 18px font, touch 48px+" |
| Patrón de arquitectura | `CLAUDE.md` § Database / § Autenticación | "`getDb()` async, siempre `await`" |
| Workflow/regla de proceso | `CLAUDE.md` § Workflow Orchestration / § Protocolo de Deploy | "Build local antes de cada push" |
| Trampa conocida (gotcha) | `CLAUDE.md` § Gotchas conocidos + `obsidian-mind/brain/Gotchas.md` | "`firebase-admin` NUNCA en `middleware.ts`" |
| Estado actual de fase ERP | `bitacora.md` § Estado (canónico) → espejo en `context.md` § 1 | "Fidelización: 🚧 en curso" |
| Schema DB cambia | `bitacora.md` § Decisiones + `CLAUDE.md` § Database | "Tabla `loyalty_transactions` agregada" |
| API route nuevo | `bitacora.md` § Últimos cambios + `CLAUDE.md` § API Routes | "POST /api/admin/loyalty/redeem" |
| Migración Cloud SQL ejecutada | `bitacora.md` § Últimos cambios + `context.md` § 9 Arquitectura DB | "prisma db push aplicado a tu-farmacia-db" |

**Reglas de no-duplicación**:
- "Estado actual" tiene espejo intencional en `bitacora.md` y `context.md` § 1. **Fuente:** `bitacora.md`. **Espejo:** `context.md`. Actualiza primero la fuente, copia al espejo.
- Gotchas: `CLAUDE.md` lista los del proyecto; `obsidian-mind/brain/Gotchas.md` es catálogo cross-proyecto. Promueve al vault solo cuando el gotcha es transferible o ya picó dos veces.
- Credenciales viven SOLO en `context.md` § 4 — nunca en bitacora ni CLAUDE.

---

## ⚡ Disparadores (cuándo actualizar)

Cada acción dispara updates específicos. **No esperes a "wrap-up"** — actualiza en el momento.

| Acción | Update inmediato obligatorio |
|--------|------------------------------|
| `git commit -m "feat: X"` | `bitacora.md` § Últimos cambios — entrada con fecha |
| `git commit -m "fix: X"` | `bitacora.md` § Últimos cambios + (si root cause útil) `CLAUDE.md` § Gotchas |
| `git push origin main` (auto-deploy Vercel) | `bitacora.md` § Últimos cambios — confirma deploy verde |
| `prisma db push` exitoso | `bitacora.md` § Decisiones (qué cambió en schema) |
| `npm install -g X` | `context.md` § 12 CLIs Disponibles |
| Nueva env var en Vercel/GitHub Actions | `context.md` § 4 Credenciales o § Vercel |
| Nuevo API route creado | `bitacora.md` § Últimos cambios + `CLAUDE.md` § API Routes |
| Decisión arquitectónica tomada | `bitacora.md` § Decisiones + (si durable) `obsidian-mind/brain/Key Decisions.md` |
| Bug debugeado >30min con root cause no obvio | `CLAUDE.md` § Gotchas + `obsidian-mind/brain/Gotchas.md` |
| Fase ERP completada | Cambia ⏳→✅ en `bitacora.md`, `context.md` § 1, este `formateo.md` |
| Inicio de fase nueva | `bitacora.md` § Próximos pasos detalla + nuevo note en `obsidian-mind/work/active/` |
| Convención de UI/código nueva | `CLAUDE.md` § Diseño y UI / § Stack |
| Plugin Claude Code instalado/quitado | `context.md` § 14 Plugins |

---

## 🛠 Ritual de Actualización (los 7 pasos)

Cuando un disparador se activa:

1. **Identifica doc canónico** usando matriz arriba
2. **Ubica sección correcta** (reusa headers existentes — no crees secciones nuevas sin justificar)
3. **Escribe entrada con fecha** (`YYYY-MM-DD`) y máximo 2 líneas concretas
4. **Verifica entradas previas redundantes** — si quedaron stale, bórralas o márcalas `~~obsoleto~~`
5. **Si el cambio cruza docs** (ej: feature toca convención + agrega API), actualiza todos en el mismo turno
6. **Si el aprendizaje es durable cross-proyecto**, promueve a `obsidian-mind/brain/`
7. **Verifica que el espejo `bitacora→context` quedó sincronizado**

**Nunca** dejes un update "para más tarde". Doc obsoleto miente más que doc inexistente.

---

## 📝 Plantillas de Entrada (copia y rellena)

### `bitacora.md` § Últimos cambios

```markdown
### 2026-04-25 — <Título corto de la sesión>
- ✅ <feature/fix concreto, no "varios cambios">
- ✅ <feature/fix concreto>
- 🐛 Root cause: <problema observable> → fix: <solución>
- 🚀 Deploy: Vercel <deployment-id> verde, https://tu-farmacia.cl OK
- 💾 Schema: <cambio en prisma/schema.prisma + migration aplicada>
- 📝 Nota: <contexto adicional>
```

### `bitacora.md` § Decisiones técnicas

```markdown
**2026-04-25 — <Título de decisión>**
- **Contexto:** <problema o trade-off enfrentado>
- **Decisión:** <qué se eligió, concreto>
- **Razón:** <por qué, idealmente con alternativa rechazada>
- **Reversible si:** <condición que justificaría revisar>
- **Impacto en producción:** <ninguno / requiere migración / requiere comunicación a clientes>
```

### `bitacora.md` § Próximos pasos

```markdown
- [ ] **<Tarea ERP>** — owner: <quien> — target: <fecha o "esta sesión">
  - Subtarea concreta 1
  - Subtarea concreta 2
```

### `context.md` § 12 CLIs Disponibles (fila nueva)

```markdown
| `nombre` | versión | notas (npm global / path completo / requiere PATH) |
```

### `CLAUDE.md` § Gotchas conocidos (entrada nueva)

```markdown
- **<síntoma observable>**: <causa raíz no obvia>. Fix: <solución concreta>. Detectado: 2026-04-25.
```

### `obsidian-mind/brain/Gotchas.md` (promoción cross-proyecto)

```markdown
## Tu Farmacia — <Categoría>

- **<síntoma>**: <causa>. Fix: <solución>. Detectado: 2026-04-25.
```

---

## 🚨 Detección de Drift (auto-checks)

Al inicio de sesión y antes de wrap-up, ejecutar:

| Check | Comando o validación |
|-------|----------------------|
| Última entrada `bitacora.md` >7 días | `git log --since="7 days ago" --oneline` debe coincidir con cambios listados |
| Versiones CLI en `context.md` ≠ reales | `node -v && npm -v && firebase --version && vercel --version && gh --version` |
| URLs en `context.md` no responden | `curl -sI https://tu-farmacia.cl` debe ser 200, ídem `/admin` debe ser 200 o 307→/auth/login |
| `CLAUDE.md` referencia paths inexistentes | `ls pharmacy-ecommerce/apps/web/src/lib/` confirma archivos clave |
| API route listado en CLAUDE.md no existe | `ls pharmacy-ecommerce/apps/web/src/app/api/...` para cada endpoint listado |
| TODO/FIXME en código no listado en próximos pasos | `grep -r "TODO\|FIXME" pharmacy-ecommerce/apps/web/src --include="*.ts" --include="*.tsx" \| head` |
| Estado de fases ERP ≠ realidad | Verifica directorios/rutas de cada fase ERP existen y compilan |
| Gotcha en `CLAUDE.md` ya resuelto en código | Grep el síntoma en código actual; si no aparece, marca `~~obsoleto~~` |
| Build local pasa | `cd pharmacy-ecommerce/apps/web && NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` |
| Vercel deployment último estado | `vercel ls 2>/dev/null \| head -5` debe mostrar último Ready |

Si encuentras drift, **corrígelo antes de hacer cualquier otra cosa**. Drift no detectado se compone — y en este proyecto puede romper Webpay en producción.

---

## 🚫 Anti-patrones (NO hagas esto)

- ❌ "Varios cambios menores" / "Algunas mejoras" — lista cada cambio concreto
- ❌ Entrada sin fecha — toda entrada de bitácora lleva `YYYY-MM-DD`
- ❌ Pegar el mismo hecho en `bitacora.md` y `context.md` sin pensar — usa la matriz
- ❌ Crear sección nueva por capricho — reusa headers existentes
- ❌ Borrar gotchas porque "ya no aplican" sin verificar — son archivo histórico; márcalos `~~obsoleto~~` o documenta resolución
- ❌ Marcar fase ✅ sin verificación real (build verde + deploy verde + URL responde + commit pusheado)
- ❌ Listar TODO en `bitacora.md` § Próximos sin owner ni target
- ❌ Convertir `bitacora.md` en log automático de mensajes git — solo eventos significativos
- ❌ `context.md` como changelog — context refleja estado actual, no histórico
- ❌ `CLAUDE.md` como bitácora — es manual operativo, no diario
- ❌ Hacer `git push origin main` SIN haber actualizado `bitacora.md` — viola Protocolo de Deploy
- ❌ Modificar credenciales en código sin actualizar `context.md` § 4
- ❌ Silenciar errores con `catch {}` vacío (gotcha conocido — siempre exponer error)
- ❌ Usar `npx next build` en lugar de `./node_modules/.bin/next build` (trae versión incorrecta)

---

## ✅ Checklist de Cierre de Sesión

Antes de "wrap up" o cerrar sesión, ejecutar mentalmente:

- [ ] Cambios funcionales del día → `bitacora.md` § Últimos cambios (con fecha)
- [ ] Decisión nueva → `bitacora.md` § Decisiones + (si durable) `obsidian-mind/brain/Key Decisions.md`
- [ ] Gotcha nuevo descubierto → `CLAUDE.md` § Gotchas + `obsidian-mind/brain/Gotchas.md`
- [ ] CLI/herramienta instalada → `context.md` § 12 CLIs
- [ ] API route nuevo → `CLAUDE.md` § API Routes + `bitacora.md`
- [ ] Estado de fase cambió → `bitacora.md`, `context.md` § 1, este `formateo.md` reflejan lo mismo
- [ ] `bitacora.md` § Próximos pasos refleja qué viene
- [ ] No hay entradas duplicadas creadas hoy
- [ ] Drift detection corrió sin hallazgos críticos
- [ ] Build local verde + deploy Vercel verde
- [ ] (Opcional) Commit de docs separado: `git commit -m "docs: actualiza bitacora/context/claude"`

---

## 🔗 Mapa de Referencias Cruzadas

```
formateo.md (este archivo, raíz del repo)
  ├─→ describe → pharmacy-ecommerce/bitacora.md, context.md, CLAUDE.md
  └─→ apunta a → obsidian-mind/brain/, obsidian-mind/work/, obsidian-mind/reference/

pharmacy-ecommerce/bitacora.md (DIARIO — cronológico)
  ├─→ refleja estado en → context.md § 1 Estado actual
  ├─→ decisiones promueven a → obsidian-mind/brain/Key Decisions.md
  └─→ fases ERP activas → obsidian-mind/work/active/

context.md (SNAPSHOT — estado presente)
  ├─→ deriva CLIs/env de → realidad del sistema (drift check)
  ├─→ credenciales canónicas → § 4
  └─→ apunta a → obsidian-mind/reference/Tu Farmacia Architecture.md

CLAUDE.md (MANUAL — cómo trabajar)
  ├─→ convenciones aplican a → todo el código de pharmacy-ecommerce/apps/web
  ├─→ API routes refleja → src/app/api/ real
  └─→ gotchas espejan a → obsidian-mind/brain/Gotchas.md
```

---

## 📦 Estado Vigente del Proyecto (snapshot 2026-04-25)

> Si discrepa con `pharmacy-ecommerce/bitacora.md`, **`bitacora.md` gana** y este snapshot debe corregirse.

| Componente | Estado |
|---|---|
| Next.js 14.2.35 + Tailwind 3 + TypeScript | ✅ Live |
| Firebase Auth (Email/Password) | ✅ Activo |
| Cloud SQL PostgreSQL 15 (GCP) | ✅ Conectado — 1482 productos, 17 categorías |
| Transbank Webpay Plus | ✅ **PRODUCCIÓN ACTIVA** (Commerce: `597053071888`) |
| Retiro en tienda (store pickup) | ✅ Operativo |
| Dark mode | ✅ Completo |
| Admin panel + Mobile bottom nav + Desktop sidebar | ✅ Operativo |
| Emails transaccionales (Resend) | ✅ Configurado |
| Cron limpieza órdenes (3 AM UTC) | ✅ Activo |
| ERP Fase 1 — Proveedores + Compras (OCR Vision API) | ✅ Completado |
| ERP Fase 2 — POS en mostrador + keyboard shortcuts | ✅ Completado |
| ERP Fase 3 — Reportes financieros + dashboard | ✅ Completado |
| Inventario valorizado + ajuste manual stock | ✅ Completado |
| Fidelización (puntos por compra, canje en pickup) | ✅ Completado (Abril 2026) |
| **Próximo:** módulo a definir en sesión nueva | ⏳ Pendiente diseño |

**URLs live:**
- Tienda: `https://tu-farmacia.cl`
- Admin: `https://tu-farmacia.cl/admin`
- Vercel canónico: `https://tu-farmacia.vercel.app`

---

## 🧠 Vault Cross-Reference

`C:\Users\Administrator\Documents\obsidian-mind\` — segundo cerebro persistente cross-proyecto (git-tracked, Obsidian-browsable).

| Qué se promueve al vault | Cuándo |
|--------------------------|--------|
| Decisión arquitectónica → `brain/Key Decisions.md` | Decisión irreversible o de alto impacto |
| Gotcha recurrente → `brain/Gotchas.md` | Bug que ya pasó 2+ veces o transferible a otro proyecto |
| Patrón de implementación → `brain/Patterns.md` | Patrón que se repite cross-feature o cross-proyecto |
| Fase ERP activa → `work/active/Tu Farmacia - <Fase>.md` | Inicio de fase nueva (con frontmatter `status: active`) |
| Fase ERP completada → `work/archive/YYYY/Tu Farmacia - <Fase>.md` | Fin de fase, `git mv` desde `active/` |
| Cambio de arquitectura → `reference/Tu Farmacia Architecture.md` | Cambio de stack o estructura significativo |
| Cambio de objetivos/prioridades → `brain/North Star.md` | Pivote o nueva fase de producto |

Comandos vault desde `obsidian-mind/`:
- `/om-standup` — kickoff con contexto completo (lee North Star + active + recent)
- `/om-dump` — captura rápida de ideas/decisiones (auto-routing)
- `/om-wrap-up` — cierre de sesión: archiva, actualiza índices, captura learnings

---

## 🧭 Bootstrap (sesión nueva, máquina nueva)

Si llegas con cero contexto:

```bash
# 1. Lee este archivo primero
cat formateo.md

# 2. Lee context (entorno + setup completo + credenciales)
cat context.md | head -200

# 3. Lee bitácora (estado + cronología)
cat pharmacy-ecommerce/bitacora.md | head -200

# 4. Lee CLAUDE.md (convenciones + gotchas + protocolos)
cat CLAUDE.md

# 5. Verifica drift
git log --since="14 days ago" --oneline
node -v && npm -v && firebase --version
curl -sI https://tu-farmacia.cl | head -3

# 6. (Opcional) Pull env vars desde Vercel
cd pharmacy-ecommerce/apps/web && vercel env pull .env.local --environment=development

# 7. (Opcional) Carga vault context
cd /c/Users/Administrator/Documents/obsidian-mind && /om-standup
```

---

## ⚠️ Reglas de Producción (Webpay LIVE)

Este proyecto procesa pagos reales. Reglas no negociables:

1. **Nunca** push a `main` sin build local verde
2. **Nunca** modificar `transbank.ts` sin testing en sandbox primero
3. **Nunca** cambiar `TRANSBANK_ENVIRONMENT=production` sin aprobación explícita del usuario
4. **Siempre** `Math.round()` montos antes de pasar a Transbank (CLP sin decimales)
5. **Siempre** `res.ok` check antes de mostrar éxito al cliente (fetch no lanza en 4xx/5xx)
6. **Siempre** restaurar stock al cancelar orden (transacción Prisma atómica)
7. Cualquier cambio que toque `/api/webpay/*` o `/api/store-pickup` → entrada obligatoria en `bitacora.md` § Decisiones con detalle del impacto
