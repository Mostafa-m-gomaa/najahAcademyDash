import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="page loading">Loading session...</div>
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
