import type {
  AdjustPayload, Alert, AuthResponse, Location,
  OnboardingProduct, Product, Recipe, RegisterPayload, StockLevel,
  PurchaseOrder, Shipment, Supplier,
  SettingsLocation, SettingsProduct,
} from '../types'

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/api`

function getToken() {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Auth ─────────────────────────────────────────────────────────────
export const login = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const register = (payload: RegisterPayload) =>
  request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

// ── Stock ─────────────────────────────────────────────────────────────
export const getStock = () => request<StockLevel[]>('/stock')

export const adjustStock = (payload: AdjustPayload) =>
  request<StockLevel>('/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getAlerts = () => request<Alert[]>('/alerts')

// ── Restaurant ────────────────────────────────────────────────────────
export const getRecipes = () => request<Recipe[]>('/restaurant/recipes')

export const createRecipe = (data: {
  name: string
  location_id: number
  ingredients: { product_id: number; quantity_required: number }[]
}) =>
  request<Recipe>('/restaurant/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const serveRecipe = (id: number) =>
  request<{ success: boolean }>(`/restaurant/recipes/${id}/serve`, {
    method: 'POST',
  })

export const getRestaurantProducts = () => request<Product[]>('/restaurant/products')

export const getLocations = () =>
  request<StockLevel[]>('/stock').then((rows) => {
    const seen = new Set<number>()
    return rows
      .filter((r) => {
        if (seen.has(r.location_id)) return false
        seen.add(r.location_id)
        return true
      })
      .map((r) => ({ id: r.location_id, name: r.location_name, business_type: r.business_type }))
  })

// ── Onboarding ────────────────────────────────────────────────────────
export const addLocation = (data: { name: string; address?: string; business_type?: string }) =>
  request<Location>('/onboarding/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getOnboardingLocations = () =>
  request<Location[]>('/onboarding/locations')

export const addProduct = (data: OnboardingProduct) =>
  request<Product>('/onboarding/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })

// ── Distribution ──────────────────────────────────────────────────────────────

export const getOrders = () => request<PurchaseOrder[]>('/distribution/orders')

export const createOrder = (data: {
  supplier_id: number
  location_id?: number | null
  expected_delivery?: string | null
  notes?: string
  items: { product_id: number; quantity_ordered: number; unit_price?: number }[]
}) =>
  request<PurchaseOrder>('/distribution/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const receiveOrder = (
  id: number,
  items: { purchase_order_item_id: number; quantity_received: number }[]
) =>
  request<{ success: boolean }>(`/distribution/orders/${id}/receive`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })

export const getShipments = () => request<Shipment[]>('/distribution/shipments')

export const createShipment = (data: {
  reference: string
  type: 'inbound' | 'outbound'
  status: 'pending' | 'in_transit' | 'delivered'
  location_id?: number | null
  notes?: string
}) =>
  request<Shipment>('/distribution/shipments', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getDistributionSuppliers = () => request<Supplier[]>('/distribution/suppliers')

export const createDistributionSupplier = (data: {
  name: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  notes?: string
}) =>
  request<Supplier>('/distribution/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getDistributionProducts = () => request<Product[]>('/distribution/products')

// ── Settings ──────────────────────────────────────────────────────────────────

export const getSettingsLocations = () => request<SettingsLocation[]>('/settings/locations')

export const createSettingsLocation = (data: {
  name: string
  business_type?: string
  address?: string
}) =>
  request<SettingsLocation>('/settings/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteSettingsLocation = (id: number) =>
  request<{ success: boolean }>(`/settings/locations/${id}`, { method: 'DELETE' })

export const getSettingsProducts = () => request<SettingsProduct[]>('/settings/products')

export const createSettingsProduct = (data: {
  name: string
  sku: string
  unit: string
  reorder_point: number
  initial_quantity?: number
  location_id?: number | null
}) =>
  request<SettingsProduct>('/settings/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const deleteSettingsProduct = (id: number) =>
  request<{ success: boolean }>(`/settings/products/${id}`, { method: 'DELETE' })
