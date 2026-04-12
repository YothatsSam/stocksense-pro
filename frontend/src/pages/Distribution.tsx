import { useCallback, useEffect, useState } from 'react'
import {
  getOrders, createOrder, receiveOrder,
  getShipments, createShipment,
  getDistributionSuppliers, createDistributionSupplier,
  getDistributionProducts, getOnboardingLocations,
} from '../api/client'
import type { PurchaseOrder, Shipment, Supplier } from '../types'
import type { Product, Location } from '../types'

// ── Status badge helpers ──────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Draft',    cls: 'bg-zinc-700 text-zinc-300' },
  sent:      { label: 'Sent',     cls: 'bg-blue-900/60 text-blue-300' },
  received:  { label: 'Received', cls: 'bg-green-900/60 text-green-300' },
  cancelled: { label: 'Cancelled',cls: 'bg-red-900/60 text-red-300' },
}

const SHIP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Pending',    cls: 'bg-amber-900/60 text-amber-300' },
  in_transit: { label: 'In Transit', cls: 'bg-blue-900/60 text-blue-300' },
  delivered:  { label: 'Delivered',  cls: 'bg-green-900/60 text-green-300' },
}

const SHIP_TYPE: Record<string, { label: string; cls: string }> = {
  inbound:  { label: 'Inbound',  cls: 'bg-violet-900/60 text-violet-300' },
  outbound: { label: 'Outbound', cls: 'bg-orange-900/60 text-orange-300' },
}

