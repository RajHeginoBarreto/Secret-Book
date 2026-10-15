export type Role = 'READER' | 'ADMIN'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  /** Atualiza os dados do usuário na tela (ex.: depois de mudar o nome). */
  updateUser: (user: User) => void
}

/** Regra de senha do backend, repetida aqui só para avisar antes de enviar. */
export function passwordProblem(password: string): string | undefined {
  if (password.length < 8 || password.length > 64) return 'A senha deve ter entre 8 e 64 caracteres.'
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'A senha deve ter letras e números.'
  return undefined
}

/** Só aceita destinos internos ("/minha-conta"), nunca outro site. */
export function safeRedirect(target: string | null, fallback = '/minha-conta'): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : fallback
}
