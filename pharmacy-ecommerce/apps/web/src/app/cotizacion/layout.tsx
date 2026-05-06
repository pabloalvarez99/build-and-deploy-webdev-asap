import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cotización de medicamentos',
  description: 'Solicita una cotización gratuita de medicamentos en Tu Farmacia. Atendemos pedidos institucionales y particulares en Coquimbo y todo Chile.',
  alternates: { canonical: '/cotizacion' },
  openGraph: {
    title: 'Cotización de medicamentos | Tu Farmacia',
    description: 'Solicita una cotización gratuita de medicamentos en Tu Farmacia.',
    url: '/cotizacion',
    type: 'website',
  },
};

export default function CotizacionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
