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

  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-login">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Adjust Stock</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {item.product_name}
              <span className="mx-1.5 text-zinc-300">·</span>
              {item.location_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

          {/* Current quantity */}
          <div className="rounded-xl bg-zinc-50 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Current quantity</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {Number(item.quantity).toFixed(0)}{' '}
              <span className="text-sm font-normal text-zinc-400">{item.unit}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400">
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
            <p className="mt-1.5 text-[11px] text-zinc-400">Use a negative number to reduce stock.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.06em] text-zinc-400">Reason</label>
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
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5">
              <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-150 hover:bg-zinc-50 hover:border-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving…
                </span>
              ) : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
