'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingCart, UserCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';

const HIDE_PREFIXES = ['/admin', '/carrito', '/checkout', '/auth'];

export default function MobileBottomNav() {
  const pathname = usePathname() || '/';
  const { cart } = useCartStore();
  const { user } = useAuthStore();

  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const itemCount = cart?.item_count ?? 0;
  const accountHref = user ? '/mi-cuenta' : '/auth/login';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' && itemCount === 0;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isHome = pathname === '/';

  // Hide on home when sticky cart bar visible (avoids stacked bars)
  if (isHome && itemCount > 0) return null;

  return (
    <nav
      aria-label="Navegación inferior"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4">
        <Tab href="/" label="Inicio" active={isActive('/')} icon={<Home className="w-5 h-5" aria-hidden="true" />} />
        <Tab href="/productos" label="Catálogo" active={isActive('/productos')} icon={<LayoutGrid className="w-5 h-5" aria-hidden="true" />} />
        <Tab
          href="/carrito"
          label="Carrito"
          active={isActive('/carrito')}
          badge={itemCount > 0 ? itemCount : undefined}
          icon={<ShoppingCart className="w-5 h-5" aria-hidden="true" />}
        />
        <Tab
          href={accountHref}
          label={user ? 'Cuenta' : 'Ingresar'}
          active={isActive('/mi-cuenta') || isActive('/mis-pedidos')}
          icon={<UserCircle className="w-5 h-5" aria-hidden="true" />}
        />
      </ul>
    </nav>
  );
}

function Tab({
  href,
  label,
  active,
  icon,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] text-[11px] font-semibold transition-colors ${
          active
            ? 'text-cyan-700 dark:text-cyan-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        <span className="relative">
          {icon}
          {badge !== undefined && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-950">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
}
