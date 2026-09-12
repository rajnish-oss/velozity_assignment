import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { markAllRead, markOneRead } from '../../features/notifications/notificationsSlice'
import { relativeTime } from '../../utils/time'
import EmptyState from '../common/EmptyState'

export default function NotificationDropdown({ open, onClose }) {
  const ref = useRef(null)
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { items, status } = useAppSelector((s) => s.notifications)

  useEffect(() => {
    if (!open) return undefined
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="absolute right-0 top-11 z-40 w-96 overflow-hidden rounded-lg border border-line bg-white shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink-900">Notifications</h3>
        <button
          onClick={() => dispatch(markAllRead(user.id))}
          className="text-xs font-medium text-amber-600 hover:text-amber-700"
        >
          Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {status === 'loading' && <p className="px-4 py-6 text-sm text-ink-500">Loading...</p>}
        {status !== 'loading' && items.length === 0 && (
          <div className="px-4 py-6">
            <EmptyState title="You're all caught up" description="New notifications will show up here." />
          </div>
        )}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => dispatch(markOneRead({ userId: user.id, id: n.id }))}
            className={clsx(
              'flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-canvas',
              !n.read && 'bg-amber-50/60'
            )}
          >
            <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-amber-500')} />
            <span className="flex-1">
              <span className="block text-sm text-ink-900">{n.text}</span>
              <span className="mt-0.5 block text-xs text-ink-500">{relativeTime(n.at)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// @ts-nocheck
