'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, UserX, Search, Phone, Mail, ShoppingBag,
  Calendar, Download, X, Edit2, Trash2, ChevronRight, Package,
  ArrowLeft, Save, AlertTriangle, Clock, CheckCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Customer {
  id: string | null;
  email: string;
  name: string;
  surname: string;
  phone: string | null;
  created_at: string;
  order_count: number;
  last_order: string | null;
  type: 'registered' | 'guest';
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}

interface Order {
  id: string;
  status: string;
  total: string;
  created_at: string;
  payment_provider: string | null;
  pickup_code: string | null;
  notes: string | null;
  shipping_address: string | null;
  items: OrderItem[];
}

interface CustomerDetail {
  customer: Customer;
  orders: Order[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',     color: 'bg-amber-100 text-amber-700' },
  reserved:   { label: 'Reservado',     color: 'bg-amber-100 text-amber-700' },
  paid:       { label: 'Pagado',        color: 'bg-green-100 text-green-700' },
  processing: { label: 'En proceso',    color: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Enviado',       color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Entregado',     color: 'bg-emerald-100 text-emerald-700' },
  cancelled:  { label: 'Cancelado',     color: 'bg-red-100 text-red-700' },
  rejected:   { label: 'Rechazado',     color: 'bg-red-100 text-red-700' },
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'registered' | 'guest'>('all');

  // Panel state
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/clientes');
      const data = await res.json();
      const all: Customer[] = [
        ...(data.registered || []),
        ...(data.guests || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCustomers(all);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  const openCustomer = async (c: Customer) => {
    setSelected(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setEditError('');
    setIsPanelLoading(true);

    try {
      const url = c.type === 'guest'
        ? `/api/admin/clientes/guest?email=${encodeURIComponent(c.email)}`
        : `/api/admin/clientes/${c.id}`;
      const res = await fetch(url);
      if (!res.ok) { setSelected(null); return; }
      const data = await res.json();
      setSelected(data);
      setEditName(data.customer.name);
      setEditSurname(data.customer.surname);
      setEditPhone(data.customer.phone || '');
    } catch {
      setSelected(null);
    } finally {
      setIsPanelLoading(false);
    }
  };

  const closePanel = () => {
    setSelected(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!selected?.customer.id) return;
    setIsSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/admin/clientes/${selected.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), surname: editSurname.trim(), phone: editPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || 'Error al guardar'); return; }

      // Update local state
      setSelected((prev) => prev ? { ...prev, customer: { ...prev.customer, name: editName.trim(), surname: editSurname.trim(), phone: editPhone.trim() || null } } : prev);
      setCustomers((prev) => prev.map((c) => c.id === selected.customer.id ? { ...c, name: editName.trim(), surname: editSurname.trim(), phone: editPhone.trim() || null } : c));
      setIsEditing(false);
    } catch {
      setEditError('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCustomer = async () => {
    if (!selected?.customer.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/clientes/${selected.customer.id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== selected.customer.id));
        closePanel();
        loadCustomers();
      }
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.email?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q) ||
      c.surname?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  const registered = customers.filter((c) => c.type === 'registered');
  const guests = customers.filter((c) => c.type === 'guest');
  const withOrders = customers.filter((c) => c.order_count > 0);

  const exportCSV = () => {
    const rows = [
      ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Tipo', 'N° Pedidos', 'Último pedido', 'Registrado'],
      ...filtered.map((c) => [
        c.name, c.surname, c.email, c.phone || '',
        c.type === 'registered' ? 'Registrado' : 'Invitado',
        c.order_count,
        c.last_order ? new Date(c.last_order).toLocaleDateString('es-CL') : '',
        new Date(c.created_at).toLocaleDateString('es-CL'),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const totalSpent = (orders: Order[]) =>
    orders.filter((o) => !['cancelled', 'rejected'].includes(o.status)).reduce((s, o) => s + parseFloat(o.total), 0);

  return (
    <div className="flex h-full">
      {/* Main list */}
      <div className={`flex-1 overflow-auto p-4 sm:p-6 lg:p-8 transition-all ${selected || isPanelLoading ? 'lg:pr-4' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
              <p className="text-slate-500 mt-1">Base de datos de clientes registrados e invitados</p>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Users, color: 'emerald', label: 'Total', value: customers.length },
              { icon: UserCheck, color: 'blue', label: 'Registrados', value: registered.length },
              { icon: UserX, color: 'amber', label: 'Invitados', value: guests.length },
              { icon: ShoppingBag, color: 'purple', label: 'Con pedidos', value: withOrders.length },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border-2 border-slate-100 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 bg-${color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <span className="text-slate-500 text-sm">{label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{isLoading ? '…' : value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email o teléfono..." className="input pl-10" />
            </div>
            <div className="flex gap-2">
              {(['all', 'registered', 'guest'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {f === 'all' ? 'Todos' : f === 'registered' ? 'Registrados' : 'Invitados'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                <p>Cargando clientes...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No se encontraron clientes</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {['Cliente', 'Teléfono', 'Tipo', 'Pedidos', 'Último pedido', 'Acciones'].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr
                          key={c.id || c.email}
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${selected?.customer.email === c.email ? 'bg-emerald-50/60' : ''}`}
                          onClick={() => openCustomer(c)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-emerald-700 font-bold text-sm">{(c.name?.[0] || c.email?.[0] || '?').toUpperCase()}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{c.name || c.surname ? `${c.name} ${c.surname}`.trim() : '—'}</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {c.phone ? <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.phone}</span> : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.type === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {c.type === 'registered' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                              {c.type === 'registered' ? 'Registrado' : 'Invitado'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600">{c.order_count}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />{formatDate(c.last_order)}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openCustomer(c)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ver historial">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              {c.type === 'registered' && (
                                <>
                                  <button onClick={() => { openCustomer(c); setTimeout(() => setIsEditing(true), 300); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => { openCustomer(c); setTimeout(() => setShowDeleteConfirm(true), 300); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <div key={c.id || c.email} className="p-4 flex items-start gap-3 cursor-pointer hover:bg-slate-50" onClick={() => openCustomer(c)}>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-700 font-bold">{(c.name?.[0] || c.email?.[0] || '?').toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 truncate">{c.name || c.surname ? `${c.name} ${c.surname}`.trim() : 'Sin nombre'}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${c.type === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {c.type === 'registered' ? 'Registrado' : 'Invitado'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{c.email}</p>
                        <p className="text-sm text-slate-400">{c.order_count} pedido{c.order_count !== 1 ? 's' : ''} · Último: {formatDate(c.last_order)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 mt-1" />
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                  {filtered.length} de {customers.length} clientes
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {(isPanelLoading || selected) && (
        <div className="fixed inset-0 z-40 lg:relative lg:inset-auto flex">
          {/* Overlay on mobile */}
          <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={closePanel} />

          <div className="relative ml-auto w-full max-w-lg lg:max-w-md xl:max-w-lg h-full lg:h-auto bg-white border-l-2 border-slate-200 overflow-y-auto shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button onClick={closePanel} className="p-2 rounded-lg hover:bg-slate-100 lg:hidden">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-slate-900 text-lg">
                  {isPanelLoading ? 'Cargando...' : selected ? `${selected.customer.name} ${selected.customer.surname}`.trim() || selected.customer.email : ''}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {selected?.customer.type === 'registered' && !isEditing && (
                  <>
                    <button onClick={() => { setIsEditing(true); setEditError(''); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={closePanel} className="p-2 rounded-lg hover:bg-slate-100 hidden lg:flex">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isPanelLoading ? (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse" />
                  <p>Cargando información...</p>
                </div>
              </div>
            ) : selected && (
              <div className="flex-1 p-5 space-y-5">
                {/* Delete confirm */}
                {showDeleteConfirm && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-red-800">¿Eliminar esta cuenta?</p>
                        <p className="text-sm text-red-700 mt-1">Se eliminará la cuenta de <strong>{selected.customer.email}</strong>. Sus pedidos se conservarán en el sistema.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 px-3 rounded-xl border-2 border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50">
                        Cancelar
                      </button>
                      <button onClick={deleteCustomer} disabled={isDeleting} className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm disabled:opacity-50">
                        {isDeleting ? 'Eliminando...' : 'Confirmar eliminar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer info */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 font-black text-xl">
                        {(selected.customer.name?.[0] || selected.customer.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${selected.customer.type === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {selected.customer.type === 'registered' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {selected.customer.type === 'registered' ? 'Registrado' : 'Invitado'}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Apellido</label>
                          <input value={editSurname} onChange={(e) => setEditSurname(e.target.value)} className="input text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
                        <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+56 9 XXXX XXXX" className="input text-sm" />
                      </div>
                      {editError && <p className="text-red-600 text-sm">{editError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => { setIsEditing(false); setEditError(''); }} className="flex-1 py-2 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                          Cancelar
                        </button>
                        <button onClick={saveEdit} disabled={isSaving} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {selected.customer.email}
                      </div>
                      {selected.customer.phone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {selected.customer.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Registrado: {formatDate(selected.customer.created_at)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-700">{selected.orders.length}</p>
                    <p className="text-xs text-emerald-600 font-medium">Pedidos totales</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                    <p className="text-2xl font-black text-emerald-700">{formatPrice(totalSpent(selected.orders))}</p>
                    <p className="text-xs text-emerald-600 font-medium">Total comprado</p>
                  </div>
                </div>

                {/* Order history */}
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                    Historial de compras
                  </h3>

                  {selected.orders.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin pedidos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selected.orders.map((order) => {
                        const st = STATUS_LABELS[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-600' };
                        return (
                          <div key={order.id} className="border-2 border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-mono font-bold text-slate-900 text-sm">#{order.id.slice(0, 8)}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {formatDateTime(order.created_at)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-900">{formatPrice(order.total)}</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${st.color}`}>{st.label}</span>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 pt-3 border-t border-slate-100">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-slate-700 truncate mr-2">{item.product_name} <span className="text-slate-400">×{item.quantity}</span></span>
                                  <span className="text-slate-900 font-medium flex-shrink-0">{formatPrice(parseFloat(item.price_at_purchase) * item.quantity)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Extra info */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {order.payment_provider === 'store' && (
                                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Retiro en tienda</span>
                              )}
                              {order.pickup_code && (
                                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">Código: {order.pickup_code}</span>
                              )}
                              {order.shipping_address && (
                                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full truncate max-w-[200px]">{order.shipping_address}</span>
                              )}
                              {['cancelled', 'rejected'].includes(order.status) && (
                                <span className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />No contabilizado en total</span>
                              )}
                              {order.status === 'delivered' && (
                                <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Entregado</span>
                              )}
                            </div>

                            {order.notes && (
                              <p className="mt-2 text-xs text-slate-500 italic border-t border-slate-50 pt-2">"{order.notes}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
