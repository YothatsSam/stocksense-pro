import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'

interface Props {
  children: React.ReactNode
}

// Panel icon — shared between sidebar close button and floating open button
export function PanelIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v18" />
    </svg>
  )
}

export default function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)

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
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(v => !v)}
        />
      </aside>

      {/* Main — no top bar, content fills full height */}
      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">

        {/* Floating toggle — only visible when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            title="Open sidebar"
            className="fixed top-3 left-3 z-40 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1.5 text-zinc-500 dark:text-zinc-400 shadow-card transition-all duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <PanelIcon />
          </button>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
