import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adjustStock, getAlerts, getStock } from '../api/client'
import AlertsBanner from '../components/AlertsBanner'
import AdjustModal from '../components/AdjustModal'
import StockTable from '../components/StockTable'
import { useAuth } from '../context/AuthContext'
import type { Alert, AdjustPayload, StockLevel } from '../types'

export default function Dashboard() {
  const { userEmail, signOut } = useAuth()
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

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">StockSense Pro</h1>
              <p className="text-xs text-gray-400">Inventory optimisation platform</p>
            </div>
            <nav className="flex items-center gap-1">
              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800">
                Dashboard
              </span>
              <Link
                to="/restaurant"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                Restaurant
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{userEmail}</span>
            <button
              onClick={fetchAll}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={signOut}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard label="Total SKUs tracked" value={stock.length} />
          <SummaryCard
            label="Locations"
            value={new Set(stock.map((s) => s.location_id)).size}
          />
          <SummaryCard
            label="Low stock alerts"
            value={alerts.length}
            highlight={alerts.length > 0}
          />
        </div>

        {/* Alerts */}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error} — is the backend running on port 3001?
          </div>
        ) : (
          <AlertsBanner alerts={alerts} />
        )}

        {/* Stock table */}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-400">Loading stock data...</p>
        ) : (
          <StockTable stock={stock} onAdjust={setAdjusting} />
        )}
      </main>

      {/* Adjust modal */}
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

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${highlight ? 'text-red-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
