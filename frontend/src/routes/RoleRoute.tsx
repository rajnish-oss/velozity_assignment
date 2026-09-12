import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'

// Wrap a route element to restrict it to a set of roles.
// Developers are redirected home if they try to hit an admin/PM-only route.
export default function RoleRoute({ allow, children }) {
  const user = useAppSelector((s) => s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/" replace />
  return children
}

// @ts-nocheck
