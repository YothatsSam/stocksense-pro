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
