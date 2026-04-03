'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Package, ShoppingBag, AlertTriangle, X, Check, Store, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import Link from 'next/link';

interface Notification {
 id: string;
 type: 'order' | 'stock' | 'critical' | 'reservation' | 'webpay';
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

 const checkNotifications = useCallback(async () => {
 if (!user) return;
 try {
 const newNotifications: Notification[] = [];

 // Check for Webpay paid orders needing preparation
 const webpayPaidOrders = await orderApi.listAll({ status: 'paid', limit: 10 });
 webpayPaidOrders.orders
  .filter((o) => o.payment_provider === 'webpay')
  .forEach((order) => {
  newNotifications.push({
  id: `webpay-${order.id}`,
  type: 'webpay',
  title: 'Pago Webpay — preparar pedido',
  message: `Orden #${order.id.slice(0, 8)} · ${formatPrice(order.total)}`,
  timestamp: new Date(order.created_at),
  read: false,
  link: `/admin/ordenes/${order.id}`,
  });
 });

 // Check for reserved orders (store pickup pending approval)
 const reservedOrders = await orderApi.listAll({ status: 'reserved', limit: 10 });
 reservedOrders.orders.forEach((order) => {
 newNotifications.push({
 id: `reservation-${order.id}`,
 type: 'reservation',
 title: 'Reserva pendiente de aprobación',
 message: `Reserva #${order.id.slice(0, 8)} por ${formatPrice(order.total)}`,
 timestamp: new Date(order.created_at),
 read: false,
 link: `/admin/ordenes/${order.id}`,
 });
 });

 // Check for critical stock using lightweight count queries
 const [outOfStock, lowStock] = await Promise.all([
 productApi.list({ limit: 1, active_only: true, stock_filter: 'out' }),
 productApi.list({ limit: 1, active_only: true, stock_filter: 'low' }),
 ]);

 if (outOfStock.total > 0) {
 newNotifications.push({
 id: `critical-stock`,
 type: 'critical',
 title: 'Productos agotados',
 message: `${outOfStock.total} producto${outOfStock.total > 1 ? 's' : ''} sin stock`,
 timestamp: new Date(),
 read: false,
 link: '/admin/productos?stock=out',
 });
 }

 if (lowStock.total > 0) {
 newNotifications.push({
 id: `low-stock`,
 type: 'stock',
 title: 'Stock bajo',
 message: `${lowStock.total} producto${lowStock.total > 1 ? 's' : ''} con stock bajo`,
 timestamp: new Date(),
 read: false,
 link: '/admin/productos?stock=low',
 });
 }

 setNotifications((prev) => {
 if (newNotifications.length === 0) return prev;
 // Merge: new items replace old items with same id, then keep remaining old ones
 const newIds = new Set(newNotifications.map((n) => n.id));
 const oldUnique = prev.filter((n) => !newIds.has(n.id));
 return [...newNotifications, ...oldUnique].slice(0, 20);
 });
 } catch (error) {
 console.error('Error checking notifications:', error);
 }
 }, [user]);

 // Poll for notifications every 30 seconds
 useEffect(() => {
 if (!user) return;
 checkNotifications();
 const interval = setInterval(checkNotifications, 30000);
 return () => clearInterval(interval);
 }, [user, checkNotifications]);

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
 case 'webpay':
 return <CreditCard className="w-4 h-4 text-blue-500" />;
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
 className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <Bell className="w-5 h-5 text-slate-600" />
 {unreadCount > 0 && (
 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
 {unreadCount > 9 ? '9+' : unreadCount}
 </span>
 )}
 </button>

 {isOpen && (
 <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
 {/* Header */}
 <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
 <h3 className="font-semibold text-slate-900">Notificaciones</h3>
 <div className="flex items-center gap-2">
 {unreadCount > 0 && (
 <button
 onClick={markAllAsRead}
 className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
 >
 <Check className="w-3 h-3" />
 Marcar leídas
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
 <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
 {notifications.length > 0 ? (
 notifications.map((notification) => (
 <Link
 key={notification.id}
 href={notification.link || '#'}
 onClick={() => {
 markAsRead(notification.id);
 setIsOpen(false);
 }}
 className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
 !notification.read ? 'bg-emerald-50/50' : ''
 }`}
 >
 <div className="mt-0.5">{getIcon(notification.type)}</div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-slate-900`}>
 {notification.title}
 </p>
 {!notification.read && (
 <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
 )}
 </div>
 <p className="text-sm text-slate-500 truncate">
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
