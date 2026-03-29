import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { getGreeting, formatDate } from '@/lib/format'

export function AppLayout() {
  const today = new Date().toISOString()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <h1 className="text-lg font-semibold text-foreground">
            {getGreeting()}, Miglena
          </h1>
          <span className="text-sm text-muted-foreground">{formatDate(today)}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
