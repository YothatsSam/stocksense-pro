import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/client'
import { useAuth } from '../context/AuthContext'

type BusinessType = 'retail' | 'restaurant' | 'distribution'

const passwordRules = [
  { label: 'At least 8 characters',          test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',      test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number (0–9)',                test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const BUSINESS_TYPES: { value: BusinessType; label: string; emoji: string }[] = [
  { value: 'retail',       label: 'Retail Chain',         emoji: '🛒' },
  { value: 'restaurant',   label: 'Restaurant / Food',    emoji: '🍽️' },
  { value: 'distribution', label: 'Distribution Centre',  emoji: '🏭' },
]

export default function Signup() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    business_name: '',
    business_type: '' as BusinessType | '',
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.business_type) {
      return setError('Please select your business type.')
    }
    if (form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    if (!/[A-Z]/.test(form.password)) {
      return setError('Password must contain at least one uppercase letter.')
    }
    if (!/[0-9]/.test(form.password)) {
      return setError('Password must contain at least one number.')
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      return setError('Password must contain at least one special character (e.g. !@#$%).')
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const data = await register({
        business_name: form.business_name,
        business_type: form.business_type as BusinessType,
        name: form.name,
        email: form.email,
        password: form.password,
      })
      signIn({
        token: data.token,
        email: data.email,
        name: data.name,
        organisationId: data.organisationId,
        businessType: data.businessType,
        organisationName: data.organisationName,
      })
      navigate('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-[480px]">

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-8 shadow-login border border-zinc-200">

          {/* Header */}
          <div className="mb-7 flex flex-col items-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white tracking-tight shadow-sm">
              SS
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-500">30-day free trial · No credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Business name */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                Business name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={form.business_name}
                onChange={set('business_name')}
                placeholder="FreshMart Ltd"
                className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Business type */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                Business type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BUSINESS_TYPES.map(bt => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, business_type: bt.value }))}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center text-xs font-medium transition-all duration-150 ${
                      form.business_type === bt.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                        : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-lg">{bt.emoji}</span>
                    {bt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-column row: name + email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Jane Smith"
                  className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="jane@company.com"
                  className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Create a strong password"
                  className="block w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Live password rules */}
              {form.password.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordRules.map(rule => {
                    const passed = rule.test(form.password)
                    return (
                      <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-zinc-400'}`}>
                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          {passed
                            ? <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          }
                        </svg>
                        {rule.label}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirm}
                  onChange={set('confirm')}
                  placeholder="Repeat password"
                  className={`block w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm placeholder-zinc-400 transition-colors duration-150 focus:outline-none focus:ring-2 ${
                    form.confirm && form.confirm !== form.password
                      ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-zinc-200 bg-white text-zinc-900 focus:border-brand-500 focus:ring-brand-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-600"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Start Free Trial'}
            </button>

            {/* Legal note */}
            <p className="text-center text-xs text-zinc-400">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
