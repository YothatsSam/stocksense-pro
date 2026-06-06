import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="bg-white text-zinc-900 antialiased">

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm">
              SS
            </div>
            <span className={`text-sm font-semibold transition-colors duration-300 ${scrolled ? 'text-zinc-900' : 'text-white'}`}>
              StockSense Pro
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={`text-sm transition-colors duration-300 ${scrolled ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-300 hover:text-white'}`}>
              Features
            </a>
            <a href="#how-it-works" className={`text-sm transition-colors duration-300 ${scrolled ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-300 hover:text-white'}`}>
              How it works
            </a>
            <a href="#pricing" className={`text-sm transition-colors duration-300 ${scrolled ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-300 hover:text-white'}`}>
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`text-sm font-medium transition-colors duration-300 ${scrolled ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-300 hover:text-white'}`}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-zinc-950 flex items-center overflow-hidden pt-20">

        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-blue-600/20 blur-[140px]" />
          <div className="absolute top-1/3 left-1/4 h-[400px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24 w-full">
          <div className="flex flex-col items-center text-center">

            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              <span className="text-xs font-medium text-zinc-300">Real-time inventory tracking — now live</span>
            </div>

            <h1 className="mb-6 max-w-4xl text-5xl font-bold tracking-tight text-white leading-[1.08] md:text-6xl lg:text-7xl">
              Inventory intelligence{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                for modern businesses
              </span>
            </h1>

            <p className="mb-10 max-w-xl text-lg text-zinc-400 leading-relaxed">
              One dashboard for retail chains, restaurants, and distribution centres.
              Track stock in real-time, get low-stock alerts, and manage orders — without the spreadsheets.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all duration-150 hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                Start for free
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-7 py-3.5 text-sm font-semibold text-zinc-300 backdrop-blur-sm hover:bg-zinc-800 hover:text-white transition-colors duration-150"
              >
                See features
              </a>
            </div>

            <p className="mt-4 text-xs text-zinc-600">No credit card required · Free forever plan available</p>

            {/* Dashboard mockup */}
            <div className="mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)]">
              {/* Browser bar */}
              <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <div className="mx-auto flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-[11px] text-zinc-500">stocksensepro.netlify.app/dashboard</span>
                </div>
              </div>

              {/* App layout */}
              <div className="flex h-80">
                {/* Sidebar */}
                <div className="w-48 shrink-0 border-r border-zinc-800 bg-[#111111] px-3 py-4">
                  <div className="mb-4 flex items-center gap-2 px-2">
                    <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white">SS</div>
                    <div className="h-2 w-20 rounded bg-zinc-700" />
                  </div>
                  <div className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-widest text-zinc-700">Workspace</div>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'Restaurant', active: false },
                    { label: 'Distribution', active: false },
                    { label: 'Catalogue', active: false },
                    { label: 'Settings', active: false },
                  ].map(item => (
                    <div key={item.label} className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 ${item.active ? 'bg-zinc-800' : ''}`}>
                      <div className={`h-1.5 w-1.5 rounded-sm ${item.active ? 'bg-blue-400' : 'bg-zinc-700'}`} />
                      <div className={`h-2 rounded ${item.active ? 'w-16 bg-zinc-300' : 'w-14 bg-zinc-700'}`} />
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-hidden bg-zinc-900 p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="mb-1.5 h-3.5 w-24 rounded bg-zinc-600" />
                      <div className="h-2 w-48 rounded bg-zinc-800" />
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-zinc-800 border border-zinc-700" />
                  </div>

                  {/* Metric cards */}
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total SKUs', val: '124', color: 'text-white' },
                      { label: 'Locations', val: '6', color: 'text-white' },
                      { label: 'Low Stock Alerts', val: '3', color: 'text-red-400' },
                    ].map(card => (
                      <div key={card.label} className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-3">
                        <div className="mb-2 h-1.5 w-16 rounded bg-zinc-700" />
                        <div className={`text-xl font-bold ${card.color}`}>{card.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-3">
                      <div className="mb-3 h-2 w-28 rounded bg-zinc-700" />
                      <div className="flex items-end gap-1.5 h-12">
                        {[55, 70, 40, 85, 65, 90, 50, 75, 60, 80].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm bg-blue-500/70 transition-all"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 p-3">
                      <div className="mb-3 h-2 w-20 rounded bg-zinc-700" />
                      <div className="space-y-2">
                        {[['Warehouse A', 90], ['Store B', 62], ['Store C', 44]].map(([name, pct]) => (
                          <div key={name}>
                            <div className="mb-1 flex justify-between">
                              <div className="h-1.5 w-14 rounded bg-zinc-700" />
                              <div className="h-1.5 w-5 rounded bg-zinc-700" />
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-700">
                              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-100 bg-zinc-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: '3',         label: 'Business verticals supported' },
              { value: '99.9%',     label: 'Platform uptime' },
              { value: 'Real-time', label: 'Stock level updates' },
              { value: 'Free',      label: 'To get started' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-zinc-900 md:text-3xl">{stat.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">Features</p>
            <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">Built for your business type</h2>
            <p className="mt-4 max-w-xl mx-auto text-base text-zinc-500">
              Whether you run a retail chain, restaurant, or distribution centre — StockSense Pro fits your workflow out of the box.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: '📦',
                title: 'Retail Chain',
                description: 'Track stock across every store location in real time.',
                bgCard: 'bg-blue-50 border-blue-100',
                bgIcon: 'bg-blue-100',
                checkColor: 'text-blue-600',
                points: [
                  'Multi-location stock tracking',
                  'Low stock alerts by SKU',
                  'Full inventory adjustment audit trail',
                  'Product catalogue management',
                ],
              },
              {
                emoji: '🍽️',
                title: 'Restaurant',
                description: 'Manage ingredients, recipes, and wastage with ease.',
                bgCard: 'bg-orange-50 border-orange-100',
                bgIcon: 'bg-orange-100',
                checkColor: 'text-orange-500',
                points: [
                  'Ingredient-level inventory control',
                  'Recipe management & costing',
                  'Wastage and spoilage tracking',
                  'Supplier reorder automation',
                ],
              },
              {
                emoji: '🏭',
                title: 'Distribution Centre',
                description: 'Streamline purchase orders, shipments, and suppliers.',
                bgCard: 'bg-violet-50 border-violet-100',
                bgIcon: 'bg-violet-100',
                checkColor: 'text-violet-600',
                points: [
                  'Purchase orders & receiving',
                  'Inbound & outbound shipments',
                  'Full supplier management',
                  'Real-time warehouse stock levels',
                ],
              },
            ].map(card => (
              <div key={card.title} className={`rounded-2xl border p-7 transition-shadow hover:shadow-lg ${card.bgCard}`}>
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${card.bgIcon}`}>
                  {card.emoji}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{card.title}</h3>
                <p className="mb-5 text-sm text-zinc-500">{card.description}</p>
                <ul className="space-y-2.5">
                  {card.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-zinc-700">
                      <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${card.checkColor}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-zinc-950 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-400">How it works</p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">Up and running in minutes</h2>
            <p className="mt-4 max-w-lg mx-auto text-base text-zinc-400">
              No complex setup. No consultants. Just accurate inventory data from day one.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up free in under a minute. Choose your business type — retail, restaurant, or distribution — and add your locations.',
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Add your inventory',
                desc: 'Import your products and set reorder thresholds. Link products to locations, suppliers, or recipes in just a few clicks.',
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Get real-time visibility',
                desc: 'Watch your dashboard populate with live stock data. Get alerted the moment anything runs low, and act instantly.',
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 2 && (
                  <div className="absolute top-5 left-full hidden w-full md:block">
                    <div className="mx-4 border-t border-dashed border-zinc-800" />
                  </div>
                )}
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-blue-400">
                  {item.icon}
                </div>
                <div className="mb-1 text-xs font-bold text-zinc-700 uppercase tracking-widest">{item.step}</div>
                <h3 className="mb-2 text-base font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
            <h2 className="text-3xl font-bold text-zinc-900 md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-base text-zinc-500">Start free. Upgrade when your business grows.</p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'forever',
                desc: 'Perfect for small businesses getting started with inventory tracking.',
                features: ['1 location', 'Up to 50 products', 'Basic stock tracking', 'Low stock email alerts', 'Dashboard & catalogue'],
                cta: 'Get started free',
                href: '/signup',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '£29',
                period: '/month',
                desc: 'For growing businesses managing multiple locations and teams.',
                features: ['Unlimited locations', 'Unlimited products', 'All 3 business types', 'Purchase orders & shipments', 'Real-time alerts', 'Priority support'],
                cta: 'Start free trial',
                href: '/signup',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'contact us',
                desc: 'For large operations needing custom integrations and SLAs.',
                features: ['Everything in Pro', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'Bespoke onboarding'],
                cta: 'Contact sales',
                href: '/signup',
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  plan.highlight
                    ? 'border-blue-500 bg-blue-600 text-white shadow-2xl shadow-blue-500/25 scale-[1.02]'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${plan.highlight ? 'text-blue-200' : 'text-zinc-400'}`}>
                    {plan.name}
                  </p>
                  <div className="mb-1 flex items-end gap-1">
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-zinc-900'}`}>{plan.price}</span>
                    <span className={`pb-1 text-sm ${plan.highlight ? 'text-blue-200' : 'text-zinc-400'}`}>{plan.period}</span>
                  </div>
                  <p className={`mb-6 text-sm leading-relaxed ${plan.highlight ? 'text-blue-100' : 'text-zinc-500'}`}>{plan.desc}</p>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckIcon className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-green-500'}`} />
                      <span className={plan.highlight ? 'text-white' : 'text-zinc-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150 ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-md'
                      : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="relative bg-zinc-950 py-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-blue-600/15 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl leading-tight">
            Ready to ditch the spreadsheets?
          </h2>
          <p className="mb-10 text-lg text-zinc-400 leading-relaxed">
            Join businesses that have switched to real-time inventory intelligence. Set up takes less than 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all hover:scale-[1.02]"
            >
              Get started for free
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
          <p className="mt-5 text-xs text-zinc-600">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 bg-zinc-950 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white">SS</div>
            <span className="text-sm font-semibold text-zinc-400">StockSense Pro</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">Inventory intelligence for modern businesses</span>
          </div>
          <p className="text-xs text-zinc-700">© 2026 StockSense Pro. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/login"  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Sign in</Link>
            <Link to="/signup" className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
