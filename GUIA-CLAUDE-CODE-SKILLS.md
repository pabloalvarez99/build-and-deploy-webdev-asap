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
