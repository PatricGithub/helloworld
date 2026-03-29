import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Client Base' },
  { to: '/follow-ups', icon: CalendarCheck, label: 'Follow-Ups' },
  { to: '/menu', icon: Settings, label: 'Menu' }
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">
          M
        </div>
        <span className="text-base font-semibold text-foreground">Architect CRM</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">Architect CRM v1.0</p>
      </div>
    </aside>
  )
}
