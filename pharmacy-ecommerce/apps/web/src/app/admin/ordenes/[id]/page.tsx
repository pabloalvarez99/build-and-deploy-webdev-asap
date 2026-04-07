'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { orderApi, OrderWithItems } from '@/lib/api';
import { ArrowLeft, Package, MapPin, FileText, User, Mail, Printer, Check, Clock, Truck, CheckCircle, XCircle, Store, Phone, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/format';

const statusOptions = [
 { value: 'pending',    label: 'Pendiente',  color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
 { value: 'reserved',   label: 'Reservado',  color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' },
 { value: 'paid',       label: 'Pagado',     color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
 { value: 'processing', label: 'Procesando', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
 { value: 'shipped',    label: 'Enviado',    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' },
 { value: 'delivered',  label: 'Entregado',  color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
 { value: 'cancelled',  label: 'Cancelado',  color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
];

// Flujo para despacho a domicilio
const deliveryFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
// Flujo para retiro en tienda (sin "Enviado")
const pickupFlow = ['reserved', 'processing', 'delivered'];
// Flujo para Webpay (pago online, sin "pending" ni "shipped")
const webpayFlow = ['paid', 'processing', 'delivered'];

const pickupLabels: Record<string, string> = {
 reserved: 'Reservado',
 processing: 'Preparando',
 delivered: 'Retirado',
};

const webpayLabels: Record<string, string> = {
 paid: 'Pagado',
 processing: 'Preparando',
 delivered: 'Entregado',
};

const statusIcons: Record<string, React.ReactNode> = {
 pending: <Clock className="w-5 h-5" />,
 reserved: <Store className="w-5 h-5" />,
 paid: <Check className="w-5 h-5" />,
 processing: <Package className="w-5 h-5" />,
 shipped: <Truck className="w-5 h-5" />,
 delivered: <CheckCircle className="w-5 h-5" />,
 cancelled: <XCircle className="w-5 h-5" />,
};

function OrderTimeline({ currentStatus, isPickup, isWebpay }: { currentStatus: string; isPickup: boolean; isWebpay: boolean }) {
 const isCancelled = currentStatus === 'cancelled';
 const flow = isPickup ? pickupFlow : isWebpay ? webpayFlow : deliveryFlow;
 const currentIndex = flow.indexOf(currentStatus);

 const getLabel = (status: string) => {
  if (isPickup) return pickupLabels[status] ?? statusOptions.find((s) => s.value === status)?.label;
  if (isWebpay) return webpayLabels[status] ?? statusOptions.find((s) => s.value === status)?.label;
  return statusOptions.find((s) => s.value === status)?.label;
 };

 return (
 <div className="card p-6 mb-6">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Estado del Pedido</h2>

 {isCancelled ? (
 <div className="flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
 <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
 <span className="text-lg font-medium text-red-700 dark:text-red-300">Orden Cancelada</span>
 </div>
 ) : (
 <div className="relative">
 {/* Progress bar */}
 <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded">
 <div
 className="absolute h-full bg-emerald-500 rounded transition-all duration-500"
 style={{ width: `${(currentIndex / (flow.length - 1)) * 100}%` }}
 />
 </div>

 {/* Status points */}
 <div className="relative flex justify-between">
 {flow.map((status, index) => {
 const isCompleted = index <= currentIndex;
 const isCurrent = index === currentIndex;
 const label = getLabel(status);

 return (
 <div key={status} className="flex flex-col items-center">
 <div
 className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
 isCompleted
 ? 'bg-emerald-500 text-white'
 : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
 } ${isCurrent ? 'ring-4 ring-emerald-200 dark:ring-emerald-800' : ''}`}
 >
 {statusIcons[status]}
 </div>
 <span
 className={`mt-2 text-xs font-medium ${
 isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
 }`}
 >
 {label}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );
}

export default function AdminOrderDetailPage() {
 const params = useParams();
 const router = useRouter();
 const orderId = params.id as string;

 const { user } = useAuthStore();

 const [order, setOrder] = useState<OrderWithItems | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isProcessing, setIsProcessing] = useState(false);

 useEffect(() => {
 if (!user || user.role !== 'admin') {
 router.push('/');
 return;
 }
 loadOrder();
 }, [user, router, orderId]);

 const loadOrder = async () => {
 try {
 const data = await orderApi.get(orderId);
 setOrder(data);
 } catch (error) {
 console.error('Error loading order:', error);
 } finally {
 setIsLoading(false);
 }
 };

 const handleStatusChange = async (newStatus: string) => {
 if (!order) return;

 try {
 await orderApi.updateStatus(order.id, newStatus);
 loadOrder();
 } catch (error) {
 console.error('Error updating status:', error);
 alert('Error al actualizar el estado');
 }
 };

 const handleApproveReservation = async () => {
 if (!order) return;
 if (!confirm('¿Aprobar esta reserva? El stock de los productos se reducirá.')) return;
 setIsProcessing(true);
 try {
 await orderApi.approveReservation(order.id);
 loadOrder();
 } catch (error) {
 console.error('Error approving reservation:', error);
 alert(error instanceof Error ? error.message : 'Error al aprobar la reserva');
 } finally {
 setIsProcessing(false);
 }
 };

 const handleRejectReservation = async () => {
 if (!order) return;
 if (!confirm('¿Rechazar esta reserva? La orden será cancelada.')) return;
 setIsProcessing(true);
 try {
 await orderApi.rejectReservation(order.id);
 loadOrder();
 } catch (error) {
 console.error('Error rejecting reservation:', error);
 alert(error instanceof Error ? error.message : 'Error al rechazar la reserva');
 } finally {
 setIsProcessing(false);
 }
 };

 if (!user || user.role !== 'admin') {
 return null;
 }

 if (isLoading) {
 return (
 <div className="max-w-4xl mx-auto">
 <div className="animate-pulse space-y-6">
 <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32" />
 <div className="card p-6 space-y-4">
 <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
 <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
 <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
 </div>
 </div>
 </div>
 );
 }

 if (!order) {
 return (
 <div className="max-w-4xl mx-auto text-center py-12">
 <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Orden no encontrada</h1>
 <Link href="/admin/ordenes" className="btn btn-primary">
 Volver a órdenes
 </Link>
 </div>
 );
 }

 const isPickup = order.payment_provider === 'store';
 const isWebpay = order.payment_provider === 'webpay';
 const currentStatus = statusOptions.find((s) => s.value === order.status);
 const total = parseFloat(order.total);
 const date = new Date(order.created_at).toLocaleDateString('es-CL', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 });

 return (
 <div className="max-w-4xl mx-auto">
 <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
 Orden #{order.id.slice(0, 8)}
 </h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">{date}</p>
 </div>

 {order.status !== 'reserved' && (
 <select
 value={order.status}
 onChange={(e) => handleStatusChange(e.target.value)}
 className={`px-4 py-2 rounded-lg font-medium ${currentStatus?.color || 'bg-slate-100'}`}
 >
 {statusOptions.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 )}
 {order.status === 'reserved' && (
 <span className={`px-4 py-2 rounded-lg font-medium ${currentStatus?.color || 'bg-amber-100 text-amber-800'}`}>
 Reservado
 </span>
 )}
 </div>

 {/* Reservation Approval Section */}
 {order.status === 'reserved' && (
 <div className="card border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6 mb-6">
 <div className="flex items-center gap-3 mb-4">
 <Store className="w-6 h-6 text-amber-600 dark:text-amber-400" />
 <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">
 Reserva pendiente de aprobación
 </h2>
 </div>

 <div className="grid sm:grid-cols-2 gap-4 mb-6">
 {(order.guest_name || order.guest_surname) && (
 <div className="flex items-center gap-2">
 <User className="w-4 h-4 text-amber-600" />
 <span className="font-medium">{order.guest_name} {order.guest_surname}</span>
 </div>
 )}
 {order.customer_phone && (
 <div className="flex items-center gap-2">
 <Phone className="w-4 h-4 text-amber-600" />
 <span>{order.customer_phone}</span>
 </div>
 )}
 {order.guest_email && (
 <div className="flex items-center gap-2">
 <Mail className="w-4 h-4 text-amber-600" />
 <a href={`mailto:${order.guest_email}`} className="text-amber-800 dark:text-amber-300 hover:underline">{order.guest_email}</a>
 </div>
 )}
 {order.pickup_code && (
 <div className="flex items-center gap-2">
 <Store className="w-4 h-4 text-amber-600" />
 <span>Código retiro: <strong className="font-mono text-lg">{order.pickup_code}</strong></span>
 </div>
 )}
 {order.reservation_expires_at && (
 <div className="flex items-center gap-2">
 <Clock className="w-4 h-4 text-amber-600" />
 <span>Expira: {new Date(order.reservation_expires_at).toLocaleDateString('es-CL', {
 day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
 })}</span>
 </div>
 )}
 </div>

 <div className="flex flex-wrap gap-3">
 <button
 onClick={handleApproveReservation}
 disabled={isProcessing}
 className="flex items-center gap-2 px-6 py-3 min-h-[56px] rounded-xl text-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
 >
 <CheckCircle className="w-5 h-5" />
 {isProcessing ? 'Procesando...' : 'Aprobar Reserva'}
 </button>
 <button
 onClick={handleRejectReservation}
 disabled={isProcessing}
 className="flex items-center gap-2 px-6 py-3 min-h-[56px] rounded-xl text-lg font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
 >
 <XCircle className="w-5 h-5" />
 Rechazar
 </button>
 </div>
 </div>
 )}

 {/* Webpay paid — action card */}
 {isWebpay && order.status === 'paid' && (
 <div className="card border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 p-6 mb-6">
 <div className="flex items-center gap-3 mb-3">
 <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
 <h2 className="text-lg font-bold text-blue-900 dark:text-blue-200">Pago Webpay confirmado</h2>
 </div>
 <p className="text-blue-700 dark:text-blue-300 mb-4">
 El cliente pagó online. Prepara el pedido y márcalo en procesamiento cuando esté listo para entregar.
 </p>
 <button
 onClick={() => handleStatusChange('processing')}
 className="flex items-center gap-2 px-6 py-3 min-h-[56px] rounded-xl text-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
 >
 <Package className="w-5 h-5" />
 Marcar en preparación
 </button>
 </div>
 )}

 {/* Webpay processing — mark as delivered */}
 {isWebpay && order.status === 'processing' && (
 <div className="card border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-6 mb-6">
 <div className="flex items-center gap-3 mb-3">
 <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
 <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Pedido en preparación</h2>
 </div>
 <p className="text-emerald-700 dark:text-emerald-300 mb-4">
 Cuando el cliente retire su pedido, márcalo como entregado.
 </p>
 <button
 onClick={() => handleStatusChange('delivered')}
 className="flex items-center gap-2 px-6 py-3 min-h-[56px] rounded-xl text-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
 >
 <CheckCircle className="w-5 h-5" />
 Marcar como entregado
 </button>
 </div>
 )}

 {/* Status Timeline */}
 <OrderTimeline currentStatus={order.status} isPickup={isPickup} isWebpay={isWebpay} />

 <div className="grid lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 {/* Order Items */}
 <div className="card p-6">
 <div className="flex items-center gap-3 mb-4">
 <Package className="w-5 h-5 text-emerald-600" />
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Productos</h2>
 </div>
 <div className="space-y-3">
 {order.items.map((item) => {
 const price = parseFloat(item.price_at_purchase);
 const subtotal = price * item.quantity;

 return (
 <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
 <div className="flex-1">
 <p className="font-medium text-slate-900 dark:text-slate-100">{item.product_name}</p>
 <p className="text-sm text-slate-500 dark:text-slate-400">
 {formatPrice(price)} x {item.quantity}
 </p>
 </div>
 <p className="font-semibold text-slate-900 dark:text-slate-100">
 {formatPrice(subtotal)}
 </p>
 </div>
 );
 })}
 </div>
 </div>

 {/* Customer Info */}
 <div className="card p-6">
 <div className="flex items-center gap-3 mb-4">
 <User className="w-5 h-5 text-emerald-600" />
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cliente</h2>
 {!order.user_id && (order.guest_name || order.guest_email) && (
 <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
 Invitado
 </span>
 )}
 </div>
 <div className="space-y-3">
 {(order.guest_name || order.guest_surname) && (
 <div className="flex items-center gap-3">
 <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
 <span className="text-slate-900 dark:text-slate-100 font-medium">
 {order.guest_name} {order.guest_surname}
 </span>
 </div>
 )}
 {order.guest_email && (
 <div className="flex items-center gap-3">
 <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
 <a href={`mailto:${order.guest_email}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
 {order.guest_email}
 </a>
 </div>
 )}
 {order.user_id && (
 <p className="text-slate-500 dark:text-slate-400 text-sm">
 ID Usuario: <span className="font-mono">{order.user_id.slice(0, 8)}...</span>
 </p>
 )}
 {!order.user_id && !order.guest_name && !order.guest_email && (
 <p className="text-slate-500 dark:text-slate-400 italic">Sin información de cliente</p>
 )}
 </div>
 </div>

 {/* Shipping Address */}
 {order.shipping_address && (
 <div className="card p-6">
 <div className="flex items-center gap-3 mb-4">
 <MapPin className="w-5 h-5 text-emerald-600" />
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
 Dirección de envío
 </h2>
 </div>
 <p className="text-slate-600 dark:text-slate-300">{order.shipping_address}</p>
 </div>
 )}

 {/* Notes */}
 {order.notes && (
 <div className="card p-6">
 <div className="flex items-center gap-3 mb-4">
 <FileText className="w-5 h-5 text-emerald-600" />
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notas</h2>
 </div>
 <p className="text-slate-600 dark:text-slate-300">{order.notes}</p>
 </div>
 )}
 </div>

 {/* Summary */}
 <div className="lg:col-span-1">
 <div className="card p-4 sm:p-6 sticky top-20 lg:top-24">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resumen</h2>
 <button
 onClick={() => window.print()}
 className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
 title="Imprimir orden"
 >
 <Printer className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
 <div className="flex justify-between text-slate-600 dark:text-slate-300">
 <span>Subtotal ({order.items.length} productos)</span>
 <span>{formatPrice(total)}</span>
 </div>
 <div className="flex justify-between text-slate-600 dark:text-slate-300">
 <span>{isPickup ? 'Retiro en tienda' : isWebpay ? 'Pago Webpay' : 'Envío'}</span>
 <span className="text-green-600 dark:text-green-400">Gratis</span>
 </div>
 </div>

 <div className="flex justify-between text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
 <span>Total</span>
 <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
 </div>

 {/* Quick Actions */}
 <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-3">Acciones rápidas</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {statusOptions
  .filter((opt) => {
    if (isPickup && opt.value === 'shipped') return false;
    if (isWebpay && ['shipped', 'pending', 'reserved'].includes(opt.value)) return false;
    return true;
   })
  .map((opt) => {
   const displayLabel = isPickup && opt.value === 'delivered' ? 'Retirado' :
    isPickup && opt.value === 'processing' ? 'Preparando' : opt.label;
   return (
 <button
 key={opt.value}
 onClick={() => handleStatusChange(opt.value)}
 disabled={order.status === opt.value}
 className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] ${
 order.status === opt.value
 ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
 : `${opt.color} hover:opacity-80`
 }`}
 >
 {displayLabel}
 </button>
   );
  })}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
