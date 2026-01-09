# Bitacora - FarmaShop E-commerce

## 2026-01-09

### Prompt 1: Continuacion del proyecto

**Estado actual del proyecto:**
- Proyecto de e-commerce de farmacia con arquitectura de microservicios
- Stack: Next.js 14 (frontend), Rust/Axum (backend), PostgreSQL, Redis, MercadoPago
- Estructura:
  - `apps/web/` - Frontend Next.js
  - `apps/auth-service/` - Servicio de autenticacion (Rust)
  - `apps/product-service/` - Servicio de productos (Rust)
  - `apps/order-service/` - Servicio de ordenes (Rust)
  - `database/migrations/` - Migraciones SQL
  - `scripts/import_products.py` - Script para importar productos desde Excel

**Trabajo previo identificado:**
- Se creo script `scripts/import_products.py` para importar productos desde el archivo Excel `2026-01-08 REPORTE STOCK.xlsx`
- El script importa productos y categorias a PostgreSQL

**Pendiente por confirmar con usuario:**
- Cual es el siguiente paso del plan anterior?

---
