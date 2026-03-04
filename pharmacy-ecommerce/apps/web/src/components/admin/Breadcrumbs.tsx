'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
 admin: 'Dashboard',
 productos: 'Productos',
 ordenes: 'Órdenes',
 categorias: 'Categorías',
};

export function Breadcrumbs() {
 const pathname = usePathname();
 const segments = pathname.split('/').filter(Boolean);

 // Don't show breadcrumbs on dashboard
 if (segments.length <= 1) return null;

 const breadcrumbs = segments.map((segment, index) => {
 const href = '/' + segments.slice(0, index + 1).join('/');
 const isLast = index === segments.length - 1;
 const label = routeLabels[segment] || segment;

 // Check if this is a dynamic segment (like an order ID)
 const isDynamic = segment.length > 8 && !routeLabels[segment];

 return {
 href,
 label: isDynamic ? `#${segment.slice(0, 8)}` : label,
 isLast,
 };
 });

 return (
 <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
 <Link
 href="/admin"
 className="hover:text-emerald-600 transition-colors"
 >
 <Home className="w-4 h-4" />
 </Link>

 {breadcrumbs.slice(1).map((crumb, index) => (
 <div key={crumb.href} className="flex items-center gap-2">
 <ChevronRight className="w-4 h-4 text-slate-300" />
 {crumb.isLast ? (
 <span className="font-medium text-slate-900">
 {crumb.label}
 </span>
 ) : (
 <Link
 href={crumb.href}
 className="hover:text-emerald-600 transition-colors"
 >
 {crumb.label}
 </Link>
 )}
 </div>
 ))}
 </nav>
 );
}
