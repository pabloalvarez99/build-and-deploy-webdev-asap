# Tu Farmacia — Project Context

E-commerce + ERP para farmacia en Coquimbo, Chile (adultos mayores).
**Live**: https://tu-farmacia.cl · **Admin**: /admin · **Web app**: `pharmacy-ecommerce/apps/web`

## Stack (esencial)
Next.js 14.2.35 · Tailwind 3 · TS · Firebase Auth · Cloud SQL Postgres 15 (proyecto `tu-farmacia-prod`, sin RLS, sin Supabase) · Prisma 7 · Transbank Webpay Plus PROD (commerce `597053071888`) · Resend · Zustand · Recharts · Vercel auto-deploy (`git push origin main`).

## Reglas siempre activas

1. **Build local antes de push**:
   ```bash
   cd pharmacy-ecommerce/apps/web
   NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
   ```
   NUNCA `npx next build` (cache → Next 16). Vercel root: `pharmacy-ecommerce/apps/web`.

2. **Nunca terminar prompt sin push** → `git add … && git commit && git push origin main`.

3. **Auth**: `getAdminUser()` / `getAuthenticatedUser()` en `src/lib/firebase/api-helpers.ts`. `middleware.ts` usa `decodeJwtPayload()` (Edge). `firebase-admin` NUNCA en middleware. `getDb()` es async.

4. **Bash paths Unix** (`/c/Users/Administrator/...`). `gcloud` path completo: `"/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"`.

5. **Bitácora dual**: cada cambio significativo → append en (a) `pharmacy-ecommerce/bitacora.md` (repo, git history) y (b) `C:/Users/Administrator/Documents/obsidian-mind/work/active/tu-farmacia/bitacora.md` (vault, búsqueda). Después actualizar `work/active/tu-farmacia/erp-log-index.md` con la nueva línea.

## Vault Obsidian — leer bajo demanda

Ubicación: `C:/Users/Administrator/Documents/obsidian-mind/`

| Tarea actual | Leer primero |
|---|---|
| Tocar `/api/*` | `reference/tu-farmacia-api-routes.md` |
| Tocar `prisma/`, schema, queries, migración | `reference/tu-farmacia-db.md` |
| Tocar páginas/rutas frontend | `reference/tu-farmacia-pages.md` |
| Configurar env vars, Vercel, build | `reference/tu-farmacia-env-deploy.md` |
| UI/styling | `reference/tu-farmacia-ui.md` |
| Histórico ERP / decisiones pasadas | `work/active/tu-farmacia/erp-log-index.md` → `bitacora.md` |
| Patterns/Decisions/North Star | `brain/Patterns.md`, `brain/Key Decisions.md`, `brain/North Star.md` |
| Antes de debug | `brain/Gotchas.md` |
| Stack/infra detallado | `reference/Tu Farmacia Architecture.md` |

## CLI-first (PRIORIDAD MÁXIMA)
**Toda operación → CLI primero.** No GUI, no MCP, no clicks. Si falta CLI para una tarea → recomendar instalación inmediata (1 línea: comando exacto). Listar todas las CLIs ya disponibles antes de fallback manual.

CLIs disponibles (verificadas):
- `gh` `git` `npm` `gcloud` `vercel` (v52) — repo/build/deploy
- `rg` `bat` `fd` `fzf` `delta` `glow` `jq` `curl` — search/file/render
- `obs` (Obsidian vault, ver abajo) · `prisma` (`./node_modules/.bin/prisma`) · `rtk`

## Vault tooling
- **`obs`** (Yakitrak/notesmd-cli, en `/c/Users/Administrator/bin/obs.exe`):
  - `obs search-content "<term>"` — búsqueda full-text vault
  - `obs search "<note>"` — fuzzy find nota
  - `obs print "<note>"` — imprimir contenido
  - `obs create/move/delete/frontmatter/daily/list` — CRUD notas
- `glow <path>` — render markdown terminal
- `rg <q> C:/Users/Administrator/Documents/obsidian-mind/` — alt rápido
- Abrir en app Obsidian: `start "" "obsidian://open?vault=obsidian-mind&file=<NoteName>"`
- SessionStart hook (`.claude/hooks/vault-hint.sh`) sugiere refs según archivos cambiados — leer hints, NO duplicar lectura.

## Workflow
- Plan mode para tareas no-triviales (3+ pasos / decisión arquitectural).
- Subagentes para research/exploración paralela.
- Tras corrección del usuario → registrar lección en `tasks/lessons.md` y/o `brain/Gotchas.md`.
- Verificar antes de marcar completo. Senior dev standard.
- **CLI-first siempre.** Ver sección CLI arriba. NUNCA MCP. Si falta CLI → recomendar `npm/choco/cargo install <pkg>` y continuar.
