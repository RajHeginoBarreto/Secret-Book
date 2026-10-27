export type Role = 'READER' | 'ADMIN'

export interface User {
  id: number
  name: string
  username: string
  /** Só contas antigas (ou o admin) têm e-mail; contas novas pedem apenas nome de usuário e senha. */
  email: string | null
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
  login: (username: string, password: string) => Promise<User>
  register: (username: string, password: string, acceptPrivacy: boolean) => Promise<User>
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

/** Regra de nome de usuário do backend (3 a 40 caracteres), repetida aqui só para avisar antes de enviar. */
export function usernameProblem(username: string): string | undefined {
  const value = username.trim().replace(/\s+/g, ' ')
  if (value.length < 3 || value.length > 40) return 'O nome de usuário deve ter de 3 a 40 caracteres.'
  if (!/^[\p{L}\p{N}](?:[\p{L}\p{N} ._-]*[\p{L}\p{N}])?$/u.test(value)) {
    return 'Use letras, números, espaço, ponto, _ ou -, começando e terminando com letra ou número.'
  }
  return undefined
}

/** Só aceita destinos internos ("/minha-conta"), nunca outro site. */
export function safeRedirect(target: string | null, fallback = '/minha-conta'): string {
  return target && target.startsWith('/') && !target.startsWith('//') ? target : fallback
}
