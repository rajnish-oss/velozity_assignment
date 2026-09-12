import { useAppSelector } from '../../app/hooks'

export default function Avatar({ userId, size = 'md', ring = false }) {
  const user = useAppSelector((s) => s.users.items.find((item) => item.id === userId))
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' }
  const initials = user?.name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  if (!user) {
    return <div className={`${sizes[size]} rounded-full bg-ink-500 flex items-center justify-center text-white font-semibold`}>?</div>
  }
  return (
    <div
      title={user.name}
      className={`${sizes[size]} shrink-0 rounded-md flex items-center justify-center text-white font-semibold ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ backgroundColor: '#64748b' }}
    >
      {initials}
    </div>
  )
}

// @ts-nocheck
