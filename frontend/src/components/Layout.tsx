import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  // Default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)

  // Close sidebar when resizing down to mobile
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-60 transform transition-transform duration-200 ease-in-out lg:relative lg:z-auto lg:shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Top bar — always visible */}
        <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            title="Toggle sidebar"
            className="rounded-md p-1.5 text-zinc-500 dark:text-zinc-400 transition-colors duration-150 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {sidebarOpen ? (
              /* Panel open — left section highlighted */
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h1M5 10h1M5 13h1" strokeWidth={1.5} />
              </svg>
            ) : (
              /* Panel closed — no highlight */
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18" />
              </svg>
            )}
          </button>

          {/* Show app name on mobile when sidebar is closed */}
          {!sidebarOpen && (
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              StockSense Pro
            </span>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
