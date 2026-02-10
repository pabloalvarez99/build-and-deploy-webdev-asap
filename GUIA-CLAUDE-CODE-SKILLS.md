# Guia: Sistema de Skills en Claude Code

## Que es esto?

Claude Code tiene un sistema que permite **personalizar como trabaja** en tu proyecto. En vez de explicarle todo cada vez que abres una conversacion, puedes crear archivos que le dan contexto automaticamente y comandos rapidos que ejecutan tareas complejas con una sola instruccion.

Es como entrenar a un asistente: le dejas instrucciones escritas para que siempre sepa como trabajar en TU proyecto.

---

## Los 2 componentes principales

### 1. CLAUDE.md - El Contexto del Proyecto

**Que es:** Un archivo llamado `CLAUDE.md` en la raiz del proyecto que Claude Code lee **automaticamente** cada vez que inicias una conversacion.

**Donde esta:** `CLAUDE.md` (raiz del repositorio)

**Para que sirve:** Le dice a Claude:
- Que stack usa el proyecto (Next.js 14, Supabase, etc.)
- Como hacer build y deploy correctamente
- Estructura de la base de datos
- Errores conocidos que debe evitar (gotchas)
- Reglas de diseno (mobile-first, touch targets 48px+, etc.)

**Ejemplo real de nuestro proyecto:**
```
## Build & Deploy
- Build: `./node_modules/.bin/next build` (NUNCA usar npx)
- Deploy: git push origin main (Vercel auto-deploy)
```

**Beneficio:** Sin este archivo, cada sesion nueva de Claude empieza "desde cero" y podria cometer errores que ya resolvimos (como usar `npx next build` que trae la version incorrecta).

---

### 2. Slash Commands - Comandos Rapidos

**Que son:** Archivos `.md` dentro de `.claude/commands/` que se convierten en comandos que puedes ejecutar escribiendo `/nombre` en Claude Code.

**Donde estan:** `.claude/commands/`

**Como se usan:** En la conversacion con Claude Code, simplemente escribes el nombre del comando:

| Escribes | Que hace |
|----------|----------|
| `/continuar` | Lee la bitacora y HANDOVER.md, revisa git status, y continua con el trabajo pendiente |
| `/deploy` | Ejecuta todo el pipeline: build → git add → commit → push → verificar Vercel |
| `/review` | Revisa el codigo buscando problemas de seguridad, calidad, y buenas practicas |
| `/debug` | Sigue un framework sistematico de 7 pasos para encontrar y arreglar bugs |
| `/handover` | Genera un documento HANDOVER.md con todo lo que se hizo en la sesion |

---

## Nuestros Comandos en Detalle

### `/continuar`
**Archivo:** `.claude/commands/continuar.md`

**Cuando usarlo:** Al iniciar una nueva sesion de Claude Code para retomar el trabajo.

**Que hace:**
1. Lee `pharmacy-ecommerce/bitacora.md` (registro de tareas)
2. Lee `HANDOVER.md` si existe (resumen de sesion anterior)
3. Revisa `git status` y commits recientes
4. Identifica la siguiente tarea pendiente y la ejecuta

**Ejemplo:** Abres Claude Code un dia nuevo, escribes `/continuar`, y Claude automaticamente sabe que estabas trabajando en las categorias y sigue desde ahi.

---

### `/deploy`
**Archivo:** `.claude/commands/deploy.md`

**Cuando usarlo:** Cuando terminas cambios y quieres publicarlos en produccion.

**Que hace:**
1. Corre `./node_modules/.bin/next build` para verificar que no hay errores
2. Muestra los archivos cambiados
3. Hace commit con mensaje descriptivo
4. Push a `origin main` (activa deploy automatico en Vercel)
5. Verifica el estado del deployment en Vercel
6. Actualiza la bitacora

**Importante:** Si el build falla, se detiene y arregla los errores antes de continuar.

---

### `/review`
**Archivo:** `.claude/commands/review.md`

**Cuando usarlo:** Antes de hacer commit, para revisar que el codigo este bien.

**Que revisa:**
- **Seguridad:** SQL injection, XSS, datos expuestos, URLs HTTP
- **Calidad:** Codigo muerto, console.log, errores no manejados
- **Buenas practicas de Tu Farmacia:** formatPrice() para precios, botones de 48px+, inputs con border-2
- **Supabase:** Filtros por category_id (no por join), uso de service client para admin

Cada punto se marca como: OK, WARNING, o CRITICAL.

---

### `/debug`
**Archivo:** `.claude/commands/debug.md`

