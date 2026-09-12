import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { useAppSelector } from '../../app/hooks'
import { ROLES } from '../../utils/constants'

const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/', label: 'Dashboard', icon: HomeIcon },
    { to: '/projects', label: 'All Projects', icon: FolderIcon },
    { to: '/tasks', label: 'All Tasks', icon: TaskIcon },
  ],
  [ROLES.PM]: [
    { to: '/', label: 'Dashboard', icon: HomeIcon },
    { to: '/projects', label: 'My Projects', icon: FolderIcon },
    { to: '/tasks', label: 'Tasks', icon: TaskIcon },
  ],
  [ROLES.DEVELOPER]: [
    { to: '/', label: 'My Focus', icon: HomeIcon },
    { to: '/tasks', label: 'My Tasks', icon: TaskIcon },
  ],
}

export default function Sidebar() {
  const user = useAppSelector((s) => s.auth.user)
  const items = NAV_ITEMS[user?.role] || []

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-ink-800 text-white/90 md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-sm font-bold text-ink-900">F</div>
        <span className="text-sm font-semibold tracking-tight">Basecamp Flow</span>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 py-4">
        <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">Workspace</p>
        <ul className="space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-white/10 font-medium text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[11px] text-white/40">Signed in as</p>
        <p className="truncate text-sm font-medium text-white/90">{user?.name}</p>
      </div>
    </aside>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function FolderIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 7a1 1 0 0 1 1-1h4.5l2 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TaskIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8.5 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// @ts-nocheck
