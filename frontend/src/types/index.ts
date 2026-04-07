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
