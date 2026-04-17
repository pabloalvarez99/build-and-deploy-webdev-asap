'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, Order } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  X,
  Calendar,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Clock,
  Store,
  TrendingUp,
  User,
  Mail,
  Package,
  CreditCard,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',   dot: 'bg-yellow-400' },
  reserved:   { label: 'Reservado',   color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',       dot: 'bg-amber-400' },
  paid:       { label: 'Pagado',      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-400' },
  processing: { label: 'Procesando',  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',           dot: 'bg-blue-400' },
  shipped:    { label: 'Enviado',     color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',   dot: 'bg-purple-400' },
  delivered:  { label: 'Entregado',   color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',       dot: 'bg-green-500' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',               dot: 'bg-red-400' },
  completed:  { label: 'Completado',  color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',             dot: 'bg-teal-500' },
};

const PAGE_SIZE = 20;

function getCustomerName(order: Order): string {
  if (order.guest_name) return `${order.guest_name} ${order.guest_surname || ''}`.trim();
  if (order.user_id) return 'Usuario registrado';
  return 'Invitado';
}

function getCustomerEmail(order: Order): string {
  return order.guest_email || '';
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize status from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setFilterStatus([status]);
  }, [searchParams]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await orderApi.listAll({ limit: 1000 });
      setAllOrders(data.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      if (filterStatus.length > 0 && !filterStatus.includes(order.status)) return false;
      if (filterProvider) {
        if (filterProvider === 'pos') {
          if (!['pos_cash', 'pos_debit', 'pos_credit'].includes(order.payment_provider || '')) return false;
        } else if (order.payment_provider !== filterProvider) return false;
      }
      if (dateFrom && new Date(order.created_at) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(order.created_at) > to) return false;
      }
      const amount = parseFloat(order.total);
      if (minAmount && amount < parseFloat(minAmount)) return false;
      if (maxAmount && amount > parseFloat(maxAmount)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = getCustomerName(order).toLowerCase();
        const email = getCustomerEmail(order).toLowerCase();
        const phone = (order.customer_phone ?? '').replace(/\D/g, '');
        if (
          !order.id.toLowerCase().includes(q) &&
          !name.includes(q) &&
          !email.includes(q) &&
          !phone.includes(q.replace(/\D/g, ''))
        ) return false;
      }
      return true;
    });
  }, [allOrders, filterStatus, filterProvider, dateFrom, dateTo, minAmount, maxAmount, searchQuery]);

  // Stats computed from all orders (not filtered)
  const stats = useMemo(() => {
    const revenue = allOrders
      .filter((o) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.total), 0);
    const pending = allOrders.filter((o) => o.status === 'pending').length;
    const reserved = allOrders.filter((o) => o.status === 'reserved').length;
    const webpayPaid = allOrders.filter((o) => o.payment_provider === 'webpay' && o.status === 'paid').length;
    const posCompleted = allOrders.filter((o) => ['pos_cash', 'pos_debit', 'pos_credit'].includes(o.payment_provider || '') && o.status === 'completed').length;
    const total = allOrders.length;
    return { revenue, pending, reserved, webpayPaid, posCompleted, total };
  }, [allOrders]);

  // Pagination on filtered results
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pageOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProvider, dateFrom, dateTo, minAmount, maxAmount, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      loadOrders();
    } catch {
      alert('Error al actualizar el estado');
    }
  };

  const handleApproveReservation = async (orderId: string) => {
    if (!confirm('¿Aprobar esta reserva? Se reducirá el stock de los productos.')) return;
    try {
      await orderApi.approveReservation(orderId);
      loadOrders();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al aprobar la reserva');
    }
  };

  const handleRejectReservation = async (orderId: string) => {
    if (!confirm('¿Rechazar esta reserva? La orden será cancelada.')) return;
    try {
      await orderApi.rejectReservation(orderId);
      loadOrders();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al rechazar la reserva');
    }
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterProvider('');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    window.history.replaceState({}, '', '/admin/ordenes');
  };

  const toggleStatusFilter = (status: string) => {
    setFilterStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const hasActiveFilters = filterStatus.length > 0 || filterProvider || dateFrom || dateTo || minAmount || maxAmount || searchQuery;

  const exportToCSV = () => {
    // Server-side export with line items — passes active filters
    const params = new URLSearchParams();
    if (filterStatus.length === 1) params.set('status', filterStatus[0]);
    if (filterProvider) params.set('channel', filterProvider === 'pos' ? 'pos' : filterProvider === 'webpay' ? 'online' : filterProvider);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    window.location.href = `/api/admin/orders/export?${params.toString()}`;
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Órdenes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isLoading ? 'Cargando...' : `${filteredOrders.length} de ${allOrders.length} órdenes`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-secondary flex items-center gap-2 ${hasActiveFilters ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                {[filterStatus.length > 0, dateFrom, dateTo, minAmount, maxAmount, searchQuery].filter(Boolean).length}
              </span>
            )}
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button onClick={loadOrders} className="btn btn-secondary p-2.5" title="Actualizar">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ingresos</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{formatPrice(stats.revenue)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total órdenes</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stats.total}</p>
          </div>
        </div>
        <button
          onClick={() => toggleStatusFilter('pending')}
          className={`card p-4 flex items-center gap-3 text-left w-full hover:shadow-md transition-shadow ${filterStatus.includes('pending') ? 'ring-2 ring-yellow-400' : ''}`}
        >
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pendientes</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stats.pending}</p>
          </div>
        </button>
        <button
          onClick={() => toggleStatusFilter('reserved')}
          className={`card p-4 flex items-center gap-3 text-left w-full hover:shadow-md transition-shadow ${filterStatus.includes('reserved') ? 'ring-2 ring-amber-400' : ''}`}
        >
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reservas</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stats.reserved}</p>
          </div>
        </button>
        <button
          onClick={() => setFilterProvider(filterProvider === 'webpay' ? '' : 'webpay')}
          className={`card p-4 flex items-center gap-3 text-left w-full hover:shadow-md transition-shadow ${filterProvider === 'webpay' ? 'ring-2 ring-blue-400' : ''}`}
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Webpay a preparar</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stats.webpayPaid}</p>
          </div>
        </button>
        <button
          onClick={() => setFilterProvider(filterProvider === 'pos' ? '' : 'pos')}
          className={`card p-4 flex items-center gap-3 text-left w-full hover:shadow-md transition-shadow ${filterProvider === 'pos' ? 'ring-2 ring-emerald-400' : ''}`}
        >
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ventas POS</p>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{stats.posCompleted}</p>
          </div>
        </button>
      </div>

      {/* Quick search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por ID, nombre, email o teléfono..."
          className="input pl-10 w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Filtros avanzados</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar todo
              </button>
            )}
          </div>

          {/* Status chips */}
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                <button
                  key={value}
                  onClick={() => toggleStatusFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterStatus.includes(value)
                      ? cfg.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment provider chips */}
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Método de pago</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'webpay', label: 'Webpay Plus', icon: <CreditCard className="w-3.5 h-3.5" />, activeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
                { value: 'store', label: 'Retiro en tienda', icon: <Store className="w-3.5 h-3.5" />, activeClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
                { value: 'pos', label: 'Venta POS', icon: <Package className="w-3.5 h-3.5" />, activeClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' },
              ].map(({ value, label, icon, activeClass }) => (
                <button
                  key={value}
                  onClick={() => setFilterProvider(filterProvider === value ? '' : value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterProvider === value
                      ? activeClass + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto (CLP)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="Min" className="input" />
                <span className="text-slate-400 shrink-0">—</span>
                <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="Max" className="input" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="card p-6 animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />)}
        </div>
      ) : pageOrders.length > 0 ? (
        <>
          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-3">
            {pageOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status];
              const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              });
              const isPickup = order.payment_provider === 'store';
              const isWebpay = order.payment_provider === 'webpay';
              const isPOS = ['pos_cash', 'pos_debit', 'pos_credit'].includes(order.payment_provider || '');
              const customerName = getCustomerName(order);
              const customerEmail = getCustomerEmail(order);

              return (
                <div key={order.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{order.id.slice(0, 8)}</span>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{customerName}</p>
                      {customerEmail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{customerEmail}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${cfg?.color || 'bg-slate-100 text-slate-800'}`}>
                      {cfg?.label || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="text-slate-400 dark:text-slate-500">{date}</span>
                    <div className="flex items-center gap-2">
                      {isPickup && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <Store className="w-3.5 h-3.5" /> Retiro
                        </span>
                      )}
                      {isWebpay && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">
                          <CreditCard className="w-3.5 h-3.5" /> Webpay
                        </span>
                      )}
                      {isPOS && (
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 text-xs font-medium">
                          <Package className="w-3.5 h-3.5" /> POS
                        </span>
                      )}
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'reserved' ? (
                      <>
                        <button
                          onClick={() => handleApproveReservation(order.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                        <button
                          onClick={() => handleRejectReservation(order.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 min-h-[44px]"
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                      </>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`flex-1 appearance-none px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] ${cfg?.color || 'bg-slate-100 text-slate-800'}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                          <option key={val} value={val}>{c.label}</option>
                        ))}
                      </select>
                    )}
                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Orden</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pago</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pageOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status];
                  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                  const isPickup = order.payment_provider === 'store';
                  const isWebpay = order.payment_provider === 'webpay';
                  const isPOS = ['pos_cash', 'pos_debit', 'pos_credit'].includes(order.payment_provider || '');
                  const customerName = getCustomerName(order);
                  const customerEmail = getCustomerEmail(order);
                  const isGuest = !order.user_id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{order.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-full shrink-0 ${isGuest ? 'bg-slate-100 dark:bg-slate-700' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                            {isGuest
                              ? <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              : <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{customerName}</p>
                            {customerEmail && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3 shrink-0" />
                                {customerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3">
                        {isPickup ? (
                          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full w-fit">
                            <Store className="w-3.5 h-3.5" /> Retiro
                          </span>
                        ) : isWebpay ? (
                          <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full w-fit">
                            <CreditCard className="w-3.5 h-3.5" /> Webpay
                          </span>
                        ) : isPOS ? (
                          <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 text-xs font-medium bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-full w-fit">
                            <Package className="w-3.5 h-3.5" /> {order.payment_provider === 'pos_cash' ? 'POS Efect.' : order.payment_provider === 'pos_debit' ? 'POS Déb.' : 'POS Créd.'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'reserved' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveReservation(order.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectReservation(order.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Rechazar
                            </button>
                          </div>
                        ) : (
                          <div className="relative w-fit">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`appearance-none pr-7 pl-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border-0 ${cfg?.color || 'bg-slate-100 text-slate-800'}`}
                            >
                              {Object.entries(STATUS_CONFIG).map(([val, c]) => (
                                <option key={val} value={val}>{c.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/ordenes/${order.id}`}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center gap-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} de {filteredOrders.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 7 && currentPage < totalPages - 3 && (
                  <span className="text-slate-400 dark:text-slate-500 px-1">...</span>
                )}
                {totalPages > 7 && (
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      currentPage === totalPages ? 'bg-emerald-600 text-white border-emerald-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {hasActiveFilters ? 'Sin órdenes con los filtros actuales' : 'No hay órdenes registradas'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn btn-secondary mt-4">
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
