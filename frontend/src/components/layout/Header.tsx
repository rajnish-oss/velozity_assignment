import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { logoutUser } from '../../features/auth/authSlice'
import { ROLE_LABELS, ROLES } from '../../utils/constants'
import Avatar from '../common/Avatar'
import NotificationDropdown from './NotificationDropdown'

export default function Header() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const unreadCount = useAppSelector((s) => s.notifications.items.filter((n) => !n.read).length)
  const { onlineCount, connectionStatus } = useAppSelector((s) => s.presence)

  const [notifOpen, setNotifOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-700 ring-1 ring-line">
          {ROLE_LABELS[user?.role]}
        </span>
        <span
          className="hidden items-center gap-1.5 text-xs text-ink-500 sm:flex"
          title={connectionStatus === 'open' ? 'Live updates connected' : 'Connectingâ€¦'}
        >
          <span className={clsx('h-1.5 w-1.5 rounded-full', connectionStatus === 'open' ? 'bg-emerald-500' : 'bg-stone-300')} />
          {connectionStatus === 'open' ? 'Live' : 'Connecting'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user?.role === ROLES.ADMIN && (
          <div className="hidden items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-xs font-medium text-ink-700 ring-1 ring-line sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {onlineCount} online
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-md p-2 text-ink-600 hover:bg-canvas"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-ink-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-md p-1 hover:bg-canvas">
            <Avatar userId={user?.id} size="sm" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-xl">
              <div className="border-b border-line px-3 py-2">
                <p className="truncate text-sm font-medium text-ink-900">{user?.name}</p>
                <p className="truncate text-xs text-ink-500">{ROLE_LABELS[user?.role]}</p>
              </div>
              <button
                onClick={() => dispatch(logoutUser())}
                className="w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-canvas"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// @ts-nocheck
