import type { Alert } from '../types'

interface Props {
  alerts: Alert[]
}

export default function AlertsBanner({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">All stock levels healthy</p>
          <p className="text-xs text-emerald-600">No items are below their reorder threshold.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-red-100 bg-red-50 px-5 py-4 rounded-t-xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Low Stock Alerts</p>
          <p className="text-xs text-red-600">{alerts.length} item{alerts.length !== 1 ? 's' : ''} below reorder threshold</p>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {alerts.length}
        </span>
      </div>

      {/* Alert rows */}
      <ul className="divide-y divide-gray-100">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex items-center justify-between px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{alert.product_name}</span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">{alert.sku}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{alert.location_name}</p>
            </div>
            <div className="ml-4 shrink-0 text-right">
              <p className="text-sm font-bold text-red-600">
                {Number(alert.quantity).toFixed(0)}{' '}
                <span className="text-xs font-normal text-gray-400">{alert.unit}</span>
              </p>
              <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                -{Number(alert.deficit).toFixed(0)} short
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
