import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../app/hooks'
import { LoadingBlock } from '../components/common/Spinner'

export default function ProtectedRoute({ children }) {
  const { user, bootstrapping } = useAppSelector((s) => s.auth)

  if (bootstrapping) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <LoadingBlock label="Restoring your session..." />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}

