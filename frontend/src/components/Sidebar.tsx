import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function IconDashboard() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconRestaurant() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v6m0 0c-2 0-4 1.5-4 4v10h8V12c0-2.5-2-4-4-4zm-6 0v4a2 2 0 004 0V2M18 2v18" />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h11v12H1zm11 4h4l3 4v4h-7V5z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

const navItems = [
  { to: '/',            label: 'Dashboard',    icon: <IconDashboard />,  exact: true  },
  { to: '/restaurant',  label: 'Restaurant',   icon: <IconRestaurant />, exact: false },
  { to: '/distribution',label: 'Distribution', icon: <IconTruck />,      exact: false, disabled: true },
  { to: '/settings',    label: 'Settings',     icon: <IconSettings />,   exact: false, disabled: true },
]

interface Props {
  onClose?: () => void
}

export default function Sidebar({ onClose }: Props) {
  const { userEmail, signOut } = useAuth()

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="flex h-full flex-col bg-navy-900">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-navy-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">StockSense</p>
          <p className="text-xs font-medium text-brand-400 leading-none mt-0.5">Pro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-navy-700">
          Navigation
        </p>
        {navItems.map((item) =>
          item.disabled ? (
            <div
              key={item.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-not-allowed"
              title="Coming soon"
            >
              <span className="text-navy-700">{item.icon}</span>
              <span className="text-sm font-medium text-navy-700">{item.label}</span>
              <span className="ml-auto rounded-full bg-navy-800 px-2 py-0.5 text-xs text-navy-700">
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
                `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      {/* User profile */}
      <div className="border-t border-navy-800 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userEmail ?? 'User'}</p>
            <p className="text-xs text-navy-700">Administrator</p>
          </div>
          <button
            onClick={signOut}
            className="text-slate-500 hover:text-white transition-colors duration-150"
            title="Sign out"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </div>
  )
}
