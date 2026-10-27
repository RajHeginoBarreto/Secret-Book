import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setAuthToken } from '../../api/authToken'
import { mockApi } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'
import type { BookSummary } from '../catalog/catalogTypes'
import type { LibraryEntry } from './accountTypes'

const USER = {
  id: 1,
  name: 'leitora noturna',
  username: 'leitora noturna',
  email: null,
  role: 'READER',
  createdAt: '2026-10-01T12:00:00Z',
}

const BOOK: BookSummary = {
  slug: 'a-ilha',
  title: 'A Ilha das Cartas',
  authors: [{ slug: 'ana', name: 'Ana Autora' }],
  genres: [{ slug: 'misterio', name: 'Mistério' }],
  pages: 300,
  length: 'MEDIUM',
  pace: 'MODERATE',
  tone: 'DARK',
  publicationYear: 2020,
  coverColor: '#333333',
}

const READ_ENTRY: LibraryEntry = {
  book: BOOK,
  status: 'READ',
  favorite: true,
  updatedAt: '2026-10-02T12:00:00Z',
  rating: null,
  comment: null,
  reviewedAt: null,
}

describe('Cadastro e login (só nome e senha)', () => {
  it('exige o consentimento da LGPD e envia nome de usuário, senha e aceite', async () => {
    const { requests } = mockApi({
      'POST /api/auth/register': { status: 201, body: { token: 't', expiresAt: '2026-12-01T00:00:00Z', user: USER } },
      'GET /api/me/library': { body: [] },
      'GET /api/me/reader-profile': { body: { likedGenres: [], dislikedGenres: [], favoriteAuthors: [] } },
    })
    const { user, router } = renderRoute('/cadastro')
    expect(screen.queryByLabelText(/e-mail/i)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome de usuário'), 'leitora noturna')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirme a senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(screen.getByText(/aceite a política de privacidade/i)).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'POST')).toBe(false)

    await user.click(screen.getByRole('checkbox', { name: /li e aceito/i }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/minha-conta/leitor'))
    const register = requests.find((request) => request.url === '/api/auth/register')
    expect(register?.body).toEqual({ username: 'leitora noturna', password: 'segredo123', acceptPrivacy: true })
  })

  it('entra com nome de usuário e senha', async () => {
    const { requests } = mockApi({
      'POST /api/auth/login': { body: { token: 't', expiresAt: '2026-12-01T00:00:00Z', user: USER } },
    })
    const { user, router } = renderRoute('/entrar?voltar=/catalogo')
    await user.type(screen.getByLabelText('Nome de usuário'), 'leitora noturna')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/catalogo'))
    expect(requests.find((request) => request.url === '/api/auth/login')?.body).toEqual({
      username: 'leitora noturna',
      password: 'segredo123',
    })
  })
})

describe('Perfil de leitor', () => {
  it('mostra a estante e salva gêneros e autores', async () => {
    setAuthToken('t')
    const { requests } = mockApi({
      'GET /api/auth/me': { body: USER },
      'GET /api/me/library': { body: [READ_ENTRY] },
      'GET /api/me/reader-profile': { body: { likedGenres: ['Fantasia'], dislikedGenres: [], favoriteAuthors: [] } },
      'PUT /api/me/reader-profile': (request) => ({ body: request.body }),
    })
    const { user } = renderRoute('/minha-conta/leitor')

    expect(await screen.findByRole('heading', { name: 'leitora noturna', level: 2 })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: BOOK.title })).toBeInTheDocument()

    expect(await screen.findByRole('button', { name: 'Fantasia: gosto' })).toBeInTheDocument()
    // Terror: neutro → gosto → não gosto
    await user.click(screen.getByRole('button', { name: 'Terror: neutro' }))
    await user.click(screen.getByRole('button', { name: 'Terror: gosto' }))
    expect(screen.getByRole('button', { name: 'Terror: não gosto' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nome do autor'), 'Clarice Lispector')
    await user.click(screen.getByRole('button', { name: /adicionar autor/i }))
    await user.click(screen.getByRole('button', { name: 'Salvar preferências' }))

    expect(await screen.findByText(/preferências salvas/i)).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({
      likedGenres: ['Fantasia'],
      dislikedGenres: ['Terror'],
      favoriteAuthors: ['Clarice Lispector'],
    })
  })

  it('comenta um livro lido', async () => {
    setAuthToken('t')
    const { requests } = mockApi({
      'GET /api/auth/me': { body: USER },
      'GET /api/me/library': { body: [READ_ENTRY] },
      'GET /api/me/reader-profile': { body: { likedGenres: [], dislikedGenres: [], favoriteAuthors: [] } },
      'PUT /api/me/library/a-ilha/review': (request) => ({
        body: { ...READ_ENTRY, ...(request.body as object), reviewedAt: '2026-10-03T12:00:00Z' },
      }),
    })
    const { user } = renderRoute('/minha-conta/leitor')

    await user.click(await screen.findByRole('button', { name: /comentar este livro/i }))
    const form = screen.getByLabelText(/comentário sobre a ilha das cartas/i).closest('form')!
    await user.click(within(form).getByRole('button', { name: '4 de 5' }))
    await user.type(within(form).getByLabelText(/comentário sobre/i), 'Li em dois dias!')
    await user.click(within(form).getByRole('button', { name: 'Publicar comentário' }))

    expect(await screen.findByText('Li em dois dias!')).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({ rating: 4, comment: 'Li em dois dias!' })
  })
})
