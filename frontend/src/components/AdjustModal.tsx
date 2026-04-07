import { useState } from 'react'
import type { StockLevel } from '../types'

interface Props {
  item: StockLevel
  onClose: () => void
  onSave: (quantityChange: number, reason: string) => Promise<void>
}

export default function AdjustModal({ item, onClose, onSave }: Props) {
  const [quantityChange, setQuantityChange] = useState('')
  const [reason, setReason] = useState('')
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
      await onSave(delta, reason || 'manual adjustment')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Adjust Stock</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {item.product_name} — {item.location_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <p className="text-sm text-gray-600">
              Current quantity:{' '}
              <span className="font-semibold text-gray-900">
                {Number(item.quantity).toFixed(0)} {item.unit}
              </span>
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
              placeholder="e.g. 50 or -10"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
            <p className="mt-1 text-xs text-gray-400">Use negative numbers to reduce stock.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. delivery received, stock count"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
