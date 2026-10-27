import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getAuthToken, onUnauthorized, setAuthToken } from '../../api/authToken'
import { ApiError, apiRequest } from '../../api/client'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, AuthResponse, AuthStatus, User } from './authTypes'

/** Mantém a sessão do usuário: lê o token salvo, confirma com a API e oferece login, cadastro e logout. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getAuthToken() ? 'loading' : 'anonymous'))

  useEffect(() => {
    if (!getAuthToken()) return
    const controller = new AbortController()
    apiRequest<User>('/api/auth/me', { signal: controller.signal })
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) setAuthToken(null)
        setStatus('anonymous')
      })
    return () => controller.abort()
  }, [])

  // O servidor recusou o token (sessão encerrada em outro lugar, expirada etc.): volta a ser visitante.
  useEffect(
    () =>
      onUnauthorized(() => {
        setAuthToken(null)
        setUser(null)
        setStatus('anonymous')
      }),
    [],
  )

  const startSession = useCallback((response: AuthResponse) => {
    setAuthToken(response.token)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const login = useCallback(
    async (username: string, password: string) =>
      startSession(await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: { username, password } })),
    [startSession],
  )

  const register = useCallback(
    async (username: string, password: string, acceptPrivacy: boolean) =>
      startSession(
        await apiRequest<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: { username, password, acceptPrivacy },
        }),
      ),
    [startSession],
  )

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } catch {
      // Mesmo se o servidor não responder, a sessão é encerrada neste navegador.
    }
    setAuthToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, updateUser: setUser }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
