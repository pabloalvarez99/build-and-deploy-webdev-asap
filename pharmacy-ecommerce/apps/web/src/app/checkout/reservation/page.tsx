'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, Store, Copy, Check, MapPin, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useState, Suspense } from 'react';

function ReservationContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const orderId = searchParams.get('order_id');
  const pickupCode = searchParams.get('code');
  const expiresAt = searchParams.get('expires');
  const total = searchParams.get('total');

  const expiresDate = expiresAt ? new Date(expiresAt) : null;

  const copyCode = async () => {
    if (pickupCode) {
      await navigator.clipboard.writeText(pickupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpirationDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (!orderId || !pickupCode) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Reserva no encontrada</h1>
        <p className="text-gray-600 mb-6">No pudimos encontrar los detalles de tu reserva</p>
        <Link href="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reserva confirmada
        </h1>
        <p className="text-gray-600">
          Hemos reservado tus productos. Presenta el codigo de retiro en tienda.
        </p>
      </div>

      {/* Pickup Code Card */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
        <div className="text-center">
          <p className="text-sm font-medium text-emerald-700 mb-2">
            Codigo de retiro
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl font-mono font-bold text-emerald-800 tracking-widest">
              {pickupCode}
            </span>
            <button
              onClick={copyCode}
              className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 transition-colors"
              title="Copiar codigo"
            >
              {copied ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <Copy className="w-5 h-5 text-emerald-600" />
              )}
            </button>
          </div>
          <p className="text-sm text-emerald-700">
            Muestra este codigo al personal de la farmacia
          </p>
        </div>
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Detalles de la reserva
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Store className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Numero de orden</p>
              <p className="text-sm text-gray-600 font-mono">{orderId}</p>
            </div>
          </div>

          {total && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Store className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Total a pagar</p>
                <p className="text-lg font-semibold text-emerald-600">{formatPrice(total)}</p>
              </div>
            </div>
          )}

          {expiresDate && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Valido hasta</p>
                <p className="text-sm text-gray-600 capitalize">
                  {formatExpirationDate(expiresDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Store Info */}
      <div className="card p-6 mb-6 bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">
          Informacion de la tienda
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">
              Av. Principal 123, Santiago Centro
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">
              +56 2 1234 5678
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-800">
              Lunes a Viernes: 9:00 - 20:00<br />
              Sabado: 10:00 - 14:00
            </p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="card p-6 mb-8 bg-amber-50 border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">
          Importante
        </h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>Presenta tu codigo de retiro y documento de identidad</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>La reserva expira en 48 horas si no es retirada</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600">•</span>
            <span>Recibiras un email de confirmacion con estos detalles</span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="btn btn-primary text-center"
        >
          Seguir comprando
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary text-center"
        >
          Imprimir comprobante
        </button>
      </div>
    </div>
  );
}

export default function ReservationPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    }>
      <ReservationContent />
    </Suspense>
  );
}
