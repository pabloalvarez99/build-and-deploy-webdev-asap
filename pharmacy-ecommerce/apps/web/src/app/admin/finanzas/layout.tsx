'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, CreditCard, Receipt, TrendingUp, BarChart2 } from 'lucide-react';

const tabs = [
  { href: '/admin/finanzas', label: 'Resumen', icon: Wallet, exact: true },
  { href: '/admin/finanzas/cuentas-pagar', label: 'Cuentas por Pagar', icon: CreditCard },
  { href: '/admin/finanzas/gastos', label: 'Gastos', icon: Receipt },
  { href: '/admin/finanzas/pyl', label: 'P&L', icon: TrendingUp },
  { href: '/admin/finanzas/cash-flow', label: 'Cash Flow', icon: BarChart2 },
];

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
