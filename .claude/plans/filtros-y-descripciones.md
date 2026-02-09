# Plan: Sistema de Filtros Profesional + Descripciones Estructuradas

## Contexto

La tienda Tu Farmacia tiene dos problemas principales:
1. **Filtros primitivos**: Solo un dropdown de categorias (mal etiquetado como "laboratorios"). La API ya soporta filtrar por laboratorio, tipo receta, rango de precio, principio activo - pero el UI no los expone.
2. **Descripciones inútiles**: Dump mecánico de metadata ("Acción terapéutica: X. Principio activo: Y. Laboratorio: Z...") que repite información ya visible en otros campos del producto.

**Objetivo**: Transformar la experiencia a nivel farmacia profesional (Cruz Verde, Ahumada).

---

## Parte 1: Sistema de Filtros (YA COMPLETADA)

### Componentes creados:
- `src/components/filters/FilterContent.tsx` - UI compartido de filtros
- `src/components/filters/FilterSidebar.tsx` - Desktop sidebar sticky
- `src/components/filters/FilterDrawer.tsx` - Mobile drawer overlay
- `src/components/filters/CategoryPills.tsx` - Pills horizontales
- `src/components/filters/ActiveFilters.tsx` - Chips removibles

### Homepage refactoreada (`src/app/page.tsx`):
- Layout sidebar (lg+) + contenido
- CategoryPills + ActiveFilters
- Botón "Filtros (N)" mobile
- Todos los filtros conectados a API

---

## Parte 2: Descripciones Estructuradas (PENDIENTE)

### Página de producto (`src/app/producto/[slug]/page.tsx`)

**Cambios necesarios:**

1. **Badges row** (entre nombre y precio):
   - Tipo receta: verde/amarillo/rojo - usar `product.prescription_type`
   - Bioequivalente: badge azul - regex `/Bioequivalente:\s*S[ií]/i` en `product.description`
   - Categoría: badge slate clickeable → `/?category=<slug>`

2. **Tabla de información estructurada** (entre precio y envío):
   - Principio Activo → `product.active_ingredient`
   - Presentación → `product.presentation`
   - Acción Terapéutica → `product.therapeutic_action`
   - NO repetir laboratorio, NO mostrar registro sanitario/control legal/precio unitario

3. **Eliminar** el bloque `prose prose-sm` que muestra `product.description` como texto raw

---

## Pendiente después del rediseño:
1. `npx next build` sin errores
2. `git push origin main` para deploy
3. Verificar en producción
