import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../features/auth/AuthProvider'
import * as notificationsApi from '../api/notifications'

const titles: Record<string, string> = {
  '/': 'Overview',
  '/users': 'Users',
  '/students': 'Students',
  '/courses': 'Courses',
  '/topics': 'Topics',
  '/exams': 'Exams',
  '/essay-questions': 'Essay questions',
  '/essay-answers': 'Essay answers',
  '/notifications': 'Notifications',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user, token, logout } = useAuth()

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.listNotifications,
    enabled: Boolean(token),
    refetchInterval: 30000,
  })

  const unreadCount =
    notificationsData?.data?.filter((item) => !item.isRead).length ?? 0

  const title = titles[pathname] ?? 'Dashboard'

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Najah Academy</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="chip">Live data</div>
        <Link className="button ghost" to="/notifications">
          Notifications{unreadCount ? ` (${unreadCount})` : ''}
        </Link>
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
