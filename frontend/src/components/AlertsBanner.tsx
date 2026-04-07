import type { Alert } from '../types'

interface Props {
  alerts: Alert[]
}

export default function AlertsBanner({ alerts }: Props) {
  if (alerts.length === 0) return null

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          {alerts.length}
        </span>
        Low Stock Alerts
      </h2>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm shadow-sm"
          >
            <div>
              <span className="font-medium text-gray-900">{alert.product_name}</span>
              <span className="ml-2 text-gray-500 text-xs">{alert.sku}</span>
              <span className="ml-3 text-gray-600">@ {alert.location_name}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-red-700">
                {Number(alert.quantity).toFixed(0)} {alert.unit}
              </span>
              <span className="ml-1 text-xs text-gray-500">
                / {Number(alert.reorder_point).toFixed(0)} min
              </span>
              <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                -{Number(alert.deficit).toFixed(0)} short
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
