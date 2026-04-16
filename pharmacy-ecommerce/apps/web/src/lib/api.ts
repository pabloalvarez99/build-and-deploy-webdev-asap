/**
 * lib/api.ts — Client-side API layer
 *
 * All database reads now go through Next.js API routes (Prisma is server-only).
 * Admin writes continue through their dedicated /api/admin/* routes.
 */

// ============================================
// Internal fetch helper
// ============================================
async function apiRequest<T>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = 'POST', body } = options
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) return {} as T
  return response.json()
}

// ============================================
// Product API (reads via /api/products, writes via /api/admin/products)
// ============================================
export const productApi = {
  list: async (params?: {
    category?: string
    laboratory?: string
    therapeutic_action?: string
    prescription_type?: string
    active_ingredient?: string
    search?: string
    page?: number
    limit?: number
    active_only?: boolean
    sort_by?: string
    in_stock?: boolean
    min_price?: number
    max_price?: number
    no_image?: boolean
    has_discount?: boolean
    stock_filter?: 'low' | 'out' | ''
  }): Promise<PaginatedProducts> => {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.laboratory) qs.set('laboratory', params.laboratory)
    if (params?.therapeutic_action) qs.set('therapeutic_action', params.therapeutic_action)
    if (params?.prescription_type) qs.set('prescription_type', params.prescription_type)
    if (params?.active_ingredient) qs.set('active_ingredient', params.active_ingredient)
    if (params?.search) qs.set('search', params.search)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.active_only !== undefined) qs.set('active_only', String(params.active_only))
    if (params?.sort_by) qs.set('sort_by', params.sort_by)
    if (params?.in_stock) qs.set('in_stock', 'true')
    if (params?.min_price) qs.set('min_price', String(params.min_price))
    if (params?.max_price) qs.set('max_price', String(params.max_price))
    if (params?.no_image) qs.set('no_image', 'true')
    if (params?.has_discount) qs.set('has_discount', 'true')
    if (params?.stock_filter) qs.set('stock_filter', params.stock_filter)
    return apiRequest<PaginatedProducts>(`/api/products?${qs.toString()}`, { method: 'GET' })
  },

  getLaboratories: () =>
    apiRequest<{ laboratories: string[] }>('/api/products/filters?type=laboratories', { method: 'GET' }),

  getTherapeuticActions: () =>
    apiRequest<{ therapeutic_actions: string[] }>('/api/products/filters?type=therapeutic_actions', { method: 'GET' }),

  getActiveIngredients: () =>
    apiRequest<{ active_ingredients: string[] }>('/api/products/filters?type=active_ingredients', { method: 'GET' }),

  get: (slug: string) =>
    apiRequest<ProductWithCategory>(`/api/products/${slug}`, { method: 'GET' }),

  getById: (id: string) =>
    apiRequest<ProductWithCategory>(`/api/products/id/${id}`, { method: 'GET' }),

  getByIds: (ids: string[]) =>
    apiRequest<ProductWithCategory[]>('/api/products/batch', { body: { ids } }),

  // Admin writes — go through /api/admin/products
  create: (data: CreateProductData) =>
    apiRequest<Product>('/api/admin/products', { body: data }),

  update: (id: string, data: Partial<CreateProductData>) =>
    apiRequest<Product>(`/api/admin/products/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  bulkImport: (data: { newProducts: unknown[]; updateProducts: unknown[] }) =>
    apiRequest<{ success: boolean; inserted: number; updated: number; errors?: string[] }>(
      '/api/admin/products/import',
      { body: data }
    ),

  listCategories: (activeOnly = true) =>
    apiRequest<Category[]>(`/api/categories?active_only=${activeOnly}`, { method: 'GET' }),

  createCategory: (data: { name: string; slug: string; description?: string }) =>
    apiRequest<Category>('/api/admin/categories', { body: data }),

  updateCategory: (id: string, data: { name?: string; slug?: string; description?: string; active?: boolean }) =>
    apiRequest<Category>(`/api/admin/categories/${id}`, { method: 'PUT', body: data }),

  deleteCategory: (id: string) =>
    apiRequest<void>(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  getCategoryProductCount: (categoryId: string) =>
    apiRequest<{ count: number }>(`/api/categories/${categoryId}/count`, { method: 'GET' }),
}

// ============================================
// Order API (reads via /api/orders, writes via /api/admin/orders)
// ============================================
export const orderApi = {
  storePickup: (data: {
    items: { product_id: string; quantity: number }[]
    name: string
    surname: string
    email?: string
    phone: string
    notes?: string
    session_id: string
    use_points?: boolean
  }) => apiRequest<StorePickupResponse>('/api/store-pickup', { body: data }),

  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.status) qs.set('status', params.status)
    return apiRequest<PaginatedOrders>(`/api/orders?${qs.toString()}`, { method: 'GET' })
  },

  get: (id: string) =>
    apiRequest<OrderWithItems>(`/api/orders/${id}`, { method: 'GET' }),

  adminGet: (id: string) =>
    apiRequest<OrderWithItems>(`/api/admin/orders/${id}`, { method: 'GET' }),

  // Admin operations
  listAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.status) qs.set('status', params.status)
    return apiRequest<PaginatedOrders>(`/api/admin/orders?${qs.toString()}`, { method: 'GET' })
  },

  updateStatus: (id: string, status: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { status } }),

  approveReservation: (id: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { action: 'approve_reservation' } }),

  rejectReservation: (id: string) =>
    apiRequest<Order>(`/api/admin/orders/${id}`, { method: 'PUT', body: { action: 'reject_reservation' } }),
}

// ============================================
// Types (unchanged — same interface for the frontend)
// ============================================
export interface User {
  id: string
  email: string
  name: string | null
  role: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  active: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price: string
  stock: number
  category_id: string | null
  image_url: string | null
  active: boolean
  external_id: string | null
  laboratory: string | null
  therapeutic_action: string | null
  active_ingredient: string | null
  prescription_type: 'direct' | 'prescription' | 'retained' | null
  presentation: string | null
  discount_percent: number | null
  created_at: string
}

export interface ProductWithCategory extends Product {
  category_name: string | null
  category_slug: string | null
}

export interface PaginatedProducts {
  products: ProductWithCategory[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface CreateProductData {
  name: string
  slug: string
  description?: string
  price: string
  stock: number
  category_id?: string
  image_url?: string
  laboratory?: string
  therapeutic_action?: string
  active_ingredient?: string
  prescription_type?: 'direct' | 'prescription' | 'retained'
  presentation?: string
  discount_percent?: number
  cost_price?: number | null
  active?: boolean
  external_id?: string | null
  barcodes?: string[]
}

export interface CartItem {
  product_id: string
  product_name: string
  product_slug: string
  product_image: string | null
  price: string
  original_price?: string
  discount_percent?: number
  quantity: number
  subtotal: string
  stock: number
}

export interface CartResponse {
  items: CartItem[]
  total: string
  item_count: number
}

export interface StorePickupResponse {
  order_id: string
  pickup_code: string
  expires_at: string
  total: string
}

export interface Order {
  id: string
  user_id: string | null
  status: string
  total: string
  shipping_address: string | null
  notes: string | null
  created_at: string
  payment_provider: string | null
  pickup_code: string | null
  reservation_expires_at: string | null
  customer_phone: string | null
  guest_name: string | null
  guest_surname: string | null
  guest_email: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  price_at_purchase: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
  guest_session_id?: string | null
}

export interface PaginatedOrders {
  orders: Order[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ============================================
// ERP Types
// ============================================
export interface Supplier {
  id: string
  name: string
  rut: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
  _count?: { purchase_orders: number }
  last_order?: { created_at: string; status: string } | null
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string | null
  supplier_product_code: string | null
  product_name_invoice: string | null
  quantity: number
  unit_cost: string
  subtotal: string
  products?: { id: string; name: string; slug: string } | null
}

export interface PurchaseOrder {
  id: string
  supplier_id: string
  invoice_number: string | null
  invoice_date: string | null
  status: 'draft' | 'received' | 'cancelled'
  total_cost: string | null
  notes: string | null
  image_url: string | null
  created_by: string
  created_at: string
  updated_at: string
  suppliers?: { id: string; name: string }
  items?: PurchaseOrderItem[]
  _count?: { items: number }
}

export interface ScannedLine {
  supplier_product_code: string | null
  product_name_invoice: string
  quantity: number
  unit_cost: number
  subtotal: number
  product_id: string | null
  product_name_matched: string | null
}

// ============================================
// Supplier API
// ============================================
export const supplierApi = {
  list: (includeInactive = false) =>
    apiRequest<{ suppliers: Supplier[] }>(
      `/api/admin/suppliers?include_inactive=${includeInactive}`,
      { method: 'GET' }
    ),

  get: (id: string) =>
    apiRequest<Supplier>(`/api/admin/suppliers/${id}`, { method: 'GET' }),

  create: (data: Partial<Supplier>) =>
    apiRequest<Supplier>('/api/admin/suppliers', { body: data }),

  update: (id: string, data: Partial<Supplier>) =>
    apiRequest<Supplier>(`/api/admin/suppliers/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest<void>(`/api/admin/suppliers/${id}`, { method: 'DELETE' }),
}

