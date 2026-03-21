'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, UserX, Search, Phone, Mail, ShoppingBag, Calendar, Download } from 'lucide-react';

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

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'registered' | 'guest'>('all');

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">Base de datos de clientes registrados e invitados</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-slate-500 text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? '…' : customers.length}</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-slate-500 text-sm">Registrados</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? '…' : registered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <UserX className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-slate-500 text-sm">Invitados</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? '…' : guests.length}</p>
        </div>
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-slate-500 text-sm">Con pedidos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{isLoading ? '…' : withOrders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'registered', 'guest'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
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
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pedidos</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Último pedido</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c.id || c.email} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-700 font-bold text-sm">
                              {(c.name?.[0] || c.email?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {c.name || c.surname ? `${c.name} ${c.surname}`.trim() : '—'}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.phone ? (
                          <span className="text-slate-700 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          c.type === 'registered'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.type === 'registered' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {c.type === 'registered' ? 'Registrado' : 'Invitado'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${c.order_count > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {c.order_count}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 text-sm flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(c.last_order)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(c.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((c) => (
                <div key={c.id || c.email} className="p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold">
                        {(c.name?.[0] || c.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">
                          {c.name || c.surname ? `${c.name} ${c.surname}`.trim() : 'Sin nombre'}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.type === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.type === 'registered' ? 'Registrado' : 'Invitado'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 truncate">{c.email}</p>
                      {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{c.order_count} pedido{c.order_count !== 1 ? 's' : ''}</span>
                    <span>Último: {formatDate(c.last_order)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
              Mostrando {filtered.length} de {customers.length} clientes
            </div>
          </>
        )}
      </div>
    </div>
  );
}
