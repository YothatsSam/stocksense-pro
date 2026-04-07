import type { AdjustPayload, Alert, StockLevel } from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const getStock = () => request<StockLevel[]>('/stock')

export const adjustStock = (payload: AdjustPayload) =>
  request<StockLevel>('/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getAlerts = () => request<Alert[]>('/alerts')
