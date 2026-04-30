import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../../types/auth'
import { useAuth } from './AuthProvider'

export default function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[]
  children: React.ReactNode
}) {
  const { token, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="page loading">Loading session...</div>
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const role = user?.role
  if (!role || !roles.includes(role)) {
    return (
      <div className="page">
        <div className="card">
          <h2>Access denied</h2>
          <p className="muted">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

