import { getAuthToken, notifyUnauthorized } from './authToken'

export interface FieldViolation {
  field: string
  message: string
}

/** Erro devolvido pela API no formato Problem Details (RFC 9457), já com textos em português. */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly fieldErrors: FieldViolation[]

  constructor(status: number, title: string, detail: string, fieldErrors: FieldViolation[] = []) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.fieldErrors = fieldErrors
  }

  /** Mensagem do campo informado, se a API apontou erro nele. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors.find((violation) => violation.field === field)?.message
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: Method
  body?: unknown
  signal?: AbortSignal
}

/** Em desenvolvimento, o Vite encaminha /api para o backend (ver vite.config.ts). */
const API_BASE: string = import.meta.env.VITE_API_URL ?? ''

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(0, 'Sem conexão', 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.')
  }

  if (response.status === 401 && token) notifyUnauthorized()
  if (!response.ok) throw await readError(response)

  const text = response.status === 204 ? '' : await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { title?: string; detail?: string; errors?: FieldViolation[] }
    return new ApiError(
      response.status,
      body.title ?? 'Erro',
      body.detail ?? 'Não foi possível concluir a operação.',
      Array.isArray(body.errors) ? body.errors : [],
    )
  } catch {
    return new ApiError(response.status, 'Erro', 'Não foi possível concluir a operação. Tente de novo em instantes.')
  }
}

/** Converte qualquer falha em ApiError, para as telas lidarem com um único formato. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return new ApiError(0, 'Erro', 'Algo deu errado. Tente de novo em instantes.')
}

/** Monta "?a=1&b=2" ignorando valores vazios. */
export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
