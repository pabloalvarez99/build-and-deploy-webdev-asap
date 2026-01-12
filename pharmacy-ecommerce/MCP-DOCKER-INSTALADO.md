# 🐳 MCP Docker - Instalado y Configurado

## ✅ Estado de la Instalación

El servidor MCP de Docker ha sido instalado y configurado exitosamente en tu sistema.

## 📦 Componentes Instalados

1. **UV Package Manager** (v0.9.24)
   - Ubicación: `C:\Users\pablo\.local\bin`
   - Herramientas: `uv.exe`, `uvx.exe`, `uvw.exe`

2. **docker-mcp** (Servidor MCP)
   - Instalado vía: `uvx docker-mcp`
   - Repositorio: https://github.com/QuantGeekDev/docker-mcp

3. **Configuración en Cursor**
   - Archivo: `C:\Users\pablo\AppData\Roaming\Cursor\User\mcp.json`
   - Estado: ✅ Configurado

## 🔧 Configuración Aplicada

```json
{
  "mcpServers": {
    "docker-mcp": {
      "command": "uvx",
      "args": [
        "docker-mcp"
      ]
    }
  }
}
```

## 🚀 Cómo Usar el Servidor MCP de Docker

### Funcionalidades Disponibles

El servidor MCP de Docker te permite interactuar con Docker directamente desde Cursor usando lenguaje natural. Puedes:

#### 1. **Crear Contenedores**
Crea contenedores Docker standalone:
```
"Crea un contenedor de nginx llamado mi-web en el puerto 8080"
```

#### 2. **Desplegar Stacks con Docker Compose**
Despliega aplicaciones completas con docker-compose:
```
"Despliega un stack de WordPress con MySQL usando docker-compose"
```

#### 3. **Ver Logs de Contenedores**
Obtén los logs de cualquier contenedor:
```
"Muéstrame los logs del contenedor mi-web"
```

#### 4. **Listar Contenedores**
Lista todos los contenedores Docker:
```
"Lista todos los contenedores en ejecución"
```

## 📝 Herramientas MCP Disponibles

### create-container
Crea un contenedor Docker standalone
```json
{
    "image": "nginx:latest",
    "name": "mi-servidor",
    "ports": {"80": "8080"},
    "environment": {"ENV_VAR": "valor"}
}
```

### deploy-compose
Despliega un stack de Docker Compose
```json
{
    "project_name": "mi-app",
    "compose_yaml": "version: '3.8'\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - '8080:80'"
}
```

### get-logs
Obtiene los logs de un contenedor
```json
{
    "container_name": "mi-contenedor"
}
```

### list-containers
Lista todos los contenedores Docker
```json
{}
```

## 🔄 Cómo Activar el Servidor

**IMPORTANTE**: Para que el servidor MCP de Docker esté disponible en Cursor, necesitas:

1. **Reiniciar Cursor completamente**
   - Cierra todas las ventanas de Cursor
   - Vuelve a abrir Cursor

2. **Verificar que esté activo**
   - El servidor MCP se carga automáticamente al iniciar Cursor
   - Podrás usar comandos relacionados con Docker en el chat

## 💡 Ejemplos de Uso

### Ejemplo 1: Desplegar una base de datos PostgreSQL
```
"Crea un contenedor de PostgreSQL llamado mi-db en el puerto 5432 con la contraseña 'mipassword'"
```

### Ejemplo 2: Ver logs de un contenedor problemático
```
"Muéstrame los últimos logs del contenedor order-service"
```

### Ejemplo 3: Listar todos los contenedores
```
"Lista todos los contenedores Docker que tengo, incluyendo los que están detenidos"
```

### Ejemplo 4: Desplegar tu aplicación con docker-compose
```
"Despliega mi aplicación usando el archivo docker-compose.yml del proyecto"
```

## ⚙️ Variables de Entorno (si necesitas configurarlas)

Si necesitas agregar la ruta de UV al PATH permanentemente:

```powershell
# En PowerShell (como administrador)
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Users\pablo\.local\bin",
    "User"
)
```

## 🐞 Resolución de Problemas

### El servidor no responde
1. Verifica que Docker esté en ejecución:
   ```powershell
   docker ps
   ```

2. Verifica que uvx esté disponible:
   ```powershell
   uvx --version
   ```

3. Reinicia Cursor completamente

### Error al ejecutar comandos
- Asegúrate de que Docker Desktop esté ejecutándose
- Verifica que tengas permisos para ejecutar Docker

### Actualizar el servidor MCP
```powershell
uvx --upgrade docker-mcp
```

## 📚 Documentación Adicional

- [Repositorio oficial](https://github.com/QuantGeekDev/docker-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Docker Documentation](https://docs.docker.com/)

## ✨ Próximos Pasos

1. **Reinicia Cursor** para activar el servidor MCP
2. Empieza a usar comandos de Docker en lenguaje natural
3. Prueba con tu proyecto de farmacia para gestionar los contenedores

---

**Nota**: Este servidor MCP te permitirá gestionar tus contenedores Docker (auth-service, product-service, order-service, web) directamente desde Cursor usando comandos naturales.
