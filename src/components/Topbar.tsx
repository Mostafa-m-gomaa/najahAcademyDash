import { useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/users': 'Users',
  '/students': 'Students',
  '/courses': 'Courses',
  '/topics': 'Topics',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const title = titles[pathname] ?? 'Dashboard'

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Najah Academy</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="chip">Live data</div>
        <div className="user-chip">
          <div>
            <p className="user-name">{user?.fullName ?? 'Admin'}</p>
            <p className="muted">{user?.email ?? 'admin@najah.com'}</p>
          </div>
          <button className="button ghost" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
