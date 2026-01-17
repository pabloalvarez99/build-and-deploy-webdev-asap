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
  TrendingUp,
  AlertTriangle,
  XCircle,
  DollarSign,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Stats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  inventoryValue: number;
  pendingOrders: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  slug: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [token, user, router]);

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadStats();
      loadRecentOrders();
    }
  }, [token, user]);

  const loadRecentOrders = async () => {
    try {
      const orders = await orderApi.list(token!, { limit: 5 });
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

      // Load orders
      const pendingOrders = await orderApi.list(token!, { status: 'pending', limit: 1 });

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

      setStats({
        totalProducts: allProducts.total,
        activeProducts: activeProducts.total,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        totalCategories: categories.length,
        inventoryValue,
        pendingOrders: pendingOrders.total,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
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
          title: 'Valor Inventario',
          value: formatPrice(stats.inventoryValue),
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

  const navigationCards = [
    {
      title: 'Productos',
      description: 'Gestionar catalogo de productos',
      icon: <Package className="w-8 h-8" />,
      href: '/admin/productos',
      color: 'bg-blue-500',
    },
    {
      title: 'Ordenes',
      description: 'Ver y gestionar pedidos',
      icon: <ShoppingBag className="w-8 h-8" />,
      href: '/admin/ordenes',
      color: 'bg-green-500',
    },
    {
      title: 'Categorias',
      description: 'Administrar categorias',
      icon: <Tags className="w-8 h-8" />,
      href: '/admin/categorias',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administracion</h1>
        <p className="text-gray-500 mt-2">Bienvenido, {user.name || user.email}</p>
      </div>

      {/* Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((stat) => (
              <div key={stat.title} className="card p-4">
                <div
                  className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white mb-3`}
                >
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rapidas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div
                className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
              >
                {card.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

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
          <div className="divide-y divide-gray-100">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map((product) => (
                <div key={product.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      product.stock === 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {product.stock === 0 ? 'AGOTADO' : `${product.stock} uds`}
                    </span>
                    <Link 
                      href={`/admin/productos?search=${encodeURIComponent(product.name)}`}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
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
          <div className="divide-y divide-gray-100">
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
                    className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-gray-600">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(order.total)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No hay ordenes recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
