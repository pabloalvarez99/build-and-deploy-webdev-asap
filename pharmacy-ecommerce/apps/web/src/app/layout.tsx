import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tu Farmacia - Farmacia online en Chile',
  description: 'Tu Farmacia: medicamentos, productos de salud y belleza con despacho a todo Chile',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <WhatsAppButton />
        <footer className="bg-white border-t-2 border-slate-100 py-10 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3">
              <p className="font-bold text-slate-800 text-lg">Tu Farmacia</p>
              <p className="text-slate-500">
                Coquimbo, Chile
              </p>
              <p className="text-slate-500 text-base">
                &copy; {new Date().getFullYear()} Tu Farmacia. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
