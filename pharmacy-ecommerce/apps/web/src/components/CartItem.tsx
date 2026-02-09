'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CartItem as CartItemType } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCartStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0 || isUpdating) return;

    setIsUpdating(true);
    try {
      if (newQuantity === 0) {
        await removeFromCart(item.product_id);
      } else {
        await updateQuantity(item.product_id, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await removeFromCart(item.product_id);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100">
      <div className="w-20 h-20 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {item.product_image ? (
          <Image
            src={item.product_image}
            alt={item.product_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          href={`/producto/${item.product_slug}`}
          className="font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
        >
          {item.product_name}
        </Link>
        <p className="text-sm text-gray-500">{formatPrice(item.price)} c/u</p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleUpdateQuantity(item.quantity - 1)}
          disabled={isUpdating}
          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => handleUpdateQuantity(item.quantity + 1)}
          disabled={isUpdating}
          className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-right w-28">
        <p className="font-semibold text-gray-900">{formatPrice(item.subtotal)}</p>
      </div>

      <button
        onClick={handleRemove}
        disabled={isUpdating}
        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
