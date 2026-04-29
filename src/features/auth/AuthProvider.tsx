import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '../../types/auth'
import { tokenStorage } from '../../lib/storage'
import * as authApi from '../../api/auth'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  setToken: (token: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    tokenStorage.get(),
  )

  const { data, isFetching, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  })

  const setToken = (next: string | null) => {
    setTokenState(next)
    if (next) {
      tokenStorage.set(next)
    } else {
      tokenStorage.clear()
    }
  }

  useEffect(() => {
    if (isError) {
      setToken(null)
    }
  }, [isError])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user: data?.data ?? null,
      isLoading: isFetching && Boolean(token),
      setToken,
      logout: () => setToken(null),
    }),
    [token, data, isFetching],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
