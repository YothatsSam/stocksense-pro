import { useCallback, useEffect, useState } from 'react'
import { adjustStock, getAlerts, getStock } from '../api/client'
import AlertsBanner from '../components/AlertsBanner'
import AdjustModal from '../components/AdjustModal'
import StockTable from '../components/StockTable'
import type { Alert, AdjustPayload, StockLevel } from '../types'

export default function Dashboard() {
  const [stock, setStock] = useState<StockLevel[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjusting, setAdjusting] = useState<StockLevel | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [stockData, alertsData] = await Promise.all([getStock(), getAlerts()])
      setStock(stockData)
      setAlerts(alertsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleAdjust(quantityChange: number, reason: string) {
    if (!adjusting) return
    const payload: AdjustPayload = {
      product_id: adjusting.product_id,
      location_id: adjusting.location_id,
      quantity_change: quantityChange,
      reason,
    }
    await adjustStock(payload)
    await fetchAll()
  }

  const locationCount = new Set(stock.map((s) => s.location_id)).size

  return (
    <div className="min-h-full px-6 py-8 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time inventory overview across all locations</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all duration-150 hover:border-gray-300 hover:shadow-md"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.9-2.1M20 15a9 9 0 01-15.9 2.1" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          label="Total SKUs Tracked"
          value={stock.length}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          iconBg="bg-brand-50 text-brand-600"
          loading={loading}
        />
        <MetricCard
          label="Active Locations"
          value={locationCount}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
          }
          iconBg="bg-emerald-50 text-emerald-600"
          loading={loading}
        />
        <MetricCard
          label="Low Stock Alerts"
          value={alerts.length}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          iconBg={alerts.length > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
          highlight={alerts.length > 0}
          loading={loading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-sm text-red-700">{error} — is the backend running?</p>
        </div>
      )}

      {/* Alerts + Chart row */}
      {!error && (
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AlertsBanner alerts={alerts} />
          {!loading && <StockChart stock={stock} />}
        </div>
      )}

      {/* Stock table */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-gray-800">Inventory</h2>
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <StockTable stock={stock} onAdjust={setAdjusting} />
        )}
      </div>

      {adjusting && (
        <AdjustModal
          item={adjusting}
          onClose={() => setAdjusting(null)}
          onSave={handleAdjust}
        />
      )}
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  highlight = false,
  loading = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  highlight?: boolean
  loading?: boolean
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-6 shadow-sm transition-shadow duration-150 hover:shadow-md ${
        highlight ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-gray-100" />
          ) : (
            <p className={`mt-2 text-3xl font-bold tracking-tight ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
              {value}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Stock Chart ─────────────────────────────────────────────────────────────

function StockChart({ stock }: { stock: StockLevel[] }) {
  const byLocation = stock.reduce<Record<string, number>>((acc, item) => {
    acc[item.location_name] = (acc[item.location_name] ?? 0) + Number(item.quantity)
    return acc
  }, {})

  const entries = Object.entries(byLocation)
  if (entries.length === 0) return null

  const max = Math.max(...entries.map(([, v]) => v))

  const barColors = [
    'bg-brand-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-pink-500',
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-semibold text-gray-700">Stock Levels by Location</h3>
      <div className="space-y-4">
        {entries.map(([name, total], i) => (
          <div key={name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{name}</span>
              <span className="text-sm font-semibold text-gray-900">{total.toFixed(0)} units</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${barColors[i % barColors.length]}`}
                style={{ width: max > 0 ? `${(total / max) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-5 py-3">
        <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="ml-auto h-3 w-12 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
