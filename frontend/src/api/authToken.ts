/**
 * Guarda o token de acesso da sessão no navegador.
 * O token não é segredo de longo prazo: expira e pode ser revogado no servidor (botão "Sair").
 */
const TOKEN_KEY = 'secretbook:auth-token'

const unauthorizedListeners = new Set<() => void>()

export function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Sem armazenamento: a sessão dura só enquanto a página estiver aberta.
  }
}

/** Avisa quem estiver ouvindo (o AuthProvider) que o servidor recusou o token atual. */
export function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener())
}

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}
