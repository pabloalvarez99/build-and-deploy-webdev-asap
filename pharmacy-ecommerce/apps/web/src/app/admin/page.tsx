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
 paid: '#22C55E',
 processing: '#3B82F6',
 shipped: '#A855F7',
 delivered: '#10B981',
 cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
 pending: 'Pendiente',
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
 const orders = await orderApi.list({ limit: 5 });
 setRecentOrders(orders.orders);
 } catch (error) {
 console.error('Error loading orders:', error);
 }
 };

 const loadStats = async () => {
 try {
 // Load products stats
 const allProducts = await productApi.list({ limit: 1, active_only: false });
 const activeProducts = await productApi.list({ limit: 1, active_only: true });
 const categories = await productApi.listCategories();

 // Load all orders for charts
 const allOrders = await orderApi.list({ limit: 1000 });
 const pendingOrders = await orderApi.list({ status: 'pending', limit: 1 });

 // Calculate inventory stats by fetching a larger batch
 const productsForStats = await productApi.list({ limit: 1000, active_only: false });

 let lowStock = 0;
 let outOfStock = 0;
 let inventoryValue = 0;
 const lowStockList: LowStockProduct[] = [];

 productsForStats.products.forEach((p) => {
 const price = parseFloat(p.price);
 inventoryValue += p.stock * price;
 if (p.stock === 0) {
 outOfStock++;
 lowStockList.push({ id: p.id, name: p.name, stock: p.stock, slug: p.slug });
 } else if (p.stock <= 10) {
 lowStock++;
 lowStockList.push({ id: p.id, name: p.name, stock: p.stock, slug: p.slug });
 }
 });

 // Sort by stock ascending and take top 10
 lowStockList.sort((a, b) => a.stock - b.stock);
 setLowStockProducts(lowStockList.slice(0, 10));

 // Calculate total revenue
 const totalRevenue = allOrders.orders
 .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
 .reduce((sum, o) => sum + parseFloat(o.total), 0);

 setStats({
 totalProducts: allProducts.total,
 activeProducts: activeProducts.total,
 lowStockProducts: lowStock,
 outOfStockProducts: outOfStock,
 totalCategories: categories.length,
 inventoryValue,
 pendingOrders: pendingOrders.total,
 totalOrders: allOrders.total,
 totalRevenue,
 });

 // Calculate sales data for last 7 days
 const last7Days = generateSalesData(allOrders.orders);
 setSalesData(last7Days);

 // Calculate top products (mock data since we don't have item-level order data easily)
 const topProductsList = calculateTopProducts(allOrders.orders, productsForStats.products);
 setTopProducts(topProductsList);

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
 .filter((o) => o.status !== 'cancelled' && o.status !== 'pending')
 .reduce((sum, o) => sum + parseFloat(o.total), 0);

 data.push({
 date: dateStr,
 ventas: Math.round(ventas),
 ordenes: dayOrders.length,
 });
 }

 return data;
 };

 const calculateTopProducts = (orders: Order[], products: ProductWithCategory[]): TopProduct[] => {
 // Since we don't have detailed order items, we'll show top products by stock movement
 // In a real scenario, we'd aggregate from order items
 const sorted = [...products]
 .filter((p) => p.active)
 .sort((a, b) => parseFloat(b.price) * (100 - b.stock) - parseFloat(a.price) * (100 - a.stock))
 .slice(0, 5);

 return sorted.map((p) => ({
 name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
 cantidad: Math.max(1, 100 - p.stock), // Simulated quantity sold
 }));
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
 textColor: 'text-blue-600',
 },
 {
 title: 'Categorias',
 value: stats.totalCategories.toLocaleString('es-CL'),
 icon: <Tags className="w-6 h-6" />,
 color: 'bg-purple-500',
 textColor: 'text-purple-600',
 },
 {
 title: 'Ventas Totales',
 value: formatPrice(stats.totalRevenue),
 icon: <DollarSign className="w-6 h-6" />,
 color: 'bg-green-500',
 textColor: 'text-green-600',
 },
 {
 title: 'Ordenes Pendientes',
 value: stats.pendingOrders.toLocaleString('es-CL'),
 icon: <Clock className="w-6 h-6" />,
 color: 'bg-yellow-500',
 textColor: 'text-yellow-600',
 },
 {
 title: 'Stock Bajo (≤10)',
 value: stats.lowStockProducts.toLocaleString('es-CL'),
 icon: <AlertTriangle className="w-6 h-6" />,
 color: 'bg-orange-500',
 textColor: 'text-orange-600',
 },
 {
 title: 'Agotados',
 value: stats.outOfStockProducts.toLocaleString('es-CL'),
 icon: <XCircle className="w-6 h-6" />,
 color: 'bg-red-500',
 textColor: 'text-red-600',
 },
 ]
 : [];

 return (
 <div className="max-w-7xl mx-auto">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-slate-900">Panel de Administracion</h1>
 <p className="text-slate-500 mt-2">Bienvenido, {user.name || user.email}</p>
 </div>

 {/* Statistics */}
 <div className="mb-8">
 <h2 className="text-xl font-semibold text-slate-900 mb-4">Resumen</h2>
 {isLoading ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="card p-4 animate-pulse">
 <div className="h-10 w-10 bg-slate-200 rounded-lg mb-3" />
 <div className="h-4 bg-slate-200 rounded w-20 mb-2" />
 <div className="h-6 bg-slate-200 rounded w-16" />
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
 <p className="text-sm text-slate-500">{stat.title}</p>
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
 <h3 className="text-lg font-semibold text-slate-900 mb-4">Ventas Ultimos 7 Dias</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={salesData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
 <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
 <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
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
 <h3 className="text-lg font-semibold text-slate-900 mb-4">Ordenes por Estado</h3>
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
 <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Productos</h3>
 <div className="h-64">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={topProducts} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
 <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
 <YAxis dataKey="name" type="category" width={150} stroke="#9CA3AF" fontSize={11} />
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
 <h3 className="text-lg font-semibold">Stock Critico</h3>
 </div>
 <Link
 href="/admin/productos?stock=low"
 className="text-white/80 hover:text-white text-sm flex items-center gap-1"
 >
 Ver todos <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 <div className="divide-y divide-slate-100">
 {lowStockProducts.length > 0 ? (
 lowStockProducts.map((product) => (
 <div key={product.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50">
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
 </div>
 <div className="flex items-center gap-3">
 <span
 className={`px-2.5 py-1 rounded-full text-xs font-bold ${
 product.stock === 0
 ? 'bg-red-100 text-red-700'
 : 'bg-orange-100 text-orange-700'
 }`}
 >
 {product.stock === 0 ? 'AGOTADO' : `${product.stock} uds`}
 </span>
 <Link
 href={`/admin/productos?search=${encodeURIComponent(product.name)}`}
 className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 >
 <ExternalLink className="w-4 h-4" />
 </Link>
 </div>
 </div>
 ))
 ) : (
 <div className="px-6 py-8 text-center text-slate-500">
 <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
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
 <h3 className="text-lg font-semibold">Ordenes Recientes</h3>
 </div>
 <Link
 href="/admin/ordenes"
 className="text-white/80 hover:text-white text-sm flex items-center gap-1"
 >
 Ver todas <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </div>
 <div className="divide-y divide-slate-100">
 {recentOrders.length > 0 ? (
 recentOrders.map((order) => {
 const statusColors: Record<string, string> = {
 pending: 'bg-yellow-100 text-yellow-800',
 paid: 'bg-green-100 text-green-800',
 processing: 'bg-blue-100 text-blue-800',
 shipped: 'bg-purple-100 text-purple-800',
 delivered: 'bg-green-100 text-green-800',
 cancelled: 'bg-red-100 text-red-800',
 };
 const statusLabels: Record<string, string> = {
 pending: 'Pendiente',
 paid: 'Pagado',
 processing: 'Procesando',
 shipped: 'Enviado',
 delivered: 'Entregado',
 cancelled: 'Cancelado',
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
 className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
 >
 <div className="flex-1 min-w-0">
 <p className="text-sm font-mono text-slate-600">#{order.id.slice(0, 8)}</p>
 <p className="text-xs text-slate-400">{date}</p>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-sm font-semibold text-slate-900">
 {formatPrice(order.total)}
 </span>
 <span
 className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-slate-100 text-slate-800'}`}
 >
 {statusLabels[order.status] || order.status}
 </span>
 </div>
 </Link>
 );
 })
 ) : (
 <div className="px-6 py-8 text-center text-slate-500">
 <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
 <p>No hay ordenes recientes</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
