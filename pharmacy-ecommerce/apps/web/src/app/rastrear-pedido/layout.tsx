import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rastrear pedido',
  description: 'Consulta el estado de tu pedido en Tu Farmacia.',
  robots: { index: false, follow: true },
};

export default function RastrearLayout({ children }: { children: React.ReactNode }) {
  return children;
}
