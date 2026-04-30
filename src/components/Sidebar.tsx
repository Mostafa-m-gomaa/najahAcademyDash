import { NavLink } from 'react-router-dom'
import LogoMark from './LogoMark'
import { useAuth } from '../features/auth/AuthProvider'

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  const navItems =
    role === 'student'
      ? [
          { label: 'Overview', to: '/' },
          { label: 'My essay', to: '/learn/courses' },
          { label: 'Notifications', to: '/notifications' },
        ]
      : [
          { label: 'Overview', to: '/' },
          { label: 'Users', to: '/users' },
          { label: 'Students', to: '/students' },
          { label: 'Courses', to: '/courses' },
          { label: 'Topics', to: '/topics' },
          { label: 'Essay questions', to: '/essay-questions' },
          { label: 'Essay answers', to: '/essay-answers' },
          { label: 'Notifications', to: '/notifications' },
        ]

  return (
    <aside className="sidebar">
      <div className="brand">
        <LogoMark />
        <div>
          <p className="brand-title">Najah</p>
          <p className="brand-subtitle">Academy Ops</p>
        </div>
      </div>
      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-link active' : 'nav-link'
            }
            end={item.to === '/'}
          >
            <span className="nav-dot"></span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p className="muted">API: Local</p>
        <p className="muted">v1 Dashboard</p>
      </div>
    </aside>
  )
}
