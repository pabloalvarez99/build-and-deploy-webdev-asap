'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { productApi, orderApi, ProductWithCategory, Order } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
 Package,
 ShoppingBag,
 Tags,
 AlertTriangle,
 XCircle,
 DollarSign,
 Clock,
 ArrowRight,
 ExternalLink,
 TrendingUp,
 TrendingDown,
} from 'lucide-react';
import {
 LineChart,
 Line,
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 Legend,
} from 'recharts';

interface Stats {
 totalProducts: number;
 activeProducts: number;
 lowStockProducts: number;
 outOfStockProducts: number;
 totalCategories: number;
 inventoryValue: number;
 pendingOrders: number;
 totalOrders: number;
 totalRevenue: number;
}

interface LowStockProduct {
 id: string;
 name: string;
 stock: number;
 slug: string;
}

interface SalesData {
 date: string;
 ventas: number;
 ordenes: number;
}

interface TopProduct {
 name: string;
 cantidad: number;
}

interface StatusData {
 name: string;
 value: number;
 color: string;
 [key: string]: string | number;
}

const STATUS_COLORS: Record<string, string> = {
 pending: '#EAB308',
 reserved: '#F59E0B',
 paid: '#22C55E',
 processing: '#3B82F6',
 shipped: '#A855F7',
 delivered: '#10B981',
 cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
 pending: 'Pendiente',
 reserved: 'Reservado',
 paid: 'Pagado',
 processing: 'Procesando',
 shipped: 'Enviado',
 delivered: 'Entregado',
 cancelled: 'Cancelado',
};

