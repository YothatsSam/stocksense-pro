import type { Alert } from '../types'

interface Props {
  alerts: Alert[]
}

export default function AlertsBanner({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-card">
        <span className="text-base leading-none">✅</span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">All stock levels healthy</p>
          <p className="text-xs text-zinc-500">No items are below their reorder threshold.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-card">
      {/* Left accent bar + header */}
      <div className="relative border-b border-zinc-100 px-5 py-4">
        {/* Red left border accent */}
        <div className="absolute inset-y-0 left-0 w-0.5 rounded-r bg-red-600" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm leading-none">🔔</span>
            <p className="text-sm font-semibold text-zinc-900">Low Stock Alerts</p>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {alerts.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {alerts.length} item{alerts.length !== 1 ? 's' : ''} need restocking
          </p>
        </div>
      </div>

      {/* Alert rows */}
      <ul className="divide-y divide-zinc-100">
        {alerts.map((alert) => (
          <li key={alert.id} className="relative flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-zinc-50">
            <div className="absolute inset-y-0 left-0 w-0.5 bg-red-600 opacity-0 transition-opacity duration-150 hover:opacity-100" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{alert.product_name}</span>
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  {alert.sku}
                </code>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{alert.location_name}</p>
            </div>
            <div className="ml-4 shrink-0 text-right">
              <p className="text-sm font-bold text-red-600">
                {Number(alert.quantity).toFixed(0)}{' '}
                <span className="text-xs font-normal text-zinc-400">{alert.unit}</span>
              </p>
              <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-red-100">
                -{Number(alert.deficit).toFixed(0)} short
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