**Cuando usarlo:** Cuando encuentras un bug y necesitas arreglarlo de forma metodica.

**Los 7 pasos:**
1. **REPRODUCIR** - Identificar los pasos exactos
2. **HIPOTESIS** - Listar 3-5 causas posibles
3. **INVESTIGAR** - Revisar el codigo relevante
4. **CAUSA RAIZ** - Determinar POR QUE ocurre
5. **ARREGLAR** - Implementar la solucion minima
6. **VERIFICAR** - Correr build y explicar como testear
7. **PREVENIR** - Agregar a gotchas si es un patron recurrente

---

### `/handover`
**Archivo:** `.claude/commands/handover.md`

**Cuando usarlo:** Al final de una sesion larga, para que la proxima sesion tenga contexto completo.

**Que genera:** Un archivo `HANDOVER.md` con:
- Que se estaba trabajando
- Que se completo
- Que funciono y que no
- Decisiones tomadas y por que
- Proximos pasos pendientes
- Mapa de archivos importantes

---

## Como crear tus propios comandos

Si necesitas un comando nuevo:

1. Crea un archivo `.md` en `.claude/commands/`
2. El nombre del archivo = nombre del comando
3. Escribe las instrucciones en lenguaje natural

**Ejemplo:** Quieres un comando `/test` que corra pruebas:

```markdown
# Archivo: .claude/commands/test.md

Ejecuta las pruebas del proyecto:
1. Corre `npm test` desde pharmacy-ecommerce/apps/web/
2. Si fallan, muestra cuales fallaron y por que
3. Sugiere fixes para las pruebas que fallen
```

Ahora puedes escribir `/test` y Claude lo ejecuta.

---

## Estructura de archivos

```
build-and-deploy-webdev-asap/
├── CLAUDE.md                          # Contexto automatico del proyecto
├── HANDOVER.md                        # Resumen de ultima sesion
├── GUIA-CLAUDE-CODE-SKILLS.md         # Esta guia
├── .claude/
│   └── commands/
│       ├── continuar.md               # /continuar
│       ├── deploy.md                  # /deploy
│       ├── review.md                  # /review
│       ├── debug.md                   # /debug
│       └── handover.md               # /handover
└── pharmacy-ecommerce/
    └── bitacora.md                    # Registro de tareas del proyecto
```

---

## Resumen rapido

| Concepto | Que es | Donde esta |
|----------|--------|------------|
| CLAUDE.md | Instrucciones que Claude lee automaticamente cada sesion | Raiz del proyecto |
| Slash Commands | Comandos rapidos tipo `/deploy`, `/review` | `.claude/commands/*.md` |
| Bitacora | Registro de todo lo que se ha hecho en el proyecto | `pharmacy-ecommerce/bitacora.md` |
| HANDOVER.md | Resumen de la ultima sesion para continuidad | Raiz del proyecto |

**Lo mas importante:** Estos archivos hacen que Claude Code **no pierda memoria** entre sesiones y trabaje de forma consistente con las reglas de TU proyecto.

---

# Plugins Instalados

Los plugins son extensiones que agregan **capacidades extra** a Claude Code. Se instalan con `/plugin install nombre` y se activan al reiniciar Claude Code. A diferencia de los slash commands (que son archivos `.md` en tu repo), los plugins son paquetes externos con logica mas compleja.

## Como gestionar plugins

```bash
# Ver plugins instalados
/plugin

# Instalar un plugin
/plugin install nombre

# Actualizar un plugin
/plugin update nombre

# Agregar un marketplace (repositorio de plugins)
/plugin marketplace add usuario/repo
```

---

## 1. Superpowers (obra/superpowers)
**El mas completo.** Un sistema de desarrollo de software entero con flujo de trabajo automatizado.

**Que hace:** Cuando le pides construir algo, NO se lanza directo a escribir codigo. En cambio:
1. **Brainstorming** — Te hace preguntas para entender que necesitas realmente
2. **Worktrees** — Crea una rama aislada para trabajar sin afectar tu codigo
3. **Planificacion** — Divide el trabajo en tareas pequenas (2-5 min cada una)
4. **Desarrollo con subagentes** — Lanza agentes paralelos que ejecutan cada tarea
5. **TDD** — Escribe tests ANTES del codigo (Red-Green-Refactor)
6. **Code Review** — Revisa el codigo entre tareas
7. **Finalizacion** — Verifica todo y ofrece opciones (merge, PR, etc.)

**Comandos disponibles:**

| Comando | Que hace |
|---------|----------|
| (automatico) | Se activa solo cuando empiezas a construir algo |

