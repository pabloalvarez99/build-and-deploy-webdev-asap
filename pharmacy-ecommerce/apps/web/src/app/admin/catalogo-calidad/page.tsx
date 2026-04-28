'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { isAdminRole } from '@/lib/roles';
import {
  ClipboardCheck,
  ImageOff,
  DollarSign,
  PackageX,
  TrendingDown,
  FolderX,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatPrice } from '@/lib/format';

type IssueType = 'sin_imagen' | 'sin_precio' | 'sin_stock' | 'sin_costo' | 'sin_categoria';

interface QualityStats {
  total_active: number;
  total_inactive: number;
  missing_image: number;
  missing_price: number;
  zero_stock: number;
  no_category: number;
  no_cost: number;
}

interface QualityProduct {
  id: string;
  name: string;
  price: number | null;
  stock: number;
  image_url: string | null;
  category_id: string | null;
  cost_price: number | null;
  active: boolean;
  issues: IssueType[];
}

type SortField = 'issues' | 'name' | 'price' | 'stock';

const ISSUE_CONFIG: Record<
  IssueType,
  { label: string; shortLabel: string; colorBg: string; colorText: string; darkBg: string; darkText: string; statKey: keyof QualityStats }
> = {
  sin_imagen: {
    label: 'Sin imagen',
    shortLabel: 'Imagen',
    colorBg: 'bg-slate-100',
    colorText: 'text-slate-700',
    darkBg: 'dark:bg-slate-700',
    darkText: 'dark:text-slate-300',
    statKey: 'missing_image',
  },
  sin_precio: {
    label: 'Sin precio',
    shortLabel: 'Precio',
    colorBg: 'bg-red-100',
    colorText: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-400',
    statKey: 'missing_price',
  },
  sin_stock: {
    label: 'Sin stock',
    shortLabel: 'Stock',
    colorBg: 'bg-orange-100',
    colorText: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-400',
    statKey: 'zero_stock',
  },
  sin_costo: {
    label: 'Sin costo',
    shortLabel: 'Costo',
    colorBg: 'bg-blue-100',
    colorText: 'text-blue-700',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-400',
    statKey: 'no_cost',
  },
  sin_categoria: {
    label: 'Sin categoría',
    shortLabel: 'Categoría',
    colorBg: 'bg-purple-100',
    colorText: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-400',
    statKey: 'no_category',
  },
};

const KPI_CARDS = [
  {
    issue: 'sin_imagen' as IssueType,
    icon: ImageOff,
    label: 'Sin imagen',
    description: 'Productos sin foto',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    borderActive: 'border-slate-500',
    bgActive: 'bg-slate-50 dark:bg-slate-700/40',
  },
  {
    issue: 'sin_precio' as IssueType,
    icon: DollarSign,
    label: 'Sin precio',
    description: 'Precio $0 o nulo',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    borderActive: 'border-red-500',
    bgActive: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    issue: 'sin_stock' as IssueType,
    icon: PackageX,
    label: 'Sin stock',
    description: 'Stock = 0',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderActive: 'border-orange-500',
    bgActive: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    issue: 'sin_costo' as IssueType,
    icon: TrendingDown,
    label: 'Sin costo',
    description: 'Afecta margen',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderActive: 'border-blue-500',
    bgActive: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    issue: 'sin_categoria' as IssueType,
    icon: FolderX,
    label: 'Sin categoría',
    description: 'Sin clasificar',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderActive: 'border-purple-500',
    bgActive: 'bg-purple-50 dark:bg-purple-900/20',
  },
];

