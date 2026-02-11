'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, PaginatedOrders, Order } from '@/lib/api';
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
  XCircle
} from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'reserved', label: 'Reservado', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'paid', label: 'Pagado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'processing', label: 'Procesando', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'shipped', label: 'Enviado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'delivered', label: 'Entregado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<PaginatedOrders | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize from URL params
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilterStatus([status]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadOrders();
    }
  }, [user, currentPage]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Load all orders via admin endpoint (service role, sees all including guest orders)
      const allData = await orderApi.listAll({ limit: 1000 });
      setAllOrders(allData.orders);

      // Apply filters client-side for now
      const filtered = applyFilters(allData.orders);
      const paginated = paginateOrders(filtered);
      setOrders(paginated);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (ordersList: Order[]) => {
    return ordersList.filter((order) => {
      // Status filter
      if (filterStatus.length > 0 && !filterStatus.includes(order.status)) {
        return false;
      }

      // Date range filter
      if (dateFrom) {
        const orderDate = new Date(order.created_at);
        const fromDate = new Date(dateFrom);
        if (orderDate < fromDate) return false;
      }
      if (dateTo) {
        const orderDate = new Date(order.created_at);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }

      // Amount range filter
      const orderAmount = parseFloat(order.total);
      if (minAmount && orderAmount < parseFloat(minAmount)) return false;
      if (maxAmount && orderAmount > parseFloat(maxAmount)) return false;

      // Search filter (by ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!order.id.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  const paginateOrders = (filtered: Order[]) => {
    const limit = 20;
    const start = (currentPage - 1) * limit;
    const end = start + limit;

    return {
      orders: filtered.slice(start, end),
      total: filtered.length,
      page: currentPage,
      limit,
      total_pages: Math.ceil(filtered.length / limit),
    };
  };

  useEffect(() => {
    if (allOrders.length > 0) {
      const filtered = applyFilters(allOrders);
      const paginated = paginateOrders(filtered);
      setOrders(paginated);
    }
  }, [filterStatus, dateFrom, dateTo, minAmount, maxAmount, searchQuery, currentPage, allOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await orderApi.updateStatus(orderId, newStatus);
      loadOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleApproveReservation = async (orderId: string) => {
    if (!confirm('Aprobar esta reserva? El stock de los productos se reducira.')) return;
    try {
      await orderApi.approveReservation(orderId);
      loadOrders();
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert(error instanceof Error ? error.message : 'Error al aprobar la reserva');
    }
  };

  const handleRejectReservation = async (orderId: string) => {
    if (!confirm('Rechazar esta reserva? La orden sera cancelada.')) return;
    try {
      await orderApi.rejectReservation(orderId);
      loadOrders();
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert(error instanceof Error ? error.message : 'Error al rechazar la reserva');
    }
  };

  const clearFilters = () => {
    setFilterStatus([]);
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    setCurrentPage(1);
    window.history.replaceState({}, '', '/admin/ordenes');
  };

  const hasActiveFilters = filterStatus.length > 0 || dateFrom || dateTo || minAmount || maxAmount || searchQuery;

  const toggleStatusFilter = (status: string) => {
    setFilterStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setCurrentPage(1);
  };

  const exportToCSV = async () => {
    try {
      // Get filtered orders with details
      const filtered = applyFilters(allOrders);

      // For each order, we'd need to get the items
      // For now, export basic order info
      const headers = ['ID', 'Fecha', 'Estado', 'Total', 'Direccion', 'Notas'];
      const rows = filtered.map((order) => [
        order.id,
        new Date(order.created_at).toLocaleDateString('es-CL'),
        statusOptions.find((s) => s.value === order.status)?.label || order.status,
        order.total,
        order.shipping_address || '',
        order.notes || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ordenes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ordenes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {orders ? `${orders.total} ordenes encontradas` : 'Cargando...'}
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
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={loadOrders}
            className="btn btn-secondary p-2.5"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">Filtros avanzados</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Buscar por ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ID de orden..."
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Desde
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Date to */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hasta
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Amount range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monto (CLP)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="Min"
                  className="input"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="Max"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Status checkboxes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleStatusFilter(status.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filterStatus.includes(status.value)
                      ? status.color + ' ring-2 ring-offset-2 ring-current'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card p-6 animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      ) : orders && orders.orders.length > 0 ? (
        <>
          {/* Mobile: Card layout */}
          <div className="md:hidden space-y-3">
            {orders.orders.map((order) => {
              const currentStatus = statusOptions.find((s) => s.value === order.status);
              const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={order.id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus?.color || 'bg-slate-100 text-slate-800'}`}>
                      {currentStatus?.label || order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'reserved' ? (
                      <>
                        <button
                          onClick={() => handleApproveReservation(order.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 min-h-[44px]"
                        >
                          <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                        <button
                          onClick={() => handleRejectReservation(order.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 min-h-[44px]"
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                      </>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`flex-1 appearance-none px-3 py-2 rounded-xl text-sm font-medium min-h-[44px] ${currentStatus?.color || 'bg-slate-100 text-slate-800'}`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                    <Link
                      href={`/admin/ordenes/${order.id}`}
                      className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Estado</th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {orders.orders.map((order) => {
                  const currentStatus = statusOptions.find((s) => s.value === order.status);
                  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 lg:px-6 py-4">
                        <span className="font-mono text-sm text-slate-900 dark:text-white">
                          {order.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">{date}</td>
                      <td className="px-4 lg:px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {order.status === 'reserved' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveReservation(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRejectReservation(order.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`appearance-none pr-8 pl-3 py-1 rounded-full text-sm font-medium cursor-pointer ${currentStatus?.color || 'bg-slate-100 text-slate-800'}`}
                            >
                              {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <Link
                          href={`/admin/ordenes/${order.id}`}
                          className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 inline-block"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
                Pagina {currentPage} de {orders.total_pages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(orders.total_pages, p + 1))}
                disabled={currentPage === orders.total_pages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            {hasActiveFilters ? 'No se encontraron ordenes con los filtros aplicados' : 'No hay ordenes registradas'}
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
