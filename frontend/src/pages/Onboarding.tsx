import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addLocation, addProduct } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Location } from '../types'

// ── Step indicator ────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Add location', 'Add products', 'All set!']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < current
        const active = num === current
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                done   ? 'bg-brand-500 border-brand-500 text-white'
                : active ? 'bg-white border-brand-500 text-brand-600'
                : 'bg-white border-zinc-200 text-zinc-400'
              }`}>
                {done ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : num}
              </div>
              <span className={`mt-1 text-xs font-medium whitespace-nowrap ${active ? 'text-brand-600' : 'text-zinc-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-1 mb-4 transition-colors duration-200 ${done ? 'bg-brand-500' : 'bg-zinc-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Add first location ────────────────────────────────────────
function Step1({ onDone }: { onDone: (loc: Location) => void }) {
  const { businessType } = useAuth()
  const [name, setName]       = useState('')
  const [address, setAddress] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const placeholder = businessType === 'restaurant' ? 'e.g. Bella Vista Soho'
    : businessType === 'distribution' ? 'e.g. Midlands DC Hub'
    : 'e.g. Oxford Street Store'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Location name is required.')
    setError(null)
    setLoading(true)
    try {
      const loc = await addLocation({ name, address })
      onDone(loc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add location.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
          Location name
        </label>
        <input
          type="text"
          required
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <div>
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
          Address <span className="normal-case text-zinc-400">(optional)</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="12 High Street, London, W1A 1AA"
          className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      {error && <ErrorBox message={error} />}
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
        {loading ? 'Adding…' : 'Add location & continue'}
      </button>
    </form>
  )
}

// ── Step 2: Add up to 5 products ──────────────────────────────────────
interface ProductRow {
  name: string
  sku: string
  unit: string
  reorder_point: string
}

function emptyRow(): ProductRow {
  return { name: '', sku: '', unit: 'unit', reorder_point: '10' }
}

function Step2({ location, onDone }: { location: Location; onDone: () => void }) {
  const [rows, setRows] = useState<ProductRow[]>([emptyRow()])
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]   = useState(0)

  function updateRow(i: number, field: keyof ProductRow, val: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }

  function addRow() {
    if (rows.length < 5) setRows(prev => [...prev, emptyRow()])
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filled = rows.filter(r => r.name.trim() && r.sku.trim())
    if (filled.length === 0) return setError('Add at least one product.')
    setError(null)
    setLoading(true)
    let count = 0
    try {
      for (const row of filled) {
        await addProduct({
          name: row.name,
          sku: row.sku,
          unit: row.unit,
          reorder_point: Number(row.reorder_point) || 0,
          location_id: location.id,
        })
        count++
        setSaved(count)
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save products.')
    } finally {
      setLoading(false)
    }
  }

  const UNITS = ['unit', 'kg', 'g', 'litre', 'ml', 'case', 'box', 'tin', 'bottle', 'portion']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-zinc-500">
        Adding products for <span className="font-semibold text-zinc-700">{location.name}</span>. You can add more from the dashboard later.
      </p>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-start rounded-lg border border-zinc-100 bg-zinc-50 p-3">
            <div className="col-span-4">
              {i === 0 && <label className="block text-xs text-zinc-400 mb-1">Product name</label>}
              <input
                type="text"
                value={row.name}
                onChange={e => updateRow(i, 'name', e.target.value)}
                placeholder="e.g. Olive Oil 5L"
                className="block w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="col-span-3">
              {i === 0 && <label className="block text-xs text-zinc-400 mb-1">SKU</label>}
              <input
                type="text"
                value={row.sku}
                onChange={e => updateRow(i, 'sku', e.target.value.toUpperCase())}
                placeholder="SKU-001"
                className="block w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-mono placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="col-span-2">
              {i === 0 && <label className="block text-xs text-zinc-400 mb-1">Unit</label>}
              <select
                value={row.unit}
                onChange={e => updateRow(i, 'unit', e.target.value)}
                className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              {i === 0 && <label className="block text-xs text-zinc-400 mb-1">Reorder at</label>}
              <input
                type="number"
                min="0"
                value={row.reorder_point}
                onChange={e => updateRow(i, 'reorder_point', e.target.value)}
                className="block w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className={`col-span-1 flex items-end ${i === 0 ? 'pt-5' : ''}`}>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {rows.length < 5 && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add another product
        </button>
      )}

      {loading && saved > 0 && (
        <p className="text-sm text-brand-600">Saved {saved} product{saved > 1 ? 's' : ''}…</p>
      )}
      {error && <ErrorBox message={error} />}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : 'Save products & continue'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Skip
        </button>
      </div>
    </form>
  )
}

// ── Step 3: All set ───────────────────────────────────────────────────
function Step3({ locationName }: { locationName: string }) {
  const { organisationName } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="text-center space-y-5">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-900">You're all set!</h2>
        <p className="mt-1 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700">{organisationName}</span> is ready to go.
          Your first location — <span className="font-medium text-zinc-700">{locationName}</span> — is configured.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50 divide-y divide-zinc-100 text-left">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600 text-sm">📊</div>
          <div>
            <p className="text-sm font-medium text-zinc-800">Open your dashboard</p>
            <p className="text-xs text-zinc-500">View real-time stock levels</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="ml-auto rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Go to dashboard
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 text-sm">📨</div>
          <div>
            <p className="text-sm font-medium text-zinc-800">Invite a team member</p>
            <p className="text-xs text-zinc-500">Coming in a future update</p>
          </div>
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Soon</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        Go to dashboard
      </button>
      <p className="text-xs text-zinc-400">You can always add more locations and products from the dashboard.</p>
    </div>
  )
}

// ── Error box ─────────────────────────────────────────────────────────
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5">
      <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

// ── Main Onboarding page ──────────────────────────────────────────────
export default function Onboarding() {
  const { organisationName } = useAuth()
  const [step, setStep]       = useState(1)
  const [location, setLocation] = useState<Location | null>(null)

  const TITLES: Record<number, { heading: string; sub: string }> = {
    1: {
      heading: 'Add your first location',
      sub: 'A location is a store, site, kitchen or warehouse where you hold stock.',
    },
    2: {
      heading: 'Add your first products',
      sub: 'Add up to 5 products now. You can import more from the dashboard.',
    },
    3: {
      heading: 'Setup complete',
      sub: '',
    },
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-[560px]">

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-8 shadow-login border border-zinc-200">

          {/* Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white tracking-tight shadow-sm">
              SS
            </div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">{organisationName}</p>
            <h1 className="text-xl font-semibold text-zinc-900">{TITLES[step].heading}</h1>
            {TITLES[step].sub && (
              <p className="mt-1 text-sm text-zinc-500 max-w-sm">{TITLES[step].sub}</p>
            )}
          </div>

          <StepIndicator current={step} />

          {step === 1 && (
            <Step1
              onDone={(loc) => {
                setLocation(loc)
                setStep(2)
              }}
            />
          )}

          {step === 2 && location && (
            <Step2
              location={location}
              onDone={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <Step3 locationName={location?.name ?? ''} />
          )}
        </div>

        {step < 3 && (
          <p className="mt-4 text-center text-sm text-zinc-400">
            Want to skip setup?{' '}
            <Link to="/" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
              Go to dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