**Skills incluidos (se activan automaticamente):**
- `brainstorming` — Refina ideas antes de escribir codigo
- `writing-plans` — Crea planes de implementacion detallados
- `subagent-driven-development` — Ejecuta tareas con agentes paralelos
- `test-driven-development` — TDD estricto (test primero, codigo despues)
- `systematic-debugging` — Debugging en 4 fases para encontrar la causa raiz
- `verification-before-completion` — Verifica que realmente funciona antes de decir "listo"
- `using-git-worktrees` — Trabaja en ramas aisladas
- `requesting-code-review` / `receiving-code-review` — Flujo de code review
- `finishing-a-development-branch` — Opciones para merge/PR al terminar

**Cuando usarlo:** Para features complejos que tocan multiples archivos y necesitan planificacion. No es necesario para cambios simples.

**Filosofia:** Test-Driven Development, YAGNI (no construir de mas), simplicidad ante todo.

---

## 2. Feature Dev (Anthropic)
**Desarrollo guiado de features** con 7 fases estructuradas y agentes especializados.

**Comando:**
```
/feature-dev Agregar autenticacion OAuth
```

**Las 7 fases:**
1. **Discovery** — Entiende que necesitas construir
2. **Exploracion del codebase** — Lanza 2-3 agentes que analizan tu codigo existente
3. **Preguntas clarificadoras** — Resuelve ambiguedades antes de disenar
4. **Diseno de arquitectura** — Propone 2-3 enfoques con pros/contras
5. **Implementacion** — Construye el feature (solo despues de tu aprobacion)
6. **Review de calidad** — 3 agentes revisan bugs, calidad, y convenciones
7. **Resumen** — Documenta que se hizo

**Agentes especializados:**
- `code-explorer` — Analiza features existentes, traza flujos de ejecucion
- `code-architect` — Disena arquitectura con multiples enfoques
- `code-reviewer` — Revisa bugs, calidad, y convenciones del proyecto

**Cuando usarlo:** Para features medianos-grandes que necesitan entender el codebase antes de implementar.

---

## 3. Code Review (Anthropic)
**Revision automatizada de Pull Requests** usando 4 agentes en paralelo.

**Comando:**
```
/code-review
```

**Que hace:**
1. Lee las guias de `CLAUDE.md`
2. Lanza 4 agentes en paralelo:
   - 2 agentes verifican cumplimiento de `CLAUDE.md`
   - 1 agente busca bugs obvios
   - 1 agente analiza historial de git para contexto
3. Cada issue recibe un puntaje de confianza (0-100)
4. Solo reporta issues con confianza >= 80 (filtra falsos positivos)
5. Publica un comentario en el PR con los issues encontrados

**Cuando usarlo:** En Pull Requests antes de hacer merge. Automaticamente omite PRs cerrados, draft, o ya revisados.

---

## 4. Commit Commands (Anthropic)
**Simplifica tu flujo de git** con comandos rapidos.

| Comando | Que hace |
|---------|----------|
| `/commit` | Analiza cambios, genera mensaje de commit, y crea el commit |
| `/commit-push-pr` | Commit + push + crea Pull Request en GitHub (todo en un paso) |
| `/clean_gone` | Limpia ramas locales que ya fueron eliminadas del remoto |

**Cuando usarlo:** En tu flujo diario de git. `/commit` para commits rapidos, `/commit-push-pr` cuando estas listo para crear un PR.

---

## 5. Frontend Design (Anthropic)
**Genera interfaces frontend de alta calidad** que evitan la estetica generica de IA.

**Como funciona:** Claude lo usa automaticamente cuando le pides crear componentes de frontend. Genera:
- Decisiones esteticas audaces (no generico)
- Tipografia y paletas de colores distintivas
- Animaciones y detalles visuales de alto impacto
- Codigo listo para produccion

**Ejemplo de uso:**
```
"Crea un dashboard para monitoreo de ventas"
"Diseña una landing page para la farmacia"
"Haz un panel de settings con dark mode"
```

**Cuando usarlo:** Se activa automaticamente al pedir trabajo de frontend.

---

## 6. Context7 (Anthropic)
**Documentacion actualizada** de cualquier libreria directamente en tu sesion.

**Como funciona:** Cuando Claude necesita consultar documentacion de una libreria (React, Next.js, Supabase, etc.), Context7 busca la documentacion mas reciente en vez de depender del conocimiento interno de Claude (que puede estar desactualizado).

**Ejemplo:** Si preguntas "como usar useSearchParams en Next.js 14", Context7 busca la documentacion real de Next.js 14 en vez de adivinar.