function Badge({ cfg }: { cfg: { label: string; cls: string } }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Shared modal chrome ───────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

// ── Tab 1: Purchase Orders ────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders]         = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers]   = useState<Supplier[]>([])
  const [products, setProducts]     = useState<Product[]>([])
  const [locations, setLocations]   = useState<Location[]>([])
  const [loading, setLoading]       = useState(true)
  const [showNew, setShowNew]       = useState(false)
  const [receiving, setReceiving]   = useState<PurchaseOrder | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [o, s, p, l] = await Promise.all([
        getOrders(), getDistributionSuppliers(), getDistributionProducts(), getOnboardingLocations(),
      ])
      setOrders(o)
      setSuppliers(s)
      setProducts(p)
      // getOnboardingLocations returns Location[] shape
      setLocations(l as unknown as Location[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{orders.length} purchase order{orders.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + New Purchase Order
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-8 text-center">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No purchase orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Order #', 'Supplier', 'Items', 'Status', 'Expected Delivery', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {orders.map(o => (
                <tr key={o.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-300">#{o.id}</td>
                  <td className="px-4 py-3 text-zinc-200">{o.supplier_name}</td>
                  <td className="px-4 py-3 text-zinc-400">{o.total_items}</td>
                  <td className="px-4 py-3">
                    <Badge cfg={ORDER_STATUS[o.status] ?? ORDER_STATUS.draft} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {o.expected_delivery
                      ? new Date(o.expected_delivery).toLocaleDateString()
                      : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {o.status !== 'received' && o.status !== 'cancelled' && (
                        <button
                          onClick={() => setReceiving(o)}
                          className="rounded px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-900/30 transition-colors"
                        >
                          Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewOrderModal
          suppliers={suppliers}
          products={products}
          locations={locations}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}

      {receiving && (
        <ReceiveOrderModal
          order={receiving}
          onClose={() => setReceiving(null)}
          onReceived={() => { setReceiving(null); load() }}
        />
      )}
    </div>
  )
}

// ── New Order Modal ───────────────────────────────────────────────────────────

interface OrderItem { product_id: number; quantity_ordered: number; unit_price: number }

function NewOrderModal({ suppliers, products, locations, onClose, onCreated }: {
  suppliers: Supplier[]
  products: Product[]
  locations: Location[]
  onClose: () => void
  onCreated: () => void
}) {
  const [supplierId, setSupplierId]         = useState('')
  const [locationId, setLocationId]         = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes]                   = useState('')
  const [items, setItems]                   = useState<OrderItem[]>([{ product_id: 0, quantity_ordered: 1, unit_price: 0 }])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')

  function addRow() { setItems(p => [...p, { product_id: 0, quantity_ordered: 1, unit_price: 0 }]) }
  function removeRow(i: number) { setItems(p => p.filter((_, idx) => idx !== i)) }
  function updateRow(i: number, field: keyof OrderItem, value: string) {
    setItems(p => p.map((r, idx) => idx === i ? { ...r, [field]: field === 'product_id' ? Number(value) : parseFloat(value) || 0 } : r))
  }

  async function submit() {
    setError('')
    if (!supplierId) return setError('Select a supplier.')
    if (items.some(r => !r.product_id)) return setError('Select a product for each row.')

    setLoading(true)
    try {
      await createOrder({
        supplier_id: Number(supplierId),
        location_id: locationId ? Number(locationId) : null,
        expected_delivery: expectedDelivery || null,
        notes,
        items,
      })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New Purchase Order" onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Supplier *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Location</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Any location…</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Expected Delivery</label>
          <input type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs text-zinc-400">Items *</label>
            <button onClick={addRow} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">+ Add row</button>
          </div>
          <div className="space-y-2">
            {items.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_24px] gap-2 items-center">
                <select value={row.product_id || ''} onChange={e => updateRow(i, 'product_id', e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
                  <option value="">Product…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" placeholder="Qty" value={row.quantity_ordered}
                  onChange={e => updateRow(i, 'quantity_ordered', e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                <input type="number" min="0" step="0.01" placeholder="Price" value={row.unit_price}
                  onChange={e => updateRow(i, 'unit_price', e.target.value)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
                {items.length > 1 && (
                  <button onClick={() => removeRow(i)} className="text-zinc-600 hover:text-red-400 transition-colors text-base leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Receive Order Modal ───────────────────────────────────────────────────────

function ReceiveOrderModal({ order, onClose, onReceived }: {
  order: PurchaseOrder
  onClose: () => void
  onReceived: () => void
}) {
  const [qtys, setQtys] = useState<Record<number, number>>(
    Object.fromEntries(order.items.map(i => [i.id, Number(i.quantity_ordered)]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function submit() {
    setError('')
    setLoading(true)
    try {
      await receiveOrder(order.id, order.items.map(i => ({
        purchase_order_item_id: i.id,
        quantity_received: qtys[i.id] ?? 0,
      })))
      onReceived()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to receive order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`Receive Order #${order.id}`} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <p className="text-xs text-zinc-500">Confirm quantities received. Stock levels will be updated automatically.</p>

        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="grid grid-cols-[1fr_120px] gap-3 items-center">
              <div>
                <p className="text-sm text-zinc-200">{item.product_name}</p>
                <p className="text-xs text-zinc-500">{item.sku} · ordered: {Number(item.quantity_ordered).toLocaleString()} {item.unit}</p>
              </div>
              <input
                type="number" min="0"
                value={qtys[item.id] ?? 0}
                onChange={e => setQtys(p => ({ ...p, [item.id]: parseFloat(e.target.value) || 0 }))}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
            {loading ? 'Receiving…' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Tab 2: Shipments ──────────────────────────────────────────────────────────

function ShipmentsTab() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, l] = await Promise.all([getShipments(), getOnboardingLocations()])
      setShipments(s)
      setLocations(l as unknown as Location[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{shipments.length} shipment{shipments.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + New Shipment
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-8 text-center">Loading…</p>
      ) : shipments.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No shipments yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Reference', 'Type', 'Location', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {shipments.map(s => (
                <tr key={s.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-300">{s.reference}</td>
                  <td className="px-4 py-3">
                    <Badge cfg={SHIP_TYPE[s.type] ?? SHIP_TYPE.inbound} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{s.location_name ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <Badge cfg={SHIP_STATUS[s.status] ?? SHIP_STATUS.pending} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewShipmentModal
          locations={locations}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}
    </div>
  )
}

// ── New Shipment Modal ────────────────────────────────────────────────────────

function NewShipmentModal({ locations, onClose, onCreated }: {
  locations: Location[]
  onClose: () => void
  onCreated: () => void
}) {
  const [reference, setReference] = useState('')
  const [type, setType]           = useState<'inbound' | 'outbound'>('inbound')
  const [status, setStatus]       = useState<'pending' | 'in_transit' | 'delivered'>('pending')
  const [locationId, setLocationId] = useState('')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function submit() {
    setError('')
    if (!reference.trim()) return setError('Reference is required.')
    setLoading(true)
    try {
      await createShipment({
        reference: reference.trim(),
        type,
        status,
        location_id: locationId ? Number(locationId) : null,
        notes,
      })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create shipment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="New Shipment" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Reference *</label>
          <input type="text" value={reference} onChange={e => setReference(e.target.value)}
            placeholder="e.g. SHP-2024-001"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Type</label>
            <select value={type} onChange={e => setType(e.target.value as 'inbound' | 'outbound')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'pending' | 'in_transit' | 'delivered')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Location</label>
          <select value={locationId} onChange={e => setLocationId(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="">Select location…</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Creating…' : 'Create Shipment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Tab 3: Suppliers ──────────────────────────────────────────────────────────

function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSuppliers(await getDistributionSuppliers())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Add Supplier
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-8 text-center">Loading…</p>
      ) : suppliers.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No suppliers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Name', 'Contact', 'Email', 'Phone', 'Products'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {suppliers.map(s => (
                <tr key={s.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-200">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.contact_person ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.contact_email ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.contact_phone ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.products_supplied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewSupplierModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}
    </div>
  )
}

// ── New Supplier Modal ────────────────────────────────────────────────────────

function NewSupplierModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]               = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function submit() {
    setError('')
    if (!name.trim()) return setError('Supplier name is required.')
    setLoading(true)
    try {
      await createDistributionSupplier({ name, contact_person: contactPerson, contact_email: email, contact_phone: phone, notes })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add supplier.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Supplier" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Supplier Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Contact Person</label>
          <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Adding…' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orders',    label: 'Purchase Orders' },
  { id: 'shipments', label: 'Shipments'       },
  { id: 'suppliers', label: 'Suppliers'       },
] as const

type TabId = typeof TABS[number]['id']

export default function Distribution() {
  const [activeTab, setActiveTab] = useState<TabId>('orders')

  return (
    <div className="min-h-full bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Distribution Centre</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Manage purchase orders, shipments, and suppliers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'orders'    && <OrdersTab />}
      {activeTab === 'shipments' && <ShipmentsTab />}
      {activeTab === 'suppliers' && <SuppliersTab />}
    </div>
  )
}
