import { USERS } from '../../api/fixtures'

export default function Avatar({ userId, size = 'md', ring = false }) {
  const user = USERS[userId]
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' }
  if (!user) {
    return <div className={`${sizes[size]} rounded-full bg-ink-500 flex items-center justify-center text-white font-semibold`}>?</div>
  }
  return (
    <div
      title={user.name}
      className={`${sizes[size]} shrink-0 rounded-md flex items-center justify-center text-white font-semibold ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ backgroundColor: user.avatarColor }}
    >
      {user.initials}
    </div>
  )
}

// @ts-nocheck
