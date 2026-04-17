import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',    emoji: '📦', exact: true,  disabled: false },
  { to: '/restaurant',   label: 'Restaurant',   emoji: '🍽️', exact: false, disabled: false },
  { to: '/distribution', label: 'Distribution', emoji: '🏭', exact: false, disabled: false },
  { to: '/catalogue',    label: 'Catalogue',    emoji: '🗂️', exact: false, disabled: false },
  { to: '/settings',     label: 'Settings',     emoji: '⚙️', exact: false, disabled: false },
]

interface Props {
  onClose?: () => void
}

export default function Sidebar({ onClose }: Props) {
  const { userEmail, signOut } = useAuth()
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'SS'

  return (
    <div className="flex h-full flex-col bg-sidebar select-none">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white tracking-tight">
          SS
        </div>
        <span className="text-sm font-semibold text-white">StockSense Pro</span>
      </div>

      {/* Top separator */}
      <div className="mx-4 h-px bg-zinc-800" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Workspace
        </p>
        {NAV_ITEMS.map((item) =>
          item.disabled ? (
            <div
              key={item.to}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-not-allowed"
            >
              <span className="text-sm leading-none opacity-30">{item.emoji}</span>
              <span className="flex-1 text-sm font-medium text-zinc-600">{item.label}</span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 bg-zinc-800">
                Soon
              </span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-white bg-zinc-800 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5 before:rounded-full before:bg-brand-500 before:content-[\'\']'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'
                }`
              }
            >
              <span className="text-sm leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* Bottom separator */}
      <div className="mx-4 h-px bg-zinc-800" />

      {/* User */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
            {initials}
          </div>
          <p className="flex-1 truncate text-xs text-zinc-400">{userEmail ?? 'User'}</p>
          <button
            onClick={signOut}
            title="Sign out"
            className="text-zinc-600 transition-colors duration-150 hover:text-zinc-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
