import { createClient } from '@/lib/supabase/client';

// ============================================
// Supabase client (for browser-side reads)
// ============================================
function getSupabase() {
  return createClient();
}

// Helper for Next.js API route calls
async function apiRequest<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const { method = 'POST', body } = options;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ============================================
// Product API (reads via Supabase, writes via API routes)
// ============================================
export const productApi = {
  list: async (params?: {
    category?: string;
    laboratory?: string;
    therapeutic_action?: string;
    prescription_type?: string;
    active_ingredient?: string;
    search?: string;
    page?: number;
    limit?: number;
    active_only?: boolean;
    sort_by?: string;
    in_stock?: boolean;
    min_price?: number;
    max_price?: number;
  }): Promise<PaginatedProducts> => {
    const supabase = getSupabase();
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 12, 100);
    const offset = (page - 1) * limit;
    const activeOnly = params?.active_only !== false;

    let query = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' });

    if (activeOnly) query = query.eq('active', true);
    if (params?.category) {
      // Lookup category ID from slug, then filter directly by category_id
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', params.category)
        .single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      }
    }
    if (params?.laboratory) query = query.eq('laboratory', params.laboratory);
    if (params?.therapeutic_action) query = query.eq('therapeutic_action', params.therapeutic_action);
    if (params?.prescription_type) query = query.eq('prescription_type', params.prescription_type);
    if (params?.active_ingredient) query = query.ilike('active_ingredient', `%${params.active_ingredient}%`);
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,laboratory.ilike.%${params.search}%`);
    }
    if (params?.in_stock) query = query.gt('stock', 0);
    if (params?.min_price) query = query.gte('price', params.min_price);
    if (params?.max_price) query = query.lte('price', params.max_price);

    // Sorting
    const sortBy = params?.sort_by || 'created_at';
    switch (sortBy) {
      case 'name':
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'stock':
      case 'stock_desc':
        query = query.order('stock', { ascending: false });
        break;
      case 'stock_asc':
        query = query.order('stock', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const products = (data || []).map(transformProduct);
    const total = count || 0;
    return {
      products,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  },

  getLaboratories: async (): Promise<{ laboratories: string[] }> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_distinct_laboratories');
    if (error) return { laboratories: [] };
    return { laboratories: (data || []).map((r: { laboratory: string }) => r.laboratory) };
  },

  getTherapeuticActions: async (): Promise<{ therapeutic_actions: string[] }> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_distinct_therapeutic_actions');
    if (error) return { therapeutic_actions: [] };
    return { therapeutic_actions: (data || []).map((r: { therapeutic_action: string }) => r.therapeutic_action) };
  },

  getActiveIngredients: async (): Promise<{ active_ingredients: string[] }> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('get_distinct_active_ingredients');
    if (error) return { active_ingredients: [] };
    return { active_ingredients: (data || []).map((r: { active_ingredient: string }) => r.active_ingredient) };
  },

  get: async (slug: string): Promise<ProductWithCategory> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();
    if (error) throw new Error(error.message);
    return transformProduct(data);
  },

  getById: async (id: string): Promise<ProductWithCategory> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return transformProduct(data);
  },

  // Admin operations via API routes
  create: (data: CreateProductData) =>
    apiRequest<Product>('/api/admin/products', { body: data }),

  update: (id: string, data: Partial<CreateProductData>) =>
    apiRequest<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  bulkImport: (data: { newProducts: unknown[]; updateProducts: unknown[] }) =>
    apiRequest<{ success: boolean; inserted: number; updated: number; errors?: string[] }>(
      '/api/admin/products/import', { body: data }
    ),

  listCategories: async (): Promise<Category[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return data || [];
  },

  createCategory: (data: { name: string; slug: string; description?: string }) =>
    apiRequest<Category>('/api/admin/categories', { body: data }),

  updateCategory: (id: string, data: { name?: string; slug?: string; description?: string; active?: boolean }) =>
    apiRequest<Category>(`/api/admin/categories/${id}`, { method: 'PUT', body: data }),

  deleteCategory: (id: string) =>
    apiRequest<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  getCategoryProductCount: async (categoryId: string): Promise<{ count: number }> => {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (error) return { count: 0 };
    return { count: count || 0 };
  },
};

// ============================================
// Order API (reads via Supabase, writes via API routes)
// ============================================
export const orderApi = {
  checkout: (data: { shipping_address?: string; notes?: string }) =>
    apiRequest<CheckoutResponse>('/api/checkout', { body: data }),

  guestCheckout: (data: {
    items: { product_id: string; quantity: number }[];
    name: string;
    surname: string;
    email: string;
    shipping_address?: string;
    notes?: string;
    session_id: string;
  }) => apiRequest<CheckoutResponse>('/api/guest-checkout', { body: data }),

  storePickup: (data: {
    items: { product_id: string; quantity: number }[];
    name: string;
    surname: string;
    email: string;
    phone: string;
    notes?: string;
    session_id: string;
  }) => apiRequest<StorePickupResponse>('/api/store-pickup', { body: data }),

  list: async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedOrders> => {
    const supabase = getSupabase();
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (params?.status) query = query.eq('status', params.status);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const total = count || 0;
    return {
      orders: data || [],
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  },

  get: async (id: string): Promise<OrderWithItems> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return {
      ...data,
      items: data.order_items || [],
    };
  },

  // Admin operations
  listAll: async (params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedOrders> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.status) searchParams.set('status', params.status);
    const qs = searchParams.toString();
    return apiRequest<PaginatedOrders>(`/api/admin/orders${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  updateStatus: (id: string, status: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { status } }),

  approveReservation: (id: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { action: 'approve_reservation' } }),

  rejectReservation: (id: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { action: 'reject_reservation' } }),
};

// ============================================
// Transform Supabase response to match existing types
// ============================================
function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null;
  // Ensure https to avoid mixed content warnings
  if (url.startsWith('http://')) return 'https://' + url.slice(7);
  return url;
}

function transformProduct(raw: any): ProductWithCategory {
  const categories = raw.categories;
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: String(raw.price),
    stock: raw.stock,
    category_id: raw.category_id,
    image_url: sanitizeImageUrl(raw.image_url),
    active: raw.active,
    external_id: raw.external_id,
    laboratory: raw.laboratory,
    therapeutic_action: raw.therapeutic_action,
    active_ingredient: raw.active_ingredient,
    prescription_type: raw.prescription_type,
    presentation: raw.presentation,
    discount_percent: raw.discount_percent ?? null,
    created_at: raw.created_at,
    category_name: categories?.name || null,
    category_slug: categories?.slug || null,
  };
}

// ============================================
// Types (unchanged - same interface for the frontend)
// ============================================
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
  therapeutic_action: string | null;
  active_ingredient: string | null;
  prescription_type: 'direct' | 'prescription' | 'retained' | null;
  presentation: string | null;
  discount_percent: number | null;
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
  therapeutic_action?: string;
  active_ingredient?: string;
  prescription_type?: 'direct' | 'prescription' | 'retained';
  presentation?: string;
  active?: boolean;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  price: string;
  original_price?: string;
  discount_percent?: number;
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

export interface StorePickupResponse {
  order_id: string;
  pickup_code: string;
  expires_at: string;
  total: string;
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
  payment_provider: string | null;
  pickup_code: string | null;
  reservation_expires_at: string | null;
  customer_phone: string | null;
  guest_name: string | null;
  guest_surname: string | null;
  guest_email: string | null;
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
  guest_session_id?: string | null;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
