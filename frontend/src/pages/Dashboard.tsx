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
    <div className="min-h-full bg-zinc-50 px-8 py-8">

      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Real-time inventory across all locations</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-600 shadow-card transition-all duration-150 hover:border-zinc-300 hover:shadow-card-hover"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.9-2.1M20 15a9 9 0 01-15.9 2.1" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total SKUs"
          value={loading ? null : stock.length}
          icon="📦"
        />
        <MetricCard
          label="Locations"
          value={loading ? null : locationCount}
          icon="📍"
        />
        <MetricCard
          label="Low Stock Alerts"
          value={loading ? null : alerts.length}
          icon="🔔"
          alert={alerts.length > 0}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <span className="text-sm">⚠️</span>
          <p className="text-sm text-red-700">{error} — is the backend running?</p>
        </div>
      )}

      {/* Alerts + Chart */}
      {!error && (
        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <AlertsBanner alerts={alerts} />
          {!loading && stock.length > 0 && <StockChart stock={stock} />}
        </div>
      )}

      {/* Inventory table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Inventory
          </h2>
          {!loading && (
            <span className="text-xs text-zinc-400">{stock.length} items</span>
          )}
        </div>
        {loading ? <TableSkeleton /> : <StockTable stock={stock} onAdjust={setAdjusting} />}
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
  alert = false,
}: {
  label: string
  value: number | null
  icon: string
  alert?: boolean
}) {
  return (
    <div
      className={`group rounded-2xl border bg-white px-5 py-5 shadow-card transition-all duration-150 hover:shadow-card-hover hover:scale-[1.01] ${
        alert && value && value > 0 ? 'border-red-100' : 'border-zinc-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">{label}</p>
        <span className="text-base leading-none">{icon}</span>
      </div>
      {value === null ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-zinc-100" />
      ) : (
        <p
          className={`mt-2 text-[28px] font-bold leading-none tracking-tight ${
            alert && value > 0 ? 'text-red-600' : 'text-zinc-900'
          }`}
        >
          {value}
        </p>
      )}
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-card">
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        Stock by Location
      </p>
      <div className="space-y-4">
        {entries.map(([name, total]) => (
          <div key={name}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">{name}</span>
              <span className="text-xs font-semibold text-zinc-500">{total.toFixed(0)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-1.5 rounded-full bg-brand-500 transition-all duration-700"
                style={{ width: max > 0 ? `${(total / max) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
      <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4">
            <div className="h-2.5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-2.5 w-36 animate-pulse rounded bg-zinc-100" />
            <div className="ml-auto h-2.5 w-10 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  )
}
