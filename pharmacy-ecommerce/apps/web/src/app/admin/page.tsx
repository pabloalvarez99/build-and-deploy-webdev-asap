'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [token, user, router]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const cards = [
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
      icon: <TrendingUp className="w-8 h-8" />,
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card p-6 hover:shadow-lg transition-shadow group"
          >
            <div className={`w-14 h-14 ${card.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
            <p className="text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
