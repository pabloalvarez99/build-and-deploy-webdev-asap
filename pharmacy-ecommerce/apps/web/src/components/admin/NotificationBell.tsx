'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Package,
  ShoppingBag,
  AlertTriangle,
  X,
  Check,
  Store,
  CalendarClock,
  ClipboardList,
  Wallet,
  BookX,
  Megaphone,
  Pin,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

type Severity = 'critical' | 'urgent' | 'info';

interface Notification {
  id: string;
  severity: Severity;
  icon: React.ReactNode;
  title: string;
  message: string;
  link: string;
  count?: number;
  pinned?: boolean;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'critical';
  pinned: boolean;
  expires_at: string | null;
  created_at: string;
}

interface OperacionesData {
  reservas_expiradas: { id: string; nombre: string; pickup_code: string | null; total: number }[];
  reservas_urgentes: { id: string; nombre: string; pickup_code: string | null; total: number }[];
  vencidos: { id: string; producto: string; quantity: number }[];
  por_vencer_7d: { id: string; producto: string; expiry_date: string }[];
  faltas_con_stock: { id: string; producto: string; cliente: string }[];
  oc_borrador: { id: string; proveedor: string; total_cost: number | null }[];
  stock_cero_count: number;
  stock_critico_count: number;
  faltas_pending_total: number;
  kpis: { pedidos_pendientes_webpay: number };
}

