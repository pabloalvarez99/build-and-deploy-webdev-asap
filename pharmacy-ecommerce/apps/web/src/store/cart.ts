import { create } from 'zustand';
import { CartResponse, productApi } from '@/lib/api';
import { discountedPrice } from '@/lib/format';

interface LocalCartItem {
  product_id: string;
  quantity: number;
}

interface CartState {
  cart: CartResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => void;
  getSessionId: () => string;
  resetCart: () => void;
}

const CART_KEY = 'tu_farmacia_cart';
const SESSION_KEY = 'tu_farmacia_session';

function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalCart(items: LocalCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  getSessionId: () => getOrCreateSessionId(),

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const localItems = getLocalCart();
      if (localItems.length === 0) {
        set({ cart: { items: [], total: '0', item_count: 0 }, isLoading: false });
        return;
      }

      // Batch fetch all products in a single query instead of N individual calls
      const products = await productApi.getByIds(localItems.map(i => i.product_id));
      const productMap = new Map(products.map(p => [p.id, p]));

      const validItems: CartResponse['items'] = [];
      for (const item of localItems) {
        const product = productMap.get(item.product_id);
        if (!product) continue;
        const rawPrice = parseFloat(product.price);
        const disc = product.discount_percent;
        const effectivePrice = disc ? discountedPrice(rawPrice, disc) : rawPrice;
        validItems.push({
          product_id: item.product_id,
          product_name: product.name,
          product_slug: product.slug,
          product_image: product.image_url,
          price: effectivePrice.toString(),
          ...(disc ? { original_price: product.price, discount_percent: disc } : {}),
          quantity: item.quantity,
          subtotal: (effectivePrice * item.quantity).toString(),
        });
      }

      const total = validItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

      set({
        cart: {
          items: validItems,
          total: total.toString(),
          item_count: validItems.reduce((sum, item) => sum + item.quantity, 0),
        },
        isLoading: false,
      });
    } catch {
      set({ error: 'Error al cargar el carrito', isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity = 1) => {
    const localItems = getLocalCart();
    const existingIndex = localItems.findIndex((item) => item.product_id === productId);

    if (existingIndex >= 0) {
      localItems[existingIndex].quantity += quantity;
    } else {
      localItems.push({ product_id: productId, quantity });
    }

    saveLocalCart(localItems);
    await get().fetchCart();
  },

  updateQuantity: async (productId: string, quantity: number) => {
    const localItems = getLocalCart();
    const index = localItems.findIndex((item) => item.product_id === productId);

    if (index >= 0) {
      if (quantity <= 0) {
        localItems.splice(index, 1);
      } else {
        localItems[index].quantity = quantity;
      }
      saveLocalCart(localItems);
    }

    await get().fetchCart();
  },

  removeFromCart: async (productId: string) => {
    const localItems = getLocalCart().filter((item) => item.product_id !== productId);
    saveLocalCart(localItems);
    await get().fetchCart();
  },

  clearCart: () => {
    saveLocalCart([]);
    set({ cart: { items: [], total: '0', item_count: 0 } });
  },

  resetCart: () => {
    set({ cart: null, isLoading: false, error: null });
  },
}));
