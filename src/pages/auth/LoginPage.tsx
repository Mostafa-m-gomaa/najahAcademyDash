import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as authApi from '../../api/auth'
import { useAuth } from '../../features/auth/AuthProvider'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const token =
        data.token ?? data.data?.token ?? (data as { accessToken?: string })
          .accessToken
      if (!token) {
        setError('Login succeeded but token was not returned.')
        setToast({
          message: 'Login succeeded but token was not returned.',
          tone: 'error',
        })
        return
      }
      setToken(token)
      setToast({ message: 'Login successful.', tone: 'success' })
      const redirectTo = (location.state as { from?: Location })?.from
        ?.pathname
      navigate(redirectTo ?? '/', { replace: true })
    },
    onError: () => {
      const message = 'Unable to login. Please verify your credentials.'
      setError(message)
      setToast({ message, tone: 'error' })
    },
  })

  return (
    <>
      <div className="auth-shell">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="eyebrow">Welcome back</p>
          <h1>Najah Admin</h1>
          <p className="muted">Sign in to manage courses and users.</p>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              setError('')
              loginMutation.mutate({ email, password })
            }}
          >
            <label className="field">
              Email
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@najah.com"
                required
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {error ? <p className="error-text">{error}</p> : null}
            <button className="button primary" type="submit">
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </motion.div>
      </div>
      {toast ? (
        <div className={`toast ${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button
            className="button ghost"
            type="button"
            onClick={() => setToast(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </>
  )
}
