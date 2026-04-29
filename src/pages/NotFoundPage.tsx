import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page center">
      <div className="card">
        <h2>Page not found</h2>
        <p className="muted">The page you requested does not exist.</p>
        <Link to="/" className="button primary">
          Back to overview
        </Link>
      </div>
    </div>
  )
}
