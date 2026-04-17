import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getProfile, updateProfile, updatePassword,
  getOrganisation, updateOrganisation,
  getTeam,
  getNotifications, updateNotifications,
} from '../api/client'
import type { UserProfile, OrgDetails, TeamMember, NotificationPrefs } from '../types'

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast { id: number; message: string; type: 'success' | 'error' }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur-sm transition-all ${
            t.type === 'success'
              ? 'border-green-800 bg-green-950/90 text-green-300'
              : 'border-red-800 bg-red-950/90 text-red-300'
          }`}
        >
          {t.type === 'success' ? (
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const add = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const remove = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), [])

  return { toasts, add, remove }
}

// ── Shared card wrapper ───────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/50 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors'
const inputReadOnlyCls = 'w-full rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed'

function SaveButton({ loading, label = 'Save changes' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode
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

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
        checked ? 'bg-brand-500' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Profile
// ══════════════════════════════════════════════════════════════════════════════

function ProfileSection({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const { updateProfile: updateAuthProfile } = useAuth()

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [saving, setSaving]     = useState(false)

  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [savingPw, setSavingPw]     = useState(false)

  useEffect(() => {
    getProfile().then(p => {
      setProfile(p)
      setName(p.name ?? '')
      setEmail(p.email)
    })
  }, [])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile({ name, email })
      updateAuthProfile(updated.name ?? '', updated.email)
      toast('Profile updated successfully.')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast('New passwords do not match.', 'error'); return }
    if (newPw.length < 8) { toast('Password must be at least 8 characters.', 'error'); return }
    setSavingPw(true)
    try {
      await updatePassword({ current_password: currentPw, new_password: newPw })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      toast('Password updated successfully.')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update password.', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  if (!profile) return <p className="text-sm text-zinc-500 py-6">Loading…</p>

  return (
    <div className="space-y-6">
      <SectionHeader title="Profile" description="Update your personal details and password." />

      <Card>
        <form onSubmit={handleProfileSave} className="divide-y divide-zinc-800">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Full name">
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email address">
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Role">
              <input className={inputReadOnlyCls} value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} readOnly />
            </Field>
            <Field label="Member since">
              <input className={inputReadOnlyCls} value={new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} readOnly />
            </Field>
          </div>
          <div className="flex justify-end px-5 py-3">
            <SaveButton loading={saving} />
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={handlePasswordSave} className="divide-y divide-zinc-800">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-sm font-medium text-white">Change password</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Must be at least 8 characters.</p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Field label="Current password">
              <input className={inputCls} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password">
              <input className={inputCls} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input className={inputCls} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
          <div className="flex justify-end px-5 py-3">
            <SaveButton loading={savingPw} label="Update password" />
          </div>
        </form>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — Organisation
// ══════════════════════════════════════════════════════════════════════════════

const BIZ_TYPES = [
  { value: 'retail',       label: 'Retail Chain' },
  { value: 'restaurant',   label: 'Restaurant' },
  { value: 'distribution', label: 'Distribution Centre' },
]

function OrganisationSection({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const { updateOrgName } = useAuth()
  const [org, setOrg]         = useState<OrgDetails | null>(null)
  const [name, setName]       = useState('')
  const [bizType, setBizType] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    getOrganisation().then(o => { setOrg(o); setName(o.name); setBizType(o.business_type) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await updateOrganisation({ name, business_type: bizType })
      setOrg(updated)
      updateOrgName(updated.name)
      toast('Organisation updated successfully.')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!org) return <p className="text-sm text-zinc-500 py-6">Loading…</p>

  return (
    <div className="space-y-6">
      <SectionHeader title="Organisation" description="Update your business name and type." />

      <Card>
        <form onSubmit={handleSave} className="divide-y divide-zinc-800">
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Business name">
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Your business name" />
            </Field>
            <Field label="Business type">
              <select className={inputCls} value={bizType} onChange={e => setBizType(e.target.value)}>
                {BIZ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end px-5 py-3">
            <SaveButton loading={saving} />
          </div>
        </form>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Subscription
// ══════════════════════════════════════════════════════════════════════════════

const PLANS: Record<string, {
  label: string; price: string; features: string[]
}> = {
  starter: {
    label: 'Starter',
    price: '£99 / month',
    features: [
      'Up to 3 locations',
      'Up to 500 products',
      'Core stock management',
      'Low-stock alerts',
      'Email support',
    ],
  },
  growth: {
    label: 'Growth',
    price: '£199 / month',
    features: [
      'Up to 15 locations',
      'Unlimited products',
      'Distribution module',
      'Purchase orders',
      'Priority support',
      'Weekly reports',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    price: '£499 / month',
    features: [
      'Unlimited locations',
      'Unlimited products',
      'All modules',
      'Advanced analytics',
      'Dedicated account manager',
      'SLA guarantee',
      'API access',
    ],
  },
}

function SubscriptionSection() {
  const [org, setOrg] = useState<OrgDetails | null>(null)

  useEffect(() => { getOrganisation().then(setOrg) }, [])

  if (!org) return <p className="text-sm text-zinc-500 py-6">Loading…</p>

  const plan = PLANS[org.subscription_plan] ?? PLANS.starter

  return (
    <div className="space-y-6">
      <SectionHeader title="Subscription" description="Your current plan and billing details." />

      <Card>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white">{plan.label}</span>
                {org.subscription_plan === 'starter' && (
                  <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-2 py-0.5 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                    Free Trial
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-zinc-400">{plan.price}</p>
            </div>
            <a
              href="mailto:sales@stocksensepro.com"
              className="shrink-0 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Upgrade plan
            </a>
          </div>

          <div className="mt-5 border-t border-zinc-800 pt-4">
            <p className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">What's included</p>
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                  <svg className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {org.subscription_plan !== 'enterprise' && (
        <p className="text-xs text-zinc-600">
          Need more?{' '}
          <a href="mailto:sales@stocksensepro.com" className="text-brand-400 hover:text-brand-300 underline underline-offset-2">
            Contact sales
          </a>{' '}
          to discuss enterprise pricing.
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Notifications
// ══════════════════════════════════════════════════════════════════════════════

const NOTIF_ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'low_stock_alerts',  label: 'Low stock email alerts',         description: 'Get notified when items fall below reorder point.' },
  { key: 'weekly_summary',    label: 'Weekly inventory summary email',  description: 'A digest of stock movements every Monday morning.' },
  { key: 'new_user_joined',   label: 'New user joined organisation',    description: 'Alert when someone new joins your team.' },
]

function NotificationsSection({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [prefs, setPrefs]   = useState<NotificationPrefs>({
    low_stock_alerts: true, weekly_summary: true, new_user_joined: true,
  })
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getNotifications().then(p => { setPrefs(p); setLoaded(true) })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateNotifications(prefs)
      toast('Notification preferences saved.')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <p className="text-sm text-zinc-500 py-6">Loading…</p>

  return (
    <div className="space-y-6">
      <SectionHeader title="Notifications" description="Choose which emails you want to receive." />

      <Card>
        <div className="divide-y divide-zinc-800">
          {NOTIF_ITEMS.map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
              </div>
              <Toggle
                checked={prefs[item.key]}
                onChange={v => setPrefs(p => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-zinc-800 px-5 py-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save preferences'}
          </button>
        </div>
      </Card>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — Team
// ══════════════════════════════════════════════════════════════════════════════

function TeamSection({ toast }: { toast: (msg: string, type?: 'success' | 'error') => void }) {
  const [team, setTeam]         = useState<TeamMember[]>([])
  const [loading, setLoading]   = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    getTeam().then(t => { setTeam(t); setLoading(false) })
  }, [])

  return (
    <div className="space-y-6">
      <SectionHeader title="Team" description="Everyone with access to your organisation." />

      <div className="flex justify-end">
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
        >
          + Invite team member
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="px-5 py-6 text-sm text-zinc-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Name', 'Email', 'Role', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {team.map(m => (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-zinc-200">{m.name ?? <span className="text-zinc-600">—</span>}</td>
                  <td className="px-5 py-3 text-zinc-400">{m.email}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-700/60 text-zinc-300 capitalize">
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSent={() => { setShowInvite(false); toast('Invite sent! (Email delivery coming soon.)') }}
        />
      )}
    </div>
  )
}

function InviteModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState('viewer')
  const [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Email invites not yet implemented — show success toast as per spec
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    onSent()
  }

  return (
    <Modal title="Invite team member" onClose={onClose}>
      <form onSubmit={handleSend} className="space-y-4">
        <p className="rounded-lg border border-amber-800/50 bg-amber-900/20 px-3 py-2 text-xs text-amber-400">
          Email invites are coming soon. This will log the invite for now.
        </p>

        <Field label="Email address">
          <input
            className={inputCls} type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="colleague@example.com"
          />
        </Field>

        <Field label="Role">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer</option>
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — Danger Zone
// ══════════════════════════════════════════════════════════════════════════════

function DangerSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-6">
      <SectionHeader title="Danger Zone" description="Irreversible actions for your organisation." />

      <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-400">Delete organisation</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Permanently delete your organisation, all locations, products, stock data, and team members.
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 rounded-lg border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors"
          >
            Delete organisation
          </button>
        </div>
      </div>

      {showModal && <DeleteOrgModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function DeleteOrgModal({ onClose }: { onClose: () => void }) {
  const { organisationName } = useAuth()
  const [input, setInput] = useState('')
  const matches = input.trim().toLowerCase() === (organisationName ?? '').trim().toLowerCase()

  return (
    <Modal title="Delete organisation" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-800/50 bg-amber-900/20 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">To delete your account, contact support</p>
          <p className="mt-1 text-xs text-zinc-400">
            For security, account deletion is handled by our support team.
            Email{' '}
            <a href="mailto:support@stocksensepro.com" className="text-brand-400 underline underline-offset-2">
              support@stocksensepro.com
            </a>{' '}
            and we'll process your request within 2 business days.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Type <span className="font-semibold text-white">{organisationName}</span> to confirm
          </label>
          <input
            className={inputCls}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your business name…"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button
            disabled={!matches}
            onClick={() => window.location.href = 'mailto:support@stocksensepro.com?subject=Account%20Deletion%20Request'}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Contact support to delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INNER NAV + PAGE SHELL
// ══════════════════════════════════════════════════════════════════════════════

const SECTIONS = [
  { id: 'profile',       label: 'Profile',       icon: '👤' },
  { id: 'organisation',  label: 'Organisation',  icon: '🏢' },
  { id: 'subscription',  label: 'Subscription',  icon: '💳' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'team',          label: 'Team',          icon: '👥' },
  { id: 'danger',        label: 'Danger Zone',   icon: '⚠️' },
] as const

type SectionId = typeof SECTIONS[number]['id']

export default function Settings() {
  const [active, setActive] = useState<SectionId>('profile')
  const { toasts, add: addToast, remove: removeToast } = useToasts()

  function scrollTo(id: SectionId) {
    setActive(id)
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex min-h-full bg-zinc-950">
      {/* Inner left nav */}
      <aside className="sticky top-0 h-screen w-52 shrink-0 border-r border-zinc-800 bg-zinc-950 px-3 py-6 hidden md:block">
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Settings</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${
                active === s.id
                  ? 'bg-zinc-800 text-white'
                  : s.id === 'danger'
                    ? 'text-red-500/70 hover:bg-red-900/20 hover:text-red-400'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
              }`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-16 px-6 py-8">
          <section id="section-profile">
            <ProfileSection toast={addToast} />
          </section>

          <div className="h-px bg-zinc-800/60" />

          <section id="section-organisation">
            <OrganisationSection toast={addToast} />
          </section>

          <div className="h-px bg-zinc-800/60" />

          <section id="section-subscription">
            <SubscriptionSection />
          </section>

          <div className="h-px bg-zinc-800/60" />

          <section id="section-notifications">
            <NotificationsSection toast={addToast} />
          </section>

          <div className="h-px bg-zinc-800/60" />

          <section id="section-team">
            <TeamSection toast={addToast} />
          </section>

          <div className="h-px bg-zinc-800/60" />

          <section id="section-danger">
            <DangerSection />
          </section>
        </div>
      </main>

      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  )
}
