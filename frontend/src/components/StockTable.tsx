import type { StockLevel } from '../types'

const TYPE_BADGE: Record<string, string> = {
  retail:       'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  restaurant:   'bg-orange-50 text-orange-600 ring-1 ring-orange-100',
  distribution: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
        <span className="mb-3 text-3xl">📦</span>
        <p className="text-sm font-medium text-zinc-500">No stock data</p>
        <p className="mt-1 text-sm text-zinc-400">Make sure the backend is running and the database is seeded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {Object.entries(byLocation).map(([key, rows]) => {
        const first = rows[0]
        return (
          <div key={key} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">

            {/* Location header */}
            <div className="flex items-center gap-2.5 border-b border-zinc-100 bg-zinc-50/80 px-5 py-3">
              <span className="text-sm leading-none">📍</span>
              <span className="text-sm font-semibold text-zinc-800">{first.location_name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                  TYPE_BADGE[first.business_type] ?? 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {first.business_type}
              </span>
              <span className="ml-auto text-xs text-zinc-400">{rows.length} items</span>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">SKU</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Product</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Quantity</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Reorder at</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Status</th>
                  <th className="px-5 py-3 w-16" />
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
                      className={`group border-b border-zinc-50 transition-colors duration-150 last:border-0 hover:bg-zinc-50 ${
                        idx % 2 === 1 ? 'bg-zinc-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500">
                          {item.sku}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-900">{item.product_name}</td>
                      <td className={`px-5 py-3.5 text-right text-sm font-semibold ${low ? 'text-red-600' : 'text-zinc-900'}`}>
                        {qty.toFixed(0)}{' '}
                        <span className="text-xs font-normal text-zinc-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-zinc-500">
                        {reorder.toFixed(0)}{' '}
                        <span className="text-xs text-zinc-400">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {low ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {/* Visible only on row hover */}
                        <button
                          onClick={() => onAdjust(item)}
                          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 opacity-0 shadow-card transition-all duration-150 group-hover:opacity-100 hover:border-zinc-300 hover:shadow-card-hover"
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
