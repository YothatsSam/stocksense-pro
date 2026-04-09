import { useState } from 'react'
import type { StockLevel } from '../types'

interface Props {
  item: StockLevel
  onClose: () => void
  onSave: (quantityChange: number, reason: string) => Promise<void>
}

export default function AdjustModal({ item, onClose, onSave }: Props) {
  const [quantityChange, setQuantityChange] = useState('')
  const [reason, setReason] = useState('received')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const delta = Number(quantityChange)
    if (isNaN(delta) || delta === 0) {
      setError('Enter a non-zero number (negative to remove stock).')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSave(delta, reason)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'mt-1.5 block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Adjust Stock</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {item.product_name}
              <span className="mx-1.5 text-gray-300">·</span>
              {item.location_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Current quantity */}
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">Current quantity</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">
              {Number(item.quantity).toFixed(0)}{' '}
              <span className="text-sm font-normal text-gray-400">{item.unit}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity change
            </label>
            <input
              type="number"
              step="any"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
              placeholder="e.g. 50 or −10"
              className={inputClass}
              required
              autoFocus
            />
            <p className="mt-1.5 text-xs text-gray-400">Use a negative number to reduce stock.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
            >
              <option value="received">Received</option>
              <option value="sold">Sold</option>
              <option value="damaged">Damaged</option>
              <option value="correction">Correction</option>
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-50 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </span>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
