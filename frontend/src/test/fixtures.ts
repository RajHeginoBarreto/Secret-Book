import type { Page } from '../api/client'
import type { User } from '../features/auth/authTypes'
import type { BookDetail, BookSummary } from '../features/catalog/catalogTypes'

/** Dados de exemplo compartilhados pelos testes (livros e autores fictícios, como no catálogo). */

export const READER: User = {
  id: 1,
  name: 'leitora noturna',
  username: 'leitora noturna',
  email: null,
  role: 'READER',
  createdAt: '2026-10-01T12:00:00Z',
}

export const ADMIN: User = {
  id: 99,
  name: 'equipe',
  username: 'equipe',
  email: 'equipe@secretbook.test',
  role: 'ADMIN',
  createdAt: '2026-01-01T12:00:00Z',
}

export function makeBook(overrides: Partial<BookSummary> = {}): BookSummary {
  return {
    slug: 'a-ilha',
    title: 'A Ilha das Cartas',
    authors: [{ slug: 'ana-autora', name: 'Ana Autora' }],
    genres: [{ slug: 'misterio', name: 'Mistério' }],
    pages: 300,
    length: 'MEDIUM',
    pace: 'MODERATE',
    tone: 'DARK',
    publicationYear: 2020,
    coverColor: '#333333',
    ...overrides,
  }
}

export function makeBookDetail(overrides: Partial<BookDetail> = {}): BookDetail {
  return {
    ...makeBook(),
    synopsis: 'Cartas sem remetente chegam a uma ilha onde ninguém recebe correspondência.',
    contentNotes: ['VIOLENCE'],
    clues: ['ilha isolada', 'cartas antigas', 'farol apagado'],
    ...overrides,
  }
}

/** Página no formato da API (page começa em 0). */
export function pageOf<T>(content: T[], options: { page?: number; size?: number; totalPages?: number; totalElements?: number } = {}): Page<T> {
  return {
    content,
    page: options.page ?? 0,
    size: options.size ?? 12,
    totalPages: options.totalPages ?? 1,
    totalElements: options.totalElements ?? content.length,
  }
}

/** Parâmetros da query string de uma URL relativa pedida pela aplicação. */
export function searchOf(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] ?? '')
}
