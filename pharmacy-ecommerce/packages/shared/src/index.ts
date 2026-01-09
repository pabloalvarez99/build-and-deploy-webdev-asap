// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: string;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}
