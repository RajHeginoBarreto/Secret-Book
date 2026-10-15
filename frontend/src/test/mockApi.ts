import { vi } from 'vitest'

export interface MockRequest {
  method: string
  /** Caminho com query string, como a aplicação pediu (ex.: "/api/books?genre=romance"). */
  url: string
  body: unknown
  headers: Record<string, string>
}

export interface MockResponse {
  status?: number
  body?: unknown
}

type Handler = (request: MockRequest) => MockResponse | Promise<MockResponse>
type RouteValue = Handler | MockResponse

/**
 * Simula a API nos testes. As chaves são "MÉTODO caminho": "GET /api/genres".
 * Uma chave sem "?" vale para o caminho com qualquer query string; com "?", precisa bater exatamente.
 * O valor é a resposta ({ status, body }) ou uma função que recebe a requisição e devolve a resposta.
 */
export function mockApi(routes: Record<string, RouteValue>) {
  const requests: MockRequest[] = []

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined
    const headers = (init?.headers ?? {}) as Record<string, string>
    const request: MockRequest = { method, url, body, headers }
    requests.push(request)

    const path = url.split('?')[0]
    const route = routes[`${method} ${url}`] ?? routes[`${method} ${path}`]
    if (!route) {
      return jsonResponse(404, { title: 'Recurso não encontrado', detail: `Sem mock para ${method} ${url}` })
    }
    const response = typeof route === 'function' ? await route(request) : route
    return jsonResponse(response.status ?? 200, response.body)
  })

  vi.stubGlobal('fetch', fetchMock)
  return { requests, fetchMock }
}

function jsonResponse(status: number, body: unknown): Response {
  if (status === 204 || body === undefined) return new Response(null, { status })
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })
}

/** Erro no formato Problem Details, como o backend devolve. */
export function problem(status: number, detail: string, errors?: { field: string; message: string }[]): MockResponse {
  return { status, body: { status, title: 'Erro', detail, errors } }
}
