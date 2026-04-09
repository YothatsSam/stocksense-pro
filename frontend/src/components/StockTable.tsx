import type { StockLevel } from '../types'

const TYPE_BADGE: Record<string, string> = {
  retail:       'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  restaurant:   'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  distribution: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
}

interface Props {
  stock: StockLevel[]
  onAdjust: (item: StockLevel) => void
}

export default function StockTable({ stock, onAdjust }: Props) {
  const byLocation = stock.reduce<Record<string, StockLevel[]>>((acc, row) => {
    const key = `${row.location_id}::${row.location_name}`
    ;(acc[key] ??= []).push(row)
    return acc
  }, {})

  if (Object.keys(byLocation).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
        <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No stock data</p>
        <p className="mt-1 text-sm text-gray-400">Make sure the backend is running and the database is seeded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {Object.entries(byLocation).map(([key, rows]) => {
        const first = rows[0]
        return (
          <div key={key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* Location header */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200">
                <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">{first.location_name}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  TYPE_BADGE[first.business_type] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {first.business_type}
              </span>
              <span className="ml-auto text-xs text-gray-400">{rows.length} SKU{rows.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Quantity</th>
                  <th className="px-5 py-3 text-right">Reorder at</th>
                  <th className="px-5 py-3 text-right">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, idx) => {
                  const qty = Number(item.quantity)
                  const reorder = Number(item.reorder_point)
                  const low = qty < reorder
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-50 transition-colors duration-100 last:border-0 hover:bg-gray-50 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                          {item.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{item.product_name}</td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${low ? 'text-red-600' : 'text-gray-900'}`}>
                        {qty.toFixed(0)}{' '}
                        <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-500">
                        {reorder.toFixed(0)}{' '}
                        <span className="text-xs text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {low ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onAdjust(item)}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-all duration-150 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md"
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
