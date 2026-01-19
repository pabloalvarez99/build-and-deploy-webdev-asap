# Plan de Mejoras - Panel de Administracion

## Estado: En Progreso

---

## Mejoras Completadas

### Dashboard con Graficos
- [x] Grafico de linea: Ventas ultimos 7 dias
- [x] Grafico de torta: Ordenes por estado
- [x] Grafico de barras: Top productos
- [x] KPIs mejorados con ventas totales
- [x] Soporte parcial modo oscuro

---

## Mejoras Pendientes (Por Prioridad)

### 1. Layout Admin con Sidebar (ALTA)

Crear `apps/web/src/app/admin/layout.tsx`:

```tsx
// Estructura del layout
<div className="flex min-h-screen">
  <Sidebar />           // Navegacion lateral
  <main className="flex-1">
    <Header />          // Breadcrumbs + acciones
    {children}          // Contenido de pagina
  </main>
</div>
```

Sidebar debe incluir:
- Logo Tu Farmacia
- Links: Dashboard, Productos, Ordenes, Categorias
- Badge ordenes pendientes
- Badge stock critico
- Info usuario + logout
- Colapsable en mobile

### 2. CRUD Completo Categorias (ALTA)

Agregar en `lib/api.ts`:
```typescript
updateCategory: (token, id, data) => PUT /admin/categories/:id
deleteCategory: (token, id) => DELETE /admin/categories/:id
```

Modificar `admin/categorias/page.tsx`:
- Boton editar en cada fila
- Boton eliminar con confirmacion
- Modal de edicion

### 3. Command Palette - Cmd+K (ALTA)

Crear `components/admin/CommandPalette.tsx`:
- Modal con input de busqueda
- Buscar productos, ordenes
- Acciones rapidas (nuevo producto, etc)
- Navegacion con flechas

### 4. Duplicar Producto (MEDIA)

En `admin/productos/page.tsx`:
- Agregar boton "Duplicar" en acciones
- Copia datos, agrega "(copia)" al nombre
- Abre modal edicion pre-llenado

### 5. Filtros Avanzados Ordenes (MEDIA)

En `admin/ordenes/page.tsx`:
- Filtro rango de fechas
- Filtro rango de monto
- Busqueda por email cliente
- Exportar CSV

### 6. Timeline Estado Orden (MEDIA)

En `admin/ordenes/[id]/page.tsx`:
- Mostrar progreso visual
- Fechas de cada cambio de estado

### 7. Notificaciones (BAJA)

Crear `components/admin/NotificationBell.tsx`:
- Polling cada 30 seg
- Nueva orden, stock critico

### 8. Modo Oscuro Completo (BAJA)

- Toggle en sidebar
- Guardar preferencia localStorage
- CSS variables para colores

---

## Archivos a Crear

```
apps/web/src/
├── app/admin/layout.tsx          # Layout con sidebar
├── components/admin/
│   ├── Sidebar.tsx               # Navegacion lateral
│   ├── CommandPalette.tsx        # Busqueda global
│   ├── Breadcrumbs.tsx           # Migas de pan
│   └── NotificationBell.tsx      # Notificaciones
└── hooks/
    ├── useAdminShortcuts.ts      # Atajos teclado
    └── useTheme.ts               # Modo oscuro
```

---

## Notas de Implementacion

1. **Sidebar**: Usar estado en localStorage para recordar si esta colapsado
2. **Command Palette**: Usar portal para renderizar sobre todo
3. **Graficos**: Ya instalado recharts, solo agregar mas graficos si necesario
4. **Backend**: Los endpoints de categorias (PUT/DELETE) ya existen en el backend