**Cuando se usa:** Automaticamente cuando Claude necesita referencia de librerias.

---

## 7. Claude-Mem (thedotmack)
**Memoria persistente** entre sesiones de Claude Code.

**Que hace:** Guarda observaciones, decisiones, y patrones en una base de datos de busqueda semantica que persiste entre sesiones.

**Comandos:**

| Comando | Que hace |
|---------|----------|
| `/claude-mem:make-plan` | Crea un plan de implementacion con descubrimiento de documentacion |
| `/claude-mem:do` | Ejecuta un plan usando subagentes |
| `/claude-mem:mem-search` | Busca en la memoria persistente ("como hicimos X la ultima vez?") |

**Flujo de busqueda en 3 pasos:**
1. `search(query)` — Busca en el indice
2. `timeline(anchor=ID)` — Obtiene contexto alrededor de los resultados
3. `get_observations([IDs])` — Trae detalles completos solo de los filtrados

**Cuando usarlo:** Para recordar decisiones de sesiones anteriores, encontrar soluciones que ya usaste, y mantener continuidad entre sesiones.

---

## 8. Code Simplifier (Anthropic)
**Simplifica y refina codigo** para mayor claridad y mantenibilidad.

**Que hace:** Revisa el codigo recien modificado (o el que le indiques) y lo simplifica:
- Mejora legibilidad
- Mantiene consistencia
- Reduce complejidad innecesaria
- **Preserva toda la funcionalidad** (no elimina features)

**Cuando usarlo:** Despues de implementar algo que quedo complejo o dificil de leer.

---

## 9. TypeScript LSP (Anthropic)
**Servidor de lenguaje TypeScript/JavaScript** para Claude Code.

**Que hace:** Provee inteligencia de codigo como un IDE:
- **Go to definition** — Salta a la definicion de una funcion/variable
- **Find references** — Encuentra todos los usos de algo
- **Error checking** — Detecta errores de tipo en tiempo real

**Extensiones soportadas:** `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, `.cjs`

**Requisito:** Necesita TypeScript Language Server instalado globalmente:
```bash
npm install -g typescript-language-server typescript
```

**Cuando se usa:** Automaticamente cuando trabajas con archivos TypeScript/JavaScript.

---

## 10. GitHub (Anthropic)
**Integracion con GitHub** para operaciones de repositorio.

**Que hace:** Permite a Claude interactuar directamente con GitHub:
- Ver y gestionar issues
- Ver y crear Pull Requests
- Ver checks y workflows
- Trabajar con releases

**Cuando se usa:** Automaticamente cuando necesitas interactuar con GitHub.

---

## 11. Serena (Anthropic)
**Navegacion inteligente de codigo** usando analisis semantico.

**Que hace:** Entiende la estructura de tu codigo a nivel semantico (no solo texto):
- Navega por simbolos, clases, funciones
- Entiende herencia y dependencias
- Busca por significado, no solo por nombre

**Cuando se usa:** Automaticamente para exploracion de codebase mas inteligente.

---

## Resumen de todos los plugins

| Plugin | Para que sirve | Comando principal |
|--------|---------------|-------------------|
| **Superpowers** | Flujo de desarrollo completo (plan → TDD → review) | (automatico) |
| **Feature Dev** | Desarrollo guiado de features en 7 fases | `/feature-dev` |
| **Code Review** | Revision automatizada de PRs (4 agentes) | `/code-review` |
| **Commit Commands** | Git simplificado (commit, push, PR) | `/commit`, `/commit-push-pr` |
| **Frontend Design** | Interfaces de alta calidad visual | (automatico) |
| **Context7** | Documentacion actualizada de librerias | (automatico) |
| **Claude-Mem** | Memoria persistente entre sesiones | `/claude-mem:mem-search` |
| **Code Simplifier** | Simplifica codigo complejo | (automatico) |
| **TypeScript LSP** | Inteligencia de codigo TS/JS | (automatico) |
| **GitHub** | Integracion con GitHub | (automatico) |
| **Serena** | Navegacion semantica de codigo | (automatico) |

### Cuales son automaticos vs manuales?
- **Automaticos** (no necesitas hacer nada): Frontend Design, Context7, Code Simplifier, TypeScript LSP, GitHub, Serena, Superpowers
- **Manuales** (escribes el comando): `/feature-dev`, `/code-review`, `/commit`, `/commit-push-pr`, `/clean_gone`, `/claude-mem:make-plan`, `/claude-mem:do`, `/claude-mem:mem-search`
