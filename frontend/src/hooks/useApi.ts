import { useCallback, useEffect, useState } from 'react'
import { apiRequest, toApiError, type ApiError } from '../api/client'

interface State<T> {
  key: string | null
  path: string | null
  data?: T
  error?: ApiError
}

export interface ApiResource<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  /** Busca de novo (mantendo os dados atuais na tela enquanto carrega). */
  reload: () => void
  /** Substitui os dados localmente, por exemplo depois de uma alteração bem-sucedida. */
  setData: (data: T) => void
}

/**
 * Carrega um recurso GET da API. Passe null para não carregar nada (ex.: usuário ainda não logado).
 * Respostas que chegam depois de o caminho mudar são descartadas.
 */
export function useApi<T>(path: string | null): ApiResource<T> {
  const [version, setVersion] = useState(0)
  const key = path === null ? null : `${version}:${path}`
  const [state, setState] = useState<State<T>>({ key: null, path: null })

  useEffect(() => {
    if (path === null || key === null) return
    const controller = new AbortController()
    apiRequest<T>(path, { signal: controller.signal })
      .then((data) => setState({ key, path, data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ key, path, error: toApiError(error) })
      })
    return () => controller.abort()
  }, [path, key])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const setData = useCallback((data: T) => setState((current) => ({ ...current, data, error: undefined })), [])

  const samePath = state.path === path
  return {
    data: samePath ? state.data : undefined,
    error: state.key === key ? state.error : undefined,
    loading: path !== null && state.key !== key,
    reload,
    setData,
  }
}