// ============================================
// Purchase Order API
// ============================================
export const purchaseOrderApi = {
  list: (params?: { page?: number; limit?: number; status?: string; supplier_id?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.status) qs.set('status', params.status)
    if (params?.supplier_id) qs.set('supplier_id', params.supplier_id)
    return apiRequest<{ orders: PurchaseOrder[]; total: number; total_pages: number }>(
      `/api/admin/purchase-orders?${qs.toString()}`,
      { method: 'GET' }
    )
  },

  get: (id: string) =>
    apiRequest<PurchaseOrder>(`/api/admin/purchase-orders/${id}`, { method: 'GET' }),

  create: (data: {
    supplier_id: string
    invoice_number?: string
    invoice_date?: string
    notes?: string
    ocr_raw?: string
    items: Array<{
      product_id?: string
      supplier_product_code?: string
      product_name_invoice?: string
      quantity: number
      unit_cost: number
      subtotal: number
    }>
  }) => apiRequest<PurchaseOrder>('/api/admin/purchase-orders', { body: data }),

  update: (id: string, data: Partial<PurchaseOrder>) =>
    apiRequest<PurchaseOrder>(`/api/admin/purchase-orders/${id}`, { method: 'PUT', body: data }),

  scan: (image_base64: string, supplier_id?: string) =>
    apiRequest<{ lines: ScannedLine[]; ocr_raw: string }>(
      '/api/admin/purchase-orders/scan',
      { body: { image_base64, supplier_id } }
    ),

  receive: (id: string) =>
    apiRequest<{ success: boolean; items_updated: number; items_skipped: number }>(
      `/api/admin/purchase-orders/${id}/receive`,
      { body: {} }
    ),

  mapProduct: (orderId: string, item_id: string, product_id: string) =>
    apiRequest<PurchaseOrderItem>(
      `/api/admin/purchase-orders/${orderId}/map-product`,
      { body: { item_id, product_id } }
    ),
}

// ============================================
// POS API
// ============================================
export const posApi = {
  sale: (data: {
    items: Array<{ product_id: string; product_name: string; quantity: number; price: number }>
    payment_method: 'pos_cash' | 'pos_debit' | 'pos_credit'
    customer_name?: string
    customer_phone?: string
    notes?: string
  }) => apiRequest<{ id: string; total: string; items_count: number }>('/api/admin/pos/sale', { body: data }),
}
