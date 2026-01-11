# Solución: Trabajar Sin MCP Servers en Cursor

**Fecha**: 2026-01-11  
**Situación**: Los MCP servers externos no están disponibles en Cursor, pero podemos usar herramientas nativas

---

## Estado Actual

✅ **FileSystem MCP**: Funciona ocasionalmente (pero no aparece en listado)  
❌ **MercadoPago MCP**: No disponible en Cursor  
❌ **PostgreSQL MCP**: No disponible en Cursor  
❌ **GitHub MCP**: No disponible en Cursor  

---

## Solución: Usar Herramientas Nativas de Cursor

Cursor tiene herramientas integradas que son igual de útiles:

### ✅ Herramientas Disponibles

| Necesidad | Herramienta Nativa de Cursor |
|-----------|------------------------------|
| **Leer archivos** | `read_file` (ya disponible) |
| **Buscar código** | `codebase_search` (ya disponible) |
| **Buscar texto** | `grep` (ya disponible) |
| **Ejecutar comandos** | `run_terminal_cmd` (ya disponible) |
| **Búsqueda web** | `web_search` (ya disponible) |
| **Git/GitHub** | Extensiones de GitHub (integradas) |

---

## Alternativas por Funcionalidad

### 1. Consultar Base de Datos PostgreSQL

**En lugar de PostgreSQL MCP**, usa:

#### Opción A: Terminal con psql
```bash
# Conectar a Railway PostgreSQL
psql "postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway"
```

#### Opción B: Código en tu aplicación
- Crear endpoint temporal en Rust para consultas
- Usar `codebase_search` para ver las migraciones
- Revisar estructura en `database/migrations/`

#### Opción C: Railway Dashboard
- Ir a: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
- Click en PostgreSQL → Query

### 2. Consultar Documentación de MercadoPago

**En lugar de MercadoPago MCP**, usa:

#### Opción A: Web Search (ya disponible)
Puedo buscar en la web información actualizada de MercadoPago

#### Opción B: Panel de MercadoPago
- Integration Quality: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
- Documentation: https://www.mercadopago.com.cl/developers/es/docs

#### Opción C: Código del proyecto
- Revisar `apps/order-service/src/handlers/checkout.rs`
- Revisar `apps/order-service/src/models/order.rs`
- Revisar `.claude/PROBLEMA-MERCADOPAGO.md`

### 3. Gestión de GitHub

**En lugar de GitHub MCP**, usa:

#### Opción A: GitHub CLI (gh)
```bash
# Instalar GitHub CLI
winget install GitHub.cli

# Autenticarse
gh auth login

# Crear issue
gh issue create --title "Título" --body "Descripción"

# Ver issues
gh issue list

# Crear PR
gh pr create --title "Título" --body "Descripción"
```

#### Opción B: Terminal con git
```bash
# Ver estado
git status

# Commit
git add .
git commit -m "Mensaje"

# Push
git push origin main
```

#### Opción C: Extensiones de GitHub en Cursor
- GitLens (ya integrado)
- GitHub Pull Requests (ya integrado)

### 4. Gestión de Archivos

**FileSystem MCP funciona**, pero también tenemos:

#### Herramientas nativas:
- `read_file` - Leer archivos
- `codebase_search` - Buscar en código
- `grep` - Buscar texto
- `list_dir` - Listar directorios

---

## Workflow Recomendado

### Para trabajar en el proyecto sin MCP:

1. **Leer código**: Usa `read_file` o `codebase_search`
2. **Buscar información**: Usa `web_search` para documentación
3. **Consultar BD**: Usa Railway Dashboard o `run_terminal_cmd` con psql
4. **Git/GitHub**: Usa GitHub CLI o extensiones integradas
5. **Ejecutar comandos**: Usa `run_terminal_cmd`

---

## Ejemplos Prácticos

### Ejemplo 1: Consultar tablas de PostgreSQL

**Con PostgreSQL MCP** (no disponible):
```
"Muéstrame las tablas usando PostgreSQL MCP"
```

**Solución práctica**:
1. Usar `read_file` para ver migraciones
2. O usar Railway Dashboard
3. O crear query en código Rust

### Ejemplo 2: Consultar documentación MercadoPago

**Con MercadoPago MCP** (no disponible):
```
"Consulta la documentación de MercadoPago sobre calidad de integración"
```

**Solución práctica**:
1. Usar `web_search` para buscar información
2. Revisar `.claude/PROBLEMA-MERCADOPAGO.md`
3. Ir directamente al panel de MercadoPago

### Ejemplo 3: Crear issue en GitHub

**Con GitHub MCP** (no disponible):
```
"Crea un issue en GitHub sobre el problema de MercadoPago"
```

**Solución práctica**:
```bash
gh issue create \
  --title "Resolver problema botón MercadoPago deshabilitado" \
  --body "Ver .claude/PROBLEMA-MERCADOPAGO.md"
```

---

## Conclusión

**No necesitas MCP servers para trabajar eficientemente en este proyecto.**

Las herramientas nativas de Cursor son suficientes:
- ✅ Leer y editar código
- ✅ Buscar información
- ✅ Ejecutar comandos
- ✅ Consultar base de datos (vía Railway o código)
- ✅ Gestionar Git/GitHub (vía CLI o extensiones)

---

## Próximos Pasos

1. **Continuar con el problema actual**: Resolver el problema de MercadoPago
2. **Usar herramientas nativas**: No depender de MCP servers
3. **Si necesitas funcionalidad específica**: Usar la alternativa recomendada arriba

---

**Nota**: Si en el futuro Cursor soporta mejor los MCP servers, podemos intentar configurarlos nuevamente. Por ahora, las herramientas nativas son más que suficientes.
