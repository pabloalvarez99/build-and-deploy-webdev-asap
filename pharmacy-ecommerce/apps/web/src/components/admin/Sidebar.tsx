'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  BarChart2,
  Settings,
  Users,
  Truck,
  ClipboardList,
  Receipt,
  ArrowUpDown,
  Warehouse,
  Tag,
  Calculator,
  PackageSearch,
  TrendingUp,
  BookX,
  BookOpen,
  UserCheck,
  Database,
  History,
  CalendarClock,
  Scale,
  Star,
  RotateCcw,
  ClipboardCheck,
  X,
  Activity,
  Shield,
  Wallet,
  Crown,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { canAccessRoute } from '@/lib/roles';
import { RoleBadge } from '@/components/admin/ui/RoleBadge';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  pendingOrders?: number;
  pendingReservations?: number;
  criticalStock?: number;
  draftPurchaseOrders?: number;
  pendingFaltas?: number;
  onOpenCommandPalette?: () => void;
  role?: string;
}

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'op',
    label: 'Operación',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/ejecutivo', icon: Crown, label: 'Ejecutivo' },
      { href: '/admin/operaciones', icon: Activity, label: 'Operaciones' },
      { href: '/admin/pos', icon: Receipt, label: 'POS' },
      { href: '/admin/arqueo', icon: Calculator, label: 'Arqueo' },
      { href: '/admin/turnos', icon: History, label: 'Turnos' },
    ],
  },
  {
    id: 'cat',
    label: 'Catálogo',
    items: [
      { href: '/admin/productos', icon: Package, label: 'Productos' },
      { href: '/admin/catalogo', icon: Database, label: 'Catálogo ERP' },
      { href: '/admin/categorias', icon: Tags, label: 'Categorías' },
      { href: '/admin/catalogo-calidad', icon: ClipboardCheck, label: 'Calidad' },
      { href: '/admin/etiquetas', icon: Tag, label: 'Etiquetas precio' },
    ],
  },
  {
    id: 'sales',
    label: 'Ventas',
    items: [
      { href: '/admin/ordenes', icon: ShoppingBag, label: 'Órdenes' },
      { href: '/admin/clientes', icon: Users, label: 'Clientes' },
      { href: '/admin/fidelidad', icon: Star, label: 'Fidelización' },
      { href: '/admin/descuentos', icon: Tag, label: 'Descuentos' },
      { href: '/admin/devoluciones', icon: RotateCcw, label: 'Devoluciones' },
    ],
  },
  {
    id: 'buy',
    label: 'Compras',
    items: [
      { href: '/admin/proveedores', icon: Truck, label: 'Proveedores' },
      { href: '/admin/compras', icon: ClipboardList, label: 'Órdenes de compra' },
      { href: '/admin/compras/comparador', icon: Scale, label: 'Comparador' },
    ],
  },
  {
    id: 'inv',
    label: 'Inventario',
    items: [
      { href: '/admin/stock', icon: ArrowUpDown, label: 'Movimientos' },
      { href: '/admin/inventario', icon: Warehouse, label: 'Inventario' },
      { href: '/admin/reposicion', icon: PackageSearch, label: 'Reposición' },
      { href: '/admin/vencimientos', icon: CalendarClock, label: 'Vencimientos' },
      { href: '/admin/faltas', icon: BookX, label: 'Faltas' },
    ],
  },
  {
    id: 'pharm',
    label: 'Farmacia',
    items: [
      { href: '/admin/farmacia', icon: Stethoscope, label: 'Mi panel' },
      { href: '/admin/libro-recetas', icon: BookOpen, label: 'Libro recetas' },
      { href: '/admin/turnos-farmaceutico', icon: UserCheck, label: 'Turnos farmacéutico' },
    ],
  },
  {
    id: 'fin',
    label: 'Finanzas',
    items: [
      { href: '/admin/costos', icon: TrendingUp, label: 'Costos' },
      { href: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
      { href: '/admin/finanzas', icon: Wallet, label: 'Finanzas' },
    ],
  },
  {
    id: 'sys',
    label: 'Sistema',
    items: [
      { href: '/admin/usuarios', icon: Shield, label: 'Usuarios' },
      { href: '/admin/sistema/auditoria', icon: ShieldCheck, label: 'Auditoría' },
      { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  pendingOrders = 0,
  pendingReservations = 0,
  criticalStock = 0,
  draftPurchaseOrders = 0,
  pendingFaltas = 0,
  onOpenCommandPalette,
  role = 'admin',
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin-sidebar-groups');
      if (stored) setCollapsedGroups(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem('admin-sidebar-groups', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Badges intentionally limited to faltas + compras draft.
  // Reservas/orders/stock alerts moved to NotificationBell to avoid duplication.
  void pendingOrders; void pendingReservations; void criticalStock;
  const getBadge = (href: string) => {
    if (href === '/admin/compras') return draftPurchaseOrders;
    if (href === '/admin/faltas') return pendingFaltas;
    return 0;
  };

  const getBadgeKind = (href: string): 'amber' | 'orange' | 'blue' | 'violet' | null => {
    if (href === '/admin/compras') return 'blue';
    if (href === '/admin/faltas') return 'violet';
    return null;
  };

  const BADGE_STYLES: Record<string, string> = {
    amber:  'border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/[0.08]',
    orange: 'border-orange-500/30 text-orange-700 dark:text-orange-400 bg-orange-500/[0.08]',
    blue:   'border-blue-500/30 text-blue-700 dark:text-blue-400 bg-blue-500/[0.08]',
    violet: 'border-violet-500/30 text-violet-700 dark:text-violet-400 bg-violet-500/[0.08]',
  };

  const NavItemRow = ({ item, collapsed }: { item: NavItem; collapsed: boolean }) => {
    const active = isActive(item.href, item.exact);
    const count = getBadge(item.href);
    const kind = getBadgeKind(item.href);

    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${
          active ? 'admin-nav-active font-medium' : 'admin-text-muted hover:text-[color:var(--admin-text)] hover:bg-[color:var(--admin-accent-soft)]'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="relative shrink-0">
          <item.icon className={`w-[18px] h-[18px] ${active ? 'text-[color:var(--admin-accent)]' : ''}`} strokeWidth={1.75} />
          {collapsed && count > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {count > 0 && kind && (
              <span className={`px-1.5 py-0.5 text-[10.5px] font-semibold rounded-md border tabular-nums ${BADGE_STYLES[kind]}`}>
                {count}
                {item.href === '/admin/productos' && <AlertTriangle className="w-2.5 h-2.5 inline ml-0.5 -mt-px" />}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  const Group = ({ group, collapsed }: { group: NavGroup; collapsed: boolean }) => {
    const visible = group.items.filter((it) => canAccessRoute(role, it.href));
    if (visible.length === 0) return null;
    const groupCollapsed = !!collapsedGroups[group.id];

    if (collapsed) {
      return (
        <div className="space-y-0.5">
          {visible.map((it) => <NavItemRow key={it.href} item={it} collapsed />)}
          <div className="my-2 mx-3 h-px bg-[color:var(--admin-border)]" />
        </div>
      );
    }

    return (
      <div className="mb-1">
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between px-3 py-1.5 admin-group-label hover:text-[color:var(--admin-text-muted)] transition-colors"
        >
          <span>{group.label}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${groupCollapsed ? '-rotate-90' : ''}`}
            strokeWidth={2.25}
          />
        </button>
        {!groupCollapsed && (
          <div className="space-y-0.5 mt-0.5">
            {visible.map((it) => <NavItemRow key={it.href} item={it} collapsed={false} />)}
          </div>
        )}
      </div>
    );
  };

  const initials = (user?.name || user?.email || '?').slice(0, 2).toUpperCase();

  const content = (collapsed: boolean, showClose = false) => (
    <>
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-4 border-b admin-hairline shrink-0">
        {!collapsed ? (
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
            >
              <Package className="w-[18px] h-[18px]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--admin-text)' }}>Tu Farmacia</p>
              <p className="text-[10.5px] admin-text-subtle -mt-0.5 tracking-wider uppercase">Console</p>
            </div>
          </Link>
        ) : (
          <Link href="/admin" className="mx-auto w-8 h-8 rounded-lg flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
          >
            <Package className="w-[18px] h-[18px]" strokeWidth={2} />
          </Link>
        )}
        {showClose ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Search trigger */}
      {!collapsed && onOpenCommandPalette && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center gap-2 px-2.5 h-9 text-[12.5px] admin-text-muted admin-input hover:border-[color:var(--admin-accent)] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <span className="flex-1 text-left">Buscar…</span>
            <kbd className="admin-kbd">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV_GROUPS.map((g) => <Group key={g.id} group={g} collapsed={collapsed} />)}
      </nav>

      {/* User footer */}
      <div className="border-t admin-hairline p-2.5 shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1.5"
            style={{ background: 'var(--admin-surface-2)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--admin-accent), var(--admin-accent-2))' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                {user.name || 'Sin nombre'}
              </p>
              <p className="text-[11px] admin-text-subtle truncate">{user.email}</p>
            </div>
            <RoleBadge role={user.role || 'user'} size="xs" />
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-3 h-9 rounded-lg text-[13px] admin-text-muted hover:text-red-500 hover:bg-red-500/[0.08] transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}
      >
        {content(false, true)}
      </aside>

      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        style={{ background: 'var(--admin-surface)', borderRight: '1px solid var(--admin-border)' }}
      >
        {content(isCollapsed, false)}
      </aside>
    </>
  );
}