export default function AdminPage() {
 const router = useRouter();
 const { user } = useAuthStore();
 const [stats, setStats] = useState<Stats | null>(null);
 const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
 const [recentOrders, setRecentOrders] = useState<Order[]>([]);
 const [salesData, setSalesData] = useState<SalesData[]>([]);
 const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
 const [statusData, setStatusData] = useState<StatusData[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [isDark, setIsDark] = useState(false);

 // Track dark mode for Recharts SVG props (can't use Tailwind dark: on SVG attributes)
 useEffect(() => {
  const check = () => setIsDark(document.documentElement.classList.contains('dark'));
  check();
  const observer = new MutationObserver(check);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
 }, []);

 useEffect(() => {
 if (!user) {
 router.push('/auth/login');
 return;
 }
 if (user.role !== 'admin') {
 router.push('/');
 }
 }, [user, router]);

 useEffect(() => {
 if (user?.role === 'admin') {
 loadStats();
 loadRecentOrders();
 }
 }, [user]);

 const loadRecentOrders = async () => {
 try {
 const orders = await orderApi.listAll({ limit: 5 });
 setRecentOrders(orders.orders);
 } catch (error) {
 console.error('Error loading orders:', error);
 }
 };

 const loadStats = async () => {
 try {
 // Build reportes URL (30 days)
 const from30d = new Date();
 from30d.setDate(from30d.getDate() - 30);
 const fromStr = from30d.toISOString().split('T')[0];
 const toStr = new Date().toISOString().split('T')[0];
 const reportesPromise = fetch(`/api/admin/reportes?from=${fromStr}&to=${toStr}`)
  .then((r) => r.json()).catch(() => null);

 // Run all queries in parallel — count-only (limit:1) for accurate totals
 const [allProducts, activeProducts, categories, allOrders, pendingOrders, reservedOrders, outOfStockCount, lowStockCount, outOfStockDisplay] = await Promise.all([
 productApi.list({ limit: 1, active_only: false }),
 productApi.list({ limit: 1, active_only: true }),
 productApi.listCategories(false),
 orderApi.listAll({ limit: 1000 }),
 orderApi.listAll({ status: 'pending', limit: 1 }),
 orderApi.listAll({ status: 'reserved', limit: 1 }),
 productApi.list({ limit: 1, active_only: true, stock_filter: 'out' }),
 productApi.list({ limit: 1, active_only: true, stock_filter: 'low' }),
 // Fetch up to 10 out-of-stock products for display list (shown first)
 productApi.list({ limit: 10, active_only: true, stock_filter: 'out', sort_by: 'stock_asc' }),
 ]);

 // Fill remaining display slots (up to 10 total) with low-stock products
 const outOfStockShown = outOfStockDisplay.products.length;
 const lowStockSlots = Math.max(0, 10 - outOfStockShown);
 const lowStockDisplayItems = lowStockSlots > 0
 ? await productApi.list({ limit: lowStockSlots, active_only: true, stock_filter: 'low', sort_by: 'stock_asc' }).catch(() => ({ products: [] as typeof outOfStockDisplay.products }))
 : { products: [] as typeof outOfStockDisplay.products };

 const lowStockList: LowStockProduct[] = [
 ...outOfStockDisplay.products.map(p => ({ id: p.id, name: p.name, stock: p.stock, slug: p.slug })),
 ...lowStockDisplayItems.products.map(p => ({ id: p.id, name: p.name, stock: p.stock, slug: p.slug })),
 ].slice(0, 10);
 setLowStockProducts(lowStockList);

 // Await the reportes API (already running in parallel since promise was created earlier)
 const reportData = await reportesPromise;

 // Revenue and top products from accurate server-side reports API (no 1000-order limit)
 const totalRevenue = reportData?.kpis?.totalRevenue ?? 0;

 // Top products
 const topProductsList: TopProduct[] = (reportData?.topProducts || []).slice(0, 5).map(
  (p: { name: string; units: number }) => ({
   name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
   cantidad: p.units,
  })
 );
 setTopProducts(topProductsList);

 // 7-day sales chart from reportes salesByDay (last 7 days from 30-day data)
 if (reportData?.salesByDay?.length > 0) {
  const last7 = reportData.salesByDay.slice(-7);
  const salesChartData: SalesData[] = last7.map((d: { date: string; ventas: number; ordenes: number; ventas_pos?: number; ordenes_pos?: number }) => ({
   date: new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
   ventas: Math.round((d.ventas || 0) + (d.ventas_pos || 0)),
   ordenes: (d.ordenes || 0) + (d.ordenes_pos || 0),
  }));
  setSalesData(salesChartData);
 } else {
  // Fallback: compute from allOrders if reportes fails
  setSalesData(generateSalesData(allOrders.orders));
 }

 setStats({
 totalProducts: allProducts.total,
 activeProducts: activeProducts.total,
 lowStockProducts: lowStockCount.total,
 outOfStockProducts: outOfStockCount.total,
 totalCategories: categories.length,
 inventoryValue: 0,
 pendingOrders: pendingOrders.total + reservedOrders.total,
 totalOrders: allOrders.total,
 totalRevenue,
 });

 // Calculate status distribution
 const statusDistribution = calculateStatusDistribution(allOrders.orders);
 setStatusData(statusDistribution);

 } catch (error) {
 console.error('Error loading stats:', error);
 } finally {
 setIsLoading(false);
 }
 };

 const generateSalesData = (orders: Order[]): SalesData[] => {
 const data: SalesData[] = [];
 const now = new Date();

 for (let i = 6; i >= 0; i--) {
 const date = new Date(now);
 date.setDate(date.getDate() - i);
 const dateStr = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });

 const dayOrders = orders.filter((o) => {
 const orderDate = new Date(o.created_at);
 return (
 orderDate.getDate() === date.getDate() &&
 orderDate.getMonth() === date.getMonth() &&
 orderDate.getFullYear() === date.getFullYear()
 );
 });

 const ventas = dayOrders
 .filter((o) => ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(o.status))
 .reduce((sum, o) => sum + parseFloat(o.total), 0);

 data.push({
 date: dateStr,
 ventas: Math.round(ventas),
 ordenes: dayOrders.length,
 });
 }

 return data;
 };

 const calculateStatusDistribution = (orders: Order[]): StatusData[] => {
 const distribution: Record<string, number> = {};

 orders.forEach((o) => {
 distribution[o.status] = (distribution[o.status] || 0) + 1;
 });

 return Object.entries(distribution).map(([status, value]) => ({
 name: STATUS_LABELS[status] || status,
 value,
 color: STATUS_COLORS[status] || '#6B7280',
 }));
 };

 if (!user || user.role !== 'admin') {
 return null;
 }

 const statCards = stats
 ? [
 {
 title: 'Total Productos',
 value: stats.totalProducts.toLocaleString('es-CL'),
 icon: <Package className="w-6 h-6" />,
 color: 'bg-blue-500',
  textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
  title: 'Categorías',
  value: stats.totalCategories.toLocaleString('es-CL'),
  icon: <Tags className="w-6 h-6" />,
  color: 'bg-purple-500',
  textColor: 'text-purple-600 dark:text-purple-400',
  },
  {
  title: 'Ventas (30 días)',
  value: formatPrice(stats.totalRevenue),
  icon: <DollarSign className="w-6 h-6" />,
  color: 'bg-green-500',
  textColor: 'text-green-600 dark:text-green-400',
  },
  {
  title: 'Por atender',
  value: stats.pendingOrders.toLocaleString('es-CL'),
  icon: <Clock className="w-6 h-6" />,
  color: 'bg-yellow-500',
  textColor: 'text-yellow-600 dark:text-yellow-400',
  },
  {
  title: 'Stock Bajo (≤10)',
  value: stats.lowStockProducts.toLocaleString('es-CL'),
  icon: <AlertTriangle className="w-6 h-6" />,
  color: 'bg-orange-500',
  textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
  title: 'Agotados',
  value: stats.outOfStockProducts.toLocaleString('es-CL'),
  icon: <XCircle className="w-6 h-6" />,
  color: 'bg-red-500',
  textColor: 'text-red-600 dark:text-red-400',
 },
 ]
 : [];

 return (
 <div className="max-w-7xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Panel de Administración</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-2">Bienvenido, {user.name || user.email}</p>
 </div>

 {/* Statistics */}
 <div className="mb-8">
 <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Resumen</h2>
 {isLoading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="card p-4 animate-pulse">
 <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
 <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-2" />
 <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16" />
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {statCards.map((stat) => (
 <div key={stat.title} className="card p-4">
 <div
 className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}
 >
 {stat.icon}
 </div>
 <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
 <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Charts Section */}
 {!isLoading && (
 <div className="grid lg:grid-cols-2 gap-6 mb-8">
 {/* Sales Line Chart */}
 <div className="card p-6">
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Ventas Últimos 7 Días</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={salesData}>
 <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
 <XAxis dataKey="date" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={12} />
 <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
 <Tooltip
 contentStyle={{
 backgroundColor: '#1F2937',
 border: 'none',
 borderRadius: '8px',
 color: '#F9FAFB',
 }}
 formatter={(value) => [formatPrice(Number(value)), 'Ventas']}
 />
 <Line
 type="monotone"
 dataKey="ventas"
 stroke="#10B981"
 strokeWidth={3}
 dot={{ fill: '#10B981', strokeWidth: 2 }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Orders by Status Pie Chart */}
 <div className="card p-6">
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Órdenes por Estado</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={statusData}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={90}
 paddingAngle={2}
 dataKey="value"
 label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
 labelLine={false}
 >
 {statusData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip
 contentStyle={{
 backgroundColor: '#1F2937',
 border: 'none',
 borderRadius: '8px',
 color: '#F9FAFB',
 }}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Top Products Bar Chart */}
 <div className="card p-6 lg:col-span-2">
 <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Top Productos</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={topProducts} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} />
 <XAxis type="number" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={12} />
 <YAxis dataKey="name" type="category" width={150} stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={11} />
 <Tooltip
 contentStyle={{
 backgroundColor: '#1F2937',
 border: 'none',
 borderRadius: '8px',
 color: '#F9FAFB',
 }}
 />
 <Bar dataKey="cantidad" fill="#10B981" radius={[0, 4, 4, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>
 )}

 {/* Two Column Layout */}
 <div className="grid lg:grid-cols-2 gap-8">
 {/* Low Stock Alert */}
 <div className="card overflow-hidden">
 <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 text-white">
 <AlertTriangle className="w-6 h-6" />
 <h3 className="text-lg font-semibold">Stock Crítico</h3>
 </div>
 <Link
 href="/admin/productos?stock=low"
 className="text-white/80 hover:text-white text-sm flex items-center gap-1"
 >
 Ver todos <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700">
 {lowStockProducts.length > 0 ? (
 lowStockProducts.map((product) => (
 <div key={product.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30">
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{product.name}</p>
 </div>
 <div className="flex items-center gap-3">
 <span
 className={`px-2.5 py-1 rounded-full text-xs font-bold ${
 product.stock === 0
 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
 : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
 }`}
 >
 {product.stock === 0 ? 'AGOTADO' : `${product.stock} uds`}
 </span>
 <Link
 href={`/admin/productos?search=${encodeURIComponent(product.name)}`}
 className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
 >
 <ExternalLink className="w-4 h-4" />
 </Link>
 </div>
 </div>
 ))
 ) : (
 <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
 <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
 <p>No hay productos con stock bajo</p>
 </div>
 )}
 </div>
 </div>

 {/* Recent Orders */}
 <div className="card overflow-hidden">
 <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3 text-white">
 <ShoppingBag className="w-6 h-6" />
 <h3 className="text-lg font-semibold">Órdenes Recientes</h3>
 </div>
 <Link
 href="/admin/ordenes"
 className="text-white/80 hover:text-white text-sm flex items-center gap-1"
 >
 Ver todas <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 <div className="divide-y divide-slate-100 dark:divide-slate-700">
 {recentOrders.length > 0 ? (
 recentOrders.map((order) => {
  const statusBadgeColors: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  reserved: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  shipped: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  delivered: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };
 const date = new Date(order.created_at).toLocaleDateString('es-CL', {
 day: '2-digit',
 month: 'short',
 hour: '2-digit',
 minute: '2-digit',
 });
 return (
 <Link
 key={order.id}
 href={`/admin/ordenes/${order.id}`}
 className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
 >
 <div className="flex-1 min-w-0">
 <p className="text-sm font-mono text-slate-600 dark:text-slate-300">#{order.id.slice(0, 8)}</p>
 <p className="text-xs text-slate-400 dark:text-slate-500">{date}</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
 {formatPrice(order.total)}
 </span>
 <span
 className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeColors[order.status] || 'bg-slate-100 text-slate-800'}`}
 >
 {STATUS_LABELS[order.status] || order.status}
 </span>
 </div>
 </Link>
 );
 })
 ) : (
 <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
 <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
 <p>No hay órdenes recientes</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