const SEV_ORDER: Severity[] = ['critical', 'urgent', 'info'];
const SEV_LABEL: Record<Severity, string> = {
  critical: 'Crítico',
  urgent: 'Urgente',
  info: 'Próximos 7 días',
};
const SEV_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  urgent: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Persisted dismissed/read sets per user
  const storageKey = user?.email ? `admin-notif-${user.email}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setReadIds(new Set(parsed.read || []));
        setDismissedIds(new Set(parsed.dismissed || []));
      }
    } catch {}
  }, [storageKey]);

  const persist = useCallback((read: Set<string>, dismissed: Set<string>) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        read: Array.from(read),
        dismissed: Array.from(dismissed),
      }));
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [resOps, resAvisos] = await Promise.all([
        fetch('/api/admin/operaciones', { credentials: 'include' }),
        fetch('/api/admin/avisos', { credentials: 'include' }).catch(() => null),
      ]);
      if (!resOps.ok) return;
      const data: OperacionesData = await resOps.json();
      const avisosData: { announcements: AnnouncementRow[] } = resAvisos && resAvisos.ok
        ? await resAvisos.json()
        : { announcements: [] };

      const built: Notification[] = [];

      // CRÍTICO
      if (data.reservas_expiradas.length > 0) {
        built.push({
          id: 'reservas-expiradas',
          severity: 'critical',
          icon: <Store className="w-4 h-4 text-red-500" />,
          title: 'Reservas expiradas',
          message: `${data.reservas_expiradas.length} reserva${data.reservas_expiradas.length > 1 ? 's' : ''} sin procesar`,
          link: '/admin/ordenes?status=reserved',
          count: data.reservas_expiradas.length,
        });
      }
      if (data.vencidos.length > 0) {
        built.push({
          id: 'vencidos',
          severity: 'critical',
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          title: 'Productos vencidos con stock',
          message: `${data.vencidos.length} lote${data.vencidos.length > 1 ? 's' : ''} requieren acción`,
          link: '/admin/vencimientos',
          count: data.vencidos.length,
        });
      }
      if (data.stock_cero_count > 0) {
        built.push({
          id: 'stock-cero',
          severity: 'critical',
          icon: <Package className="w-4 h-4 text-red-500" />,
          title: 'Productos agotados',
          message: `${data.stock_cero_count} sin stock`,
          link: '/admin/inventario',
          count: data.stock_cero_count,
        });
      }

      // URGENTE
      if (data.reservas_urgentes.length > 0) {
        built.push({
          id: 'reservas-urgentes',
          severity: 'urgent',
          icon: <Store className="w-4 h-4 text-amber-500" />,
          title: 'Reservas por expirar (<6h)',
          message: `${data.reservas_urgentes.length} pendiente${data.reservas_urgentes.length > 1 ? 's' : ''}`,
          link: '/admin/ordenes?status=reserved',
          count: data.reservas_urgentes.length,
        });
      }
      if (data.faltas_con_stock.length > 0) {
        built.push({
          id: 'faltas-disponibles',
          severity: 'urgent',
          icon: <BookX className="w-4 h-4 text-amber-500" />,
          title: 'Faltas con stock disponible',
          message: `${data.faltas_con_stock.length} cliente${data.faltas_con_stock.length > 1 ? 's' : ''} pendiente${data.faltas_con_stock.length > 1 ? 's' : ''} avisar`,
          link: '/admin/faltas',
          count: data.faltas_con_stock.length,
        });
      }
      if (data.oc_borrador.length > 0) {
        built.push({
          id: 'oc-borrador',
          severity: 'urgent',
          icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
          title: 'OC en borrador',
          message: `${data.oc_borrador.length} sin confirmar`,
          link: '/admin/compras',
          count: data.oc_borrador.length,
        });
      }
      if (data.kpis.pedidos_pendientes_webpay > 0) {
        built.push({
          id: 'webpay-pendientes',
          severity: 'urgent',
          icon: <Wallet className="w-4 h-4 text-amber-500" />,
          title: 'Webpay pendiente preparar',
          message: `${data.kpis.pedidos_pendientes_webpay} orden${data.kpis.pedidos_pendientes_webpay > 1 ? 'es' : ''} pagad${data.kpis.pedidos_pendientes_webpay > 1 ? 'as' : 'a'}`,
          link: '/admin/ordenes?status=paid',
          count: data.kpis.pedidos_pendientes_webpay,
        });
      }

      // INFO 7d
      if (data.por_vencer_7d.length > 0) {
        built.push({
          id: 'por-vencer-7d',
          severity: 'info',
          icon: <CalendarClock className="w-4 h-4 text-blue-500" />,
          title: 'Lotes vencen en 7 días',
          message: `${data.por_vencer_7d.length} lote${data.por_vencer_7d.length > 1 ? 's' : ''} próximo${data.por_vencer_7d.length > 1 ? 's' : ''}`,
          link: '/admin/vencimientos',
          count: data.por_vencer_7d.length,
        });
      }
      if (data.stock_critico_count > 0) {
        built.push({
          id: 'stock-bajo',
          severity: 'info',
          icon: <AlertTriangle className="w-4 h-4 text-blue-500" />,
          title: 'Stock bajo',
          message: `${data.stock_critico_count} producto${data.stock_critico_count > 1 ? 's' : ''} bajo umbral`,
          link: '/admin/reposicion',
          count: data.stock_critico_count,
        });
      }

      const sevMap: Record<AnnouncementRow['severity'], Severity> = {
        critical: 'critical',
        warning: 'urgent',
        info: 'info',
      };
      for (const a of avisosData.announcements ?? []) {
        built.push({
          id: `aviso-${a.id}`,
          severity: sevMap[a.severity] ?? 'info',
          icon: a.pinned
            ? <Pin className="w-4 h-4" style={{ color: 'var(--admin-accent)' }} />
            : <Megaphone className={`w-4 h-4 ${a.severity === 'critical' ? 'text-red-500' : a.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />,
          title: a.title,
          message: a.body.length > 80 ? `${a.body.slice(0, 80)}…` : a.body,
          link: '/admin/avisos',
          pinned: a.pinned,
        });
      }

      setNotifications(built.filter((n) => n.pinned || !dismissedIds.has(n.id)));
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }, [user, dismissedIds]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persist(next, dismissedIds);
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    notifications.forEach((n) => next.add(n.id));
    setReadIds(next);
    persist(next, dismissedIds);
  };

  const dismiss = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    if (target?.pinned) return;
    const next = new Set(dismissedIds);
    next.add(id);
    setDismissedIds(next);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    persist(readIds, next);
  };

  const clearAll = () => {
    const next = new Set(dismissedIds);
    notifications.filter((n) => !n.pinned).forEach((n) => next.add(n.id));
    setDismissedIds(next);
    setNotifications((prev) => prev.filter((n) => n.pinned));
    persist(readIds, next);
  };

  const grouped = SEV_ORDER.map((sev) => ({
    severity: sev,
    items: notifications.filter((n) => n.severity === sev),
  })).filter((g) => g.items.length > 0);

  const criticalCount = notifications.filter((n) => n.severity === 'critical' && !readIds.has(n.id)).length;
  const badgeColor = criticalCount > 0 ? 'bg-red-500' : 'bg-amber-500';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center admin-text-muted hover:bg-[color:var(--admin-accent-soft)] transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className={`absolute top-1 right-1 min-w-[16px] h-4 px-1 ${badgeColor} text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl overflow-hidden z-50"
          style={{
            background: 'var(--admin-elevated)',
            border: '1px solid var(--admin-border-strong)',
          }}
        >
          <div className="px-4 py-3 border-b admin-hairline flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[14px]" style={{ color: 'var(--admin-text)' }}>
                Centro de alertas
              </h3>
              <p className="text-[11px] admin-text-subtle">Auto-actualiza cada 60s</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-[color:var(--admin-accent)] hover:opacity-80 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar leídas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] admin-text-muted hover:text-[color:var(--admin-text)]"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto">
            {grouped.length > 0 ? (
              grouped.map((group) => (
                <div key={group.severity}>
                  <div className="px-4 py-2 flex items-center gap-2 admin-text-subtle text-[10.5px] uppercase tracking-wider font-semibold sticky top-0" style={{ background: 'var(--admin-surface-2)' }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${SEV_DOT[group.severity]}`} />
                    {SEV_LABEL[group.severity]}
                  </div>
                  {group.items.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={`relative group flex items-start gap-3 transition-colors border-b admin-hairline last:border-b-0 ${
                          !isRead ? 'bg-[color:var(--admin-accent-soft)]' : ''
                        }`}
                      >
                        <Link
                          href={n.link}
                          onClick={() => { markAsRead(n.id); setIsOpen(false); }}
                          className="flex items-start gap-3 flex-1 min-w-0 px-4 py-3 pr-8 hover:bg-[color:var(--admin-surface-2)]"
                        >
                          <div className="mt-0.5 flex-shrink-0">{n.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-[13px] ${!isRead ? 'font-semibold' : 'font-medium'}`} style={{ color: 'var(--admin-text)' }}>
                                {n.title}
                              </p>
                              {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--admin-accent)] flex-shrink-0" />}
                            </div>
                            <p className="text-[12px] admin-text-muted truncate">{n.message}</p>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => dismiss(n.id, e)}
                          title="Descartar"
                          className="absolute right-2 top-2.5 p-1 rounded admin-text-subtle hover:admin-text-muted hover:bg-[color:var(--admin-accent-soft)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="px-4 py-12 text-center admin-text-muted">
                <Check className="w-8 h-8 mx-auto mb-2 admin-text-subtle" />
                <p className="text-[13px]">Todo en orden</p>
                <p className="text-[11px] admin-text-subtle mt-1">Sin alertas operativas</p>
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t admin-hairline flex items-center justify-between text-[11px] admin-text-subtle">
            <Link
              href="/admin/operaciones"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 hover:text-[color:var(--admin-accent)]"
            >
              <ShoppingBag className="w-3 h-3" />
              Ver operaciones
            </Link>
            <span>{notifications.length} alerta{notifications.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
