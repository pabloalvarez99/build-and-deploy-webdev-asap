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

export const SELLER_ROUTES = new Set([
  '/admin',
  '/admin/dashboard',
  '/admin/operaciones',
  '/admin/pos',
  '/admin/arqueo',
  '/admin/turnos',
  '/admin/ordenes',
  '/admin/clientes',
]);

export const PHARMACIST_EXTRA_ROUTES = new Set([
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
  '/admin/farmacia',
  '/admin/etiquetas',
]);

export const OWNER_ONLY_ROUTES = new Set([
  '/admin/reportes',
  '/admin/costos',
  '/admin/proveedores',
  '/admin/compras',
  '/admin/compras/comparador',
  '/admin/configuracion',
  '/admin/usuarios',
  '/admin/finanzas',
  '/admin/ejecutivo',
  '/admin/sistema/auditoria',
]);

export function canAccessRoute(role: string | undefined, href: string): boolean {
  if (isOwnerRole(role)) return true;
  if (OWNER_ONLY_ROUTES.has(href)) return false;
  if (role === 'pharmacist') return SELLER_ROUTES.has(href) || PHARMACIST_EXTRA_ROUTES.has(href);
  if (role === 'seller') return SELLER_ROUTES.has(href);
  return false;
}

export function routesForRole(role: string | undefined): string[] {
  if (isOwnerRole(role)) {
    return [
      ...Array.from(SELLER_ROUTES),
      ...Array.from(PHARMACIST_EXTRA_ROUTES),
      ...Array.from(OWNER_ONLY_ROUTES),
    ];
  }
  if (role === 'pharmacist') return [...Array.from(SELLER_ROUTES), ...Array.from(PHARMACIST_EXTRA_ROUTES)];
  if (role === 'seller') return Array.from(SELLER_ROUTES);
  return [];
}

export function routesLostOnDemotion(currentRole: string, nextRole: string): string[] {
  const before = routesForRole(currentRole);
  const after = new Set(routesForRole(nextRole));
  return before.filter((r) => !after.has(r));
}

const LABEL: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Dueño',
  pharmacist: 'Farmacéutico',
  seller: 'Vendedor',
  user: 'Cliente',
};

const DESCRIPTION: Record<string, string> = {
  owner: 'Acceso total · usuarios · finanzas · reportes',
  admin: 'Acceso total · usuarios · finanzas · reportes',
  pharmacist: 'POS · recetas · vencimientos · inventario',
  seller: 'POS · órdenes · clientes · arqueo',
  user: 'Sin acceso al admin',
};

export function roleLabel(role?: string): string {
  return LABEL[role ?? ''] ?? role ?? '—';
}

export function roleDescription(role?: string): string {
  return DESCRIPTION[role ?? ''] ?? '';
}

export function landingRouteForRole(role?: string): string {
  if (isOwnerRole(role)) return '/admin/ejecutivo';
  if (role === 'pharmacist') return '/admin/farmacia';
  if (role === 'seller') return '/admin/pos';
  return '/admin/dashboard';
}