export default function CatalogoCalidadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [products, setProducts] = useState<QualityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<IssueType | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('issues');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) { router.push('/'); return; }
    loadData(null);
  }, [user, router]);

  const loadData = async (issueFilter: IssueType | null) => {
    setLoading(true);
    setError(null);
    try {
      const qs = issueFilter ? `?issue=${issueFilter}` : '';
      const res = await fetch(`/api/admin/catalog-quality${qs}`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setStats(data.stats);
      setProducts(data.issues);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (issue: IssueType) => {
    const next = activeFilter === issue ? null : issue;
    setActiveFilter(next);
    loadData(next);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(field === 'name'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />;
  };

  const filtered = useMemo(() => {
    let arr = products;
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(q));
    }
    return [...arr].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortField) {
        case 'issues': va = a.issues.length; vb = b.issues.length; break;
        case 'name': va = a.name; vb = b.name; break;
        case 'price': va = a.price ?? -1; vb = b.price ?? -1; break;
        case 'stock': va = a.stock; vb = b.stock; break;
      }
      if (typeof va === 'string') {
        return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [products, search, sortField, sortAsc]);

  // Products with at least one issue
  const productsWithIssues = stats
    ? stats.missing_image + stats.missing_price + stats.zero_stock + stats.no_category + stats.no_cost
    : 0;
  // Count unique products with issues (stats overlap, so use a rough deduplicated count)
  // We use the loaded issues list length as proxy — server returns all if no filter
  const uniqueWithIssues = !activeFilter ? products.length : null;

  if (!user || !isAdminRole(user.role)) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calidad del Catálogo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Auditoría de problemas en productos activos</p>
          </div>
        </div>
        <button
          onClick={() => { setActiveFilter(null); loadData(null); }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Summary banner */}
      {!loading && stats && (
        <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border-2 ${
          uniqueWithIssues && uniqueWithIssues > 0
            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
        }`}>
          <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            uniqueWithIssues && uniqueWithIssues > 0
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-emerald-500 dark:text-emerald-400'
          }`} />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {uniqueWithIssues !== null && uniqueWithIssues > 0
                ? `${uniqueWithIssues.toLocaleString()} de ${stats.total_active.toLocaleString()} productos activos tienen al menos un problema de calidad.`
                : activeFilter
                ? `Mostrando productos con problema: ${ISSUE_CONFIG[activeFilter].label}`
                : 'Catálogo sin problemas detectados.'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.total_active.toLocaleString()} activos · {stats.total_inactive.toLocaleString()} inactivos · Mostrando top 100 con más problemas
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {KPI_CARDS.map((card) => {
            const count = stats[ISSUE_CONFIG[card.issue].statKey] as number;
            const pct = stats.total_active > 0 ? ((count / stats.total_active) * 100).toFixed(1) : '0.0';
            const isActive = activeFilter === card.issue;
            return (
              <button
                key={card.issue}
                onClick={() => handleFilterClick(card.issue)}
                className={`text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                  isActive
                    ? `${card.borderActive} ${card.bgActive}`
                    : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                }`}
              >
                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{card.description}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{count.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-1">{pct}% del catálogo activo</p>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 font-medium">Error al cargar datos</p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-1">{error}</p>
          <button
            onClick={() => loadData(activeFilter)}
            className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Active filter indicator */}
      {activeFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Filtrando por:</span>
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${ISSUE_CONFIG[activeFilter].colorBg} ${ISSUE_CONFIG[activeFilter].colorText} ${ISSUE_CONFIG[activeFilter].darkBg} ${ISSUE_CONFIG[activeFilter].darkText}`}>
            {ISSUE_CONFIG[activeFilter].label}
            <button
              onClick={() => { setActiveFilter(null); loadData(null); }}
              className="hover:opacity-70"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">Analizando catálogo...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>
              {search ? 'Sin resultados para la búsqueda' : 'No se encontraron productos con problemas'}
            </p>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-400">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              {search ? ' (filtrado)' : ''}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    {([
                      { key: 'name' as SortField, label: 'Producto' },
                      { key: 'price' as SortField, label: 'Precio' },
                      { key: 'stock' as SortField, label: 'Stock' },
                      { key: 'issues' as SortField, label: 'Problemas' },
                    ]).map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          <SortIcon field={key} />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                        <span className="block truncate">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {product.price !== null && product.price > 0 ? (
                          <span className="text-slate-700 dark:text-slate-300">{formatPrice(product.price)}</span>
                        ) : (
                          <span className="text-red-500 dark:text-red-400 font-medium">$0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-mono font-bold ${product.stock === 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.issues.map((issue) => {
                            const cfg = ISSUE_CONFIG[issue];
                            return (
                              <span
                                key={issue}
                                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.colorBg} ${cfg.colorText} ${cfg.darkBg} ${cfg.darkText}`}
                              >
                                {cfg.shortLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/productos?search=${encodeURIComponent(product.name.slice(0, 40))}`}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          Ver producto →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
