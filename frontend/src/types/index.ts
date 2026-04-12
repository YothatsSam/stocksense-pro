export interface StockLevel {
  id: number
  product_id: number
  sku: string
  product_name: string
  unit: string
  location_id: number
  location_name: string
  business_type: 'retail' | 'restaurant' | 'distribution'
  quantity: string       // Postgres NUMERIC comes back as string
  reorder_point: string
  updated_at: string
}

export interface Alert extends StockLevel {
  deficit: string
}

export interface AdjustPayload {
  product_id: number
  location_id: number
  quantity_change: number
  reason?: string
}

export interface AuthResponse {
  token: string
  email: string
  name: string | null
  role: string
  organisationId: number
  businessType: 'retail' | 'restaurant' | 'distribution'
  organisationName: string
  subscriptionPlan: string
}

export interface Product {
  id: number
  sku: string
  name: string
  unit: string
  unit_cost: string
}

export interface RecipeIngredient {
  id: number
  product_id: number
  product_name: string
  sku: string
  unit: string
  unit_cost: string
  quantity_required: string
  stock_quantity: string | null
  reorder_point: string | null
  is_low: boolean
}

export interface Recipe {
  id: number
  name: string
  location_id: number
  location_name: string
  ingredients: RecipeIngredient[]
  food_cost: number
}

export interface Location {
  id: number
  name: string
  business_type: string
  address?: string
}

export interface RegisterPayload {
  business_name: string
  business_type: 'retail' | 'restaurant' | 'distribution'
  name: string
  email: string
  password: string
}

export interface OnboardingLocation {
  name: string
  address?: string
  business_type?: string
}

export interface OnboardingProduct {
  name: string
  sku: string
  unit: string
  reorder_point: number
  location_id?: number
}

// ── Distribution ─────────────────────────────────────────────────────────────

export interface PurchaseOrderItem {
  id: number
  product_id: number
  product_name: string
  sku: string
  unit: string
  quantity_ordered: string
  quantity_received: string
  unit_price: string
}

export interface PurchaseOrder {
  id: number
  supplier_id: number
  supplier_name: string
  location_id: number | null
  location_name: string | null
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  total_items: number
  expected_delivery: string | null
  notes: string | null
  created_at: string
  items: PurchaseOrderItem[]
}

export interface Shipment {
  id: number
  organisation_id: number
  reference: string
  type: 'inbound' | 'outbound'
  status: 'pending' | 'in_transit' | 'delivered'
  location_id: number | null
  location_name: string | null
  notes: string | null
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  products_supplied: string
  created_at: string
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface SettingsLocation {
  id: number
  name: string
  business_type: string
  address: string | null
  product_count: string
  created_at: string
}

export interface SettingsProduct {
  id: number
  sku: string
  name: string
  unit: string
  unit_cost: string
  reorder_point: string
  created_at: string
}
