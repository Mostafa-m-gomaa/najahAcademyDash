import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '../../types/auth'
import { tokenStorage, userStorage } from '../../lib/storage'
import * as authApi from '../../api/auth'

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  isLoading: boolean
  setToken: (token: string | null) => void
  setUser: (user: AuthUser | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    tokenStorage.get(),
  )
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const stored = userStorage.get<AuthUser>()
    return stored ?? null
  })

  const { data, isFetching, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    const nextUser = data?.data ?? null
    if (!nextUser) return
    setUserState((prev) => {
      const merged = {
        ...(prev ?? {}),
        ...nextUser,
        role: nextUser.role ?? prev?.role,
      }
      userStorage.set(merged)
      return merged
    })
  }, [data])

  const setToken = (next: string | null) => {
    setTokenState(next)
    if (next) {
      tokenStorage.set(next)
    } else {
      tokenStorage.clear()
      setUserState(null)
      userStorage.clear()
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
      user,
      isLoading: isFetching && Boolean(token),
      setToken,
      setUser: (next) => {
        setUserState(next)
        if (next) {
          userStorage.set(next)
        } else {
          userStorage.clear()
        }
      },
      logout: () => setToken(null),
    }),
    [token, user, isFetching],
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
