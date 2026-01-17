// API Gateway URLs - rewrites handled by next.config.js
const AUTH_URL = '/backend/auth';
const PRODUCT_URL = '/backend/products';
const ORDER_URL = '/backend/orders';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    request<{ token: string; user: User }>(`${AUTH_URL}/auth/register`, {
      method: 'POST',
      body: data,
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>(`${AUTH_URL}/auth/login`, {
      method: 'POST',
      body: data,
    }),

  me: (token: string) =>
    request<User>(`${AUTH_URL}/auth/me`, { token }),
};

// Product API
export const productApi = {
  list: (params?: {
    category?: string;
    laboratory?: string;
    search?: string;
    page?: number;
    limit?: number;
    active_only?: boolean;
    sort_by?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.laboratory) searchParams.set('laboratory', params.laboratory);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.active_only !== undefined) searchParams.set('active_only', String(params.active_only));
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);

    const query = searchParams.toString();
    return request<PaginatedProducts>(`${PRODUCT_URL}/products${query ? `?${query}` : ''}`);
  },

  get: (slug: string) =>
    request<ProductWithCategory>(`${PRODUCT_URL}/products/${slug}`),

  getById: (id: string) =>
    request<ProductWithCategory>(`${PRODUCT_URL}/products/id/${id}`),

  create: (token: string, data: CreateProductData) =>
    request<Product>(`${PRODUCT_URL}/admin/products`, {
      method: 'POST',
      body: data,
      token,
    }),

  update: (token: string, id: string, data: Partial<CreateProductData>) =>
    request<Product>(`${PRODUCT_URL}/admin/products/${id}`, {
      method: 'PUT',
      body: data,
      token,
    }),

  delete: (token: string, id: string) =>
    request<void>(`${PRODUCT_URL}/admin/products/${id}`, {
      method: 'DELETE',
      token,
    }),

  listCategories: () =>
    request<Category[]>(`${PRODUCT_URL}/categories`),

  createCategory: (token: string, data: { name: string; slug: string; description?: string }) =>
    request<Category>(`${PRODUCT_URL}/admin/categories`, {
      method: 'POST',
      body: data,
      token,
    }),
};

// Cart API
export const cartApi = {
  get: (token: string) =>
    request<CartResponse>(`${ORDER_URL}/cart`, { token }),

  add: (token: string, productId: string, quantity?: number) =>
    request<CartResponse>(`${ORDER_URL}/cart/add`, {
      method: 'POST',
      body: { product_id: productId, quantity },
      token,
    }),

  update: (token: string, productId: string, quantity: number) =>
    request<CartResponse>(`${ORDER_URL}/cart/update`, {
      method: 'PUT',
      body: { product_id: productId, quantity },
      token,
    }),

  remove: (token: string, productId: string) =>
    request<CartResponse>(`${ORDER_URL}/cart/remove/${productId}`, {
      method: 'DELETE',
      token,
    }),

  clear: (token: string) =>
    request<void>(`${ORDER_URL}/cart/clear`, {
      method: 'DELETE',
      token,
    }),
};

// Order API
export const orderApi = {
  checkout: (token: string, data: { shipping_address?: string; notes?: string }) =>
    request<CheckoutResponse>(`${ORDER_URL}/checkout`, {
      method: 'POST',
      body: data,
      token,
    }),

  guestCheckout: (data: {
    items: { product_id: string; quantity: number }[];
    name: string;
    surname: string;
    email: string;
    shipping_address?: string;
    notes?: string;
    session_id: string;
  }) =>
    request<CheckoutResponse>(`${ORDER_URL}/guest-checkout`, {
      method: 'POST',
      body: data,
    }),

  list: (token: string, params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return request<PaginatedOrders>(`${ORDER_URL}/orders${query ? `?${query}` : ''}`, { token });
  },

  get: (token: string, id: string) =>
    request<OrderWithItems>(`${ORDER_URL}/orders/${id}`, { token }),

  updateStatus: (token: string, id: string, status: string) =>
    request<Order>(`${ORDER_URL}/orders/${id}/status`, {
      method: 'PUT',
      body: { status },
      token,
    }),
};

// Types
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
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
  external_id: string | null;
  laboratory: string | null;
  created_at: string;
}

export interface ProductWithCategory extends Product {
  category_name: string | null;
  category_slug: string | null;
}

export interface PaginatedProducts {
  products: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  price: string;
  stock: number;
  category_id?: string;
  image_url?: string;
  laboratory?: string;
  active?: boolean;
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

export interface CartResponse {
  items: CartItem[];
  total: string;
  item_count: number;
}

export interface CheckoutResponse {
  order_id: string;
  init_point: string;
  preference_id: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total: string;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  guest_name?: string | null;
  guest_surname?: string | null;
  guest_email?: string | null;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
