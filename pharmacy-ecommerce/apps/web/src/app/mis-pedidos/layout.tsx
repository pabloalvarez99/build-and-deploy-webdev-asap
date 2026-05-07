import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Pedidos',
  robots: { index: false, follow: false },
};

export default function MisPedidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
