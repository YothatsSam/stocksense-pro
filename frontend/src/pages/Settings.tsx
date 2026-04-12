import { useCallback, useEffect, useState } from 'react'
import {
  getSettingsLocations, createSettingsLocation, deleteSettingsLocation,
  getSettingsProducts, createSettingsProduct, deleteSettingsProduct,
  getOnboardingLocations,
} from '../api/client'
import type { SettingsLocation, SettingsProduct, Location } from '../types'

// ── Shared modal chrome ───────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl">
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

// ── Delete confirmation ───────────────────────────────────────────────────────

function DeleteConfirmModal({ label, onConfirm, onClose }: {
  label: string
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function confirm() {
    setError('')
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed.')
      setLoading(false)
    }
  }

  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}
        <p className="text-sm text-zinc-300">
          Are you sure you want to delete <span className="font-semibold text-white">{label}</span>?
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={confirm} disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Locations section ─────────────────────────────────────────────────────────

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  retail:       'Retail Store',
  restaurant:   'Restaurant',
  distribution: 'Warehouse',
}

function LocationsSection() {
  const [locations, setLocations] = useState<SettingsLocation[]>([])
  const [loading, setLoading]     = useState(true)
  const [showNew, setShowNew]     = useState(false)
  const [deleting, setDeleting]   = useState<SettingsLocation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setLocations(await getSettingsLocations()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Locations</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Stores, restaurants, and warehouses in your organisation</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Add Location
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Loading…</p>
      ) : locations.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">No locations yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Name', 'Type', 'Address', 'Products', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {locations.map(loc => (
                <tr key={loc.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-200">{loc.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-700/60 text-zinc-300">
                      {BUSINESS_TYPE_LABELS[loc.business_type] ?? loc.business_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{loc.address ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-400">{loc.product_count}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleting(loc)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-900/30 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <AddLocationModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}

      {deleting && (
        <DeleteConfirmModal
          label={deleting.name}
          onConfirm={() => deleteSettingsLocation(deleting.id).then(load)}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

// ── Add Location Modal ────────────────────────────────────────────────────────

function AddLocationModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]             = useState('')
  const [businessType, setBusinessType] = useState('retail')
  const [address, setAddress]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function submit() {
    setError('')
    if (!name.trim()) return setError('Location name is required.')
    setLoading(true)
    try {
      await createSettingsLocation({ name, business_type: businessType, address })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add location.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Location" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Location Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Warehouse North"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Location Type</label>
          <select value={businessType} onChange={e => setBusinessType(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="retail">Retail Store</option>
            <option value="restaurant">Restaurant</option>
            <option value="distribution">Warehouse</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Address</label>
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="e.g. 12 Industrial Way, Manchester"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Adding…' : 'Add Location'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Products section ──────────────────────────────────────────────────────────

const UNITS = ['unit', 'kg', 'g', 'L', 'ml', 'case', 'pallet']

function ProductsSection() {
  const [products, setProducts] = useState<SettingsProduct[]>([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [deleting, setDeleting] = useState<SettingsProduct | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setProducts(await getSettingsProducts()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Products</h2>
          <p className="text-xs text-zinc-500 mt-0.5">SKUs and items tracked across your locations</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 py-6 text-center">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-zinc-500 py-6 text-center">No products yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['SKU', 'Name', 'Unit', 'Reorder Point', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {products.map(p => (
                <tr key={p.id} className="bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-zinc-200">{p.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{p.unit}</td>
                  <td className="px-4 py-3 text-zinc-400">{Number(p.reorder_point).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleting(p)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-900/30 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <AddProductModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load() }}
        />
      )}

      {deleting && (
        <DeleteConfirmModal
          label={deleting.name}
          onConfirm={() => deleteSettingsProduct(deleting.id).then(load)}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

// ── Add Product Modal ─────────────────────────────────────────────────────────

function generateSku(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w.slice(0, 3))
    .join('-')
    .slice(0, 20)
}

function AddProductModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]                   = useState('')
  const [sku, setSku]                     = useState('')
  const [skuEdited, setSkuEdited]         = useState(false)
  const [unit, setUnit]                   = useState('unit')
  const [reorderPoint, setReorderPoint]   = useState('0')
  const [initialQty, setInitialQty]       = useState('0')
  const [locationId, setLocationId]       = useState('')
  const [locations, setLocations]         = useState<Location[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  useEffect(() => {
    getOnboardingLocations().then(l => setLocations(l as unknown as Location[]))
  }, [])

  function handleNameChange(v: string) {
    setName(v)
    if (!skuEdited) setSku(generateSku(v))
  }

  async function submit() {
    setError('')
    if (!name.trim()) return setError('Product name is required.')
    if (!sku.trim()) return setError('SKU is required.')
    setLoading(true)
    try {
      await createSettingsProduct({
        name,
        sku,
        unit,
        reorder_point: Number(reorderPoint) || 0,
        initial_quantity: Number(initialQty) || 0,
        location_id: locationId ? Number(locationId) : null,
      })
      onCreated()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add Product" onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-xs text-red-400">{error}</p>}

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Product Name *</label>
          <input type="text" value={name} onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Whole Milk"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">SKU *</label>
          <input type="text" value={sku}
            onChange={e => { setSku(e.target.value.toUpperCase()); setSkuEdited(true) }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          <p className="mt-0.5 text-[11px] text-zinc-600">Auto-generated from name — you can edit it</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Unit</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Reorder Point</label>
            <input type="number" min="0" value={reorderPoint} onChange={e => setReorderPoint(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Initial Stock Qty</label>
            <input type="number" min="0" value={initialQty} onChange={e => setInitialQty(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Add Stock To</label>
            <select value={locationId} onChange={e => setLocationId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">No location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Adding…' : 'Add Product'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="min-h-full bg-zinc-950 p-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Manage your locations and product catalogue</p>
      </div>

      <div className="space-y-10 max-w-5xl">
        <LocationsSection />
        <div className="h-px bg-zinc-800" />
        <ProductsSection />
      </div>
    </div>
  )
}
