import type { StockLevel } from '../types'

const BADGE: Record<string, string> = {
  retail:       'bg-blue-100 text-blue-700',
  restaurant:   'bg-orange-100 text-orange-700',
  distribution: 'bg-purple-100 text-purple-700',
}

interface Props {
  stock: StockLevel[]
  onAdjust: (item: StockLevel) => void
}

export default function StockTable({ stock, onAdjust }: Props) {
  // Group rows by location
  const byLocation = stock.reduce<Record<string, StockLevel[]>>((acc, row) => {
    const key = `${row.location_id}::${row.location_name}`
    ;(acc[key] ??= []).push(row)
    return acc
  }, {})

  if (Object.keys(byLocation).length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        No stock data. Make sure the backend is running and the database is seeded.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(byLocation).map(([key, rows]) => {
        const first = rows[0]
        return (
          <div key={key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Location header */}
            <div className="flex items-center gap-3 border-b bg-gray-50 px-5 py-3">
              <span className="font-semibold text-gray-800">{first.location_name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${BADGE[first.business_type] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {first.business_type}
              </span>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Reorder at</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((item) => {
                  const qty = Number(item.quantity)
                  const reorder = Number(item.reorder_point)
                  const low = qty < reorder
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">{item.product_name}</td>
                      <td className={`px-5 py-3 text-right font-semibold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                        {qty.toFixed(0)} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {reorder.toFixed(0)} <span className="text-xs text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {low ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            Low
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => onAdjust(item)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:border-brand-500 hover:text-brand-600"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
