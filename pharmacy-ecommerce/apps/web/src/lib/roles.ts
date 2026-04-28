export type AdminRole = 'admin' | 'owner' | 'pharmacist' | 'seller';

export const ADMIN_ROLES: AdminRole[] = ['admin', 'owner', 'pharmacist', 'seller'];
export const OWNER_ROLES: AdminRole[] = ['admin', 'owner'];
export const PHARMACIST_ROLES: AdminRole[] = ['admin', 'owner', 'pharmacist'];

export function isAdminRole(role?: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

export function isOwnerRole(role?: string): boolean {
  return OWNER_ROLES.includes(role as AdminRole);
}

const SELLER_ROUTES = new Set([
  '/admin',
  '/admin/operaciones',
  '/admin/pos',
  '/admin/arqueo',
  '/admin/turnos',
  '/admin/ordenes',
  '/admin/clientes',
]);

const PHARMACIST_EXTRA_ROUTES = new Set([
  '/admin/productos',
  '/admin/catalogo',
  '/admin/catalogo-calidad',
  '/admin/libro-recetas',
  '/admin/turnos-farmaceutico',
  '/admin/faltas',
  '/admin/vencimientos',
  '/admin/reposicion',
  '/admin/inventario',
  '/admin/descuentos',
  '/admin/categorias',
  '/admin/fidelidad',
  '/admin/devoluciones',
  '/admin/stock',
]);

const OWNER_ONLY_ROUTES = new Set([
  '/admin/reportes',
  '/admin/costos',
  '/admin/proveedores',
  '/admin/compras',
  '/admin/compras/comparador',
  '/admin/configuracion',
  '/admin/usuarios',
  '/admin/finanzas',
]);

export function canAccessRoute(role: string | undefined, href: string): boolean {
  if (isOwnerRole(role)) return true;
  if (OWNER_ONLY_ROUTES.has(href)) return false;
  if (role === 'pharmacist') return SELLER_ROUTES.has(href) || PHARMACIST_EXTRA_ROUTES.has(href);
  if (role === 'seller') return SELLER_ROUTES.has(href);
  return false;
}
