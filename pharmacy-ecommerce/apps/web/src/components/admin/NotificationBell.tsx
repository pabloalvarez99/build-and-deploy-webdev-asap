'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Package, ShoppingBag, AlertTriangle, X, Check, Store } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'order' | 'stock' | 'critical' | 'reservation';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for notifications
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        const newNotifications: Notification[] = [];

        // Check for pending orders
        const pendingOrders = await orderApi.list({ status: 'pending', limit: 5 });
        if (pendingOrders.total > 0) {
          pendingOrders.orders.forEach((order) => {
            const orderDate = new Date(order.created_at);
            if (orderDate > lastCheck) {
              newNotifications.push({
                id: `order-${order.id}`,
                type: 'order',
                title: 'Nueva orden recibida',
                message: `Orden #${order.id.slice(0, 8)} por ${formatPrice(order.total)}`,
                timestamp: orderDate,
                read: false,
                link: `/admin/ordenes/${order.id}`,
              });
            }
          });
        }

        // Check for reserved orders (store pickup pending approval)
        const reservedOrders = await orderApi.listAll({ status: 'reserved', limit: 10 });
        if (reservedOrders.total > 0) {
          reservedOrders.orders.forEach((order) => {
            newNotifications.push({
              id: `reservation-${order.id}`,
              type: 'reservation',
              title: 'Reserva pendiente de aprobacion',
              message: `Reserva #${order.id.slice(0, 8)} por ${formatPrice(order.total)}`,
              timestamp: new Date(order.created_at),
              read: false,
              link: `/admin/ordenes/${order.id}`,
            });
          });
        }

        // Check for critical stock
        const products = await productApi.list({ limit: 1000, active_only: true });
        const criticalProducts = products.products.filter((p) => p.stock === 0);
        const lowStockProducts = products.products.filter((p) => p.stock > 0 && p.stock <= 5);

        if (criticalProducts.length > 0) {
          newNotifications.push({
            id: `critical-${Date.now()}`,
            type: 'critical',
            title: 'Productos agotados',
            message: `${criticalProducts.length} producto${criticalProducts.length > 1 ? 's' : ''} sin stock`,
            timestamp: new Date(),
            read: false,
            link: '/admin/productos?stock=out',
          });
        }

        if (lowStockProducts.length > 0) {
          newNotifications.push({
            id: `low-${Date.now()}`,
            type: 'stock',
            title: 'Stock bajo',
            message: `${lowStockProducts.length} producto${lowStockProducts.length > 1 ? 's' : ''} con stock bajo`,
            timestamp: new Date(),
            read: false,
            link: '/admin/productos?stock=low',
          });
        }

        if (newNotifications.length > 0) {
          setNotifications((prev) => {
            // Merge and dedupe
            const merged = [...newNotifications, ...prev];
            const unique = merged.filter(
              (n, i, arr) => arr.findIndex((m) => m.id === n.id) === i
            );
            return unique.slice(0, 20);
          });
        }

        setLastCheck(new Date());
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    // Initial check
    checkNotifications();

    // Poll every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, lastCheck]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'reservation':
        return <Store className="w-4 h-4 text-amber-500" />;
      case 'stock':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marcar leidas
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || '#'}
                  onClick={() => {
                    markAsRead(notification.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    !notification.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                  }`}
                >
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-slate-900 dark:text-white`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>No hay notificaciones</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
