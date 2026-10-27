import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setAuthToken } from '../../api/authToken'
import { makeBook, makeBookDetail, pageOf, READER, searchOf } from '../../test/fixtures'
import { mockApi, problem, type MockRequest } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'
import type { BookComment, LibraryEntry } from '../account/accountTypes'
import type { BookSummary, Genre } from './catalogTypes'

const GENRES: Genre[] = [
  { slug: 'misterio', name: 'Mistério', description: 'Segredos e reviravoltas.', bookCount: 4 },
  { slug: 'fantasia', name: 'Fantasia', description: 'Mundos mágicos.', bookCount: 6 },
]

const ILHA = makeBook()
const REINO: BookSummary = makeBook({
  slug: 'o-reino-de-vidro',
  title: 'O Reino de Vidro',
  authors: [{ slug: 'bruno-bardo', name: 'Bruno Bardo' }],
  genres: [{ slug: 'fantasia', name: 'Fantasia' }],
  pages: 520,
  length: 'LONG',
  pace: 'FAST',
})

const catalogRequests = (requests: MockRequest[]) => requests.filter((request) => request.url.startsWith('/api/books'))

describe('Catálogo', () => {
  it('lista os livros e os gêneros com a contagem', async () => {
    const { requests } = mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': { body: pageOf([ILHA, REINO]) },
    })
    renderRoute('/catalogo')

    expect(await screen.findByRole('heading', { level: 2, name: '2 livros encontrados' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'A Ilha das Cartas' })).toHaveAttribute('href', '/livros/a-ilha')
    expect(screen.getByRole('link', { name: 'O Reino de Vidro' })).toHaveAttribute('href', '/livros/o-reino-de-vidro')
    expect(screen.getByText(/520 páginas · Longo · ritmo rápido/)).toBeInTheDocument()

    const filters = screen.getByRole('group', { name: 'Filtrar por gênero' })
    expect(within(filters).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(filters).getByRole('button', { name: /fantasia 6/i })).toHaveAttribute('aria-pressed', 'false')

    const params = searchOf(catalogRequests(requests)[0]!.url)
    expect(params.get('page')).toBe('0')
    expect(params.get('size')).toBe('12')
    expect(params.has('genre')).toBe(false)
  })

  it('filtra por gênero e volta para "Todos"', async () => {
    const { requests } = mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': (request) => ({
        body: pageOf(searchOf(request.url).get('genre') === 'fantasia' ? [REINO] : [ILHA, REINO]),
      }),
    })
    const { user, router } = renderRoute('/catalogo')
    const filters = screen.getByRole('group', { name: 'Filtrar por gênero' })

    await user.click(await within(filters).findByRole('button', { name: /fantasia/i }))

    expect(await screen.findByRole('heading', { level: 2, name: '1 livro encontrado' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?genero=fantasia')
    expect(within(filters).getByRole('button', { name: /fantasia/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('link', { name: 'A Ilha das Cartas' })).not.toBeInTheDocument()
    expect(searchOf(catalogRequests(requests).at(-1)!.url).get('genre')).toBe('fantasia')

    await user.click(within(filters).getByRole('button', { name: 'Todos' }))
    expect(await screen.findByRole('heading', { level: 2, name: '2 livros encontrados' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('busca por título ou autor e permite limpar os filtros quando nada é encontrado', async () => {
    const { requests } = mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': (request) => ({ body: pageOf(searchOf(request.url).get('q') ? [] : [ILHA]) }),
    })
    const { user, router } = renderRoute('/catalogo')
    await screen.findByRole('link', { name: 'A Ilha das Cartas' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por título ou autor' }), '  dragões  ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Nenhum livro por aqui')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?busca=drag%C3%B5es')
    expect(searchOf(catalogRequests(requests).at(-1)!.url).get('q')).toBe('dragões')

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    expect(await screen.findByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
    expect(screen.getByRole('searchbox', { name: 'Buscar por título ou autor' })).toHaveValue('')
  })

  it('pagina os resultados (página 1 na URL é a página 0 da API)', async () => {
    const { requests } = mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': (request) => {
        const page = Number(searchOf(request.url).get('page'))
        const book = page === 0 ? ILHA : REINO
        return { body: pageOf([book], { page, totalPages: 3, totalElements: 30 }) }
      },
    })
    const { user, router } = renderRoute('/catalogo')

    const pagination = await screen.findByRole('navigation', { name: 'Paginação' })
    expect(within(pagination).getByText('Página 1 de 3')).toBeInTheDocument()
    expect(within(pagination).getByRole('button', { name: /anterior/i })).toBeDisabled()

    await user.click(within(pagination).getByRole('button', { name: /próxima/i }))

    expect(await screen.findByRole('link', { name: 'O Reino de Vidro' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?pagina=2')
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()
    expect(searchOf(catalogRequests(requests).at(-1)!.url).get('page')).toBe('1')

    await user.click(screen.getByRole('button', { name: /anterior/i }))
    expect(await screen.findByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('lê gênero, busca e página da URL ao abrir', async () => {
    const { requests } = mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': { body: pageOf([REINO], { page: 1, totalPages: 2, totalElements: 13 }) },
    })
    renderRoute('/catalogo?genero=fantasia&busca=vidro&pagina=2')

    expect(await screen.findByRole('heading', { level: 2, name: '13 livros encontrados' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar por título ou autor' })).toHaveValue('vidro')
    const params = searchOf(catalogRequests(requests)[0]!.url)
    expect(params.get('genre')).toBe('fantasia')
    expect(params.get('q')).toBe('vidro')
    expect(params.get('page')).toBe('1')
  })

  it('mostra o erro da API e tenta de novo', async () => {
    let calls = 0
    mockApi({
      'GET /api/genres': { body: GENRES },
      'GET /api/books': () => (++calls === 1 ? problem(500, 'O servidor tropeçou.') : { body: pageOf([ILHA]) }),
    })
    const { user } = renderRoute('/catalogo')

    expect(await screen.findByRole('alert')).toHaveTextContent('O servidor tropeçou.')
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

const COMMENTS: BookComment[] = [
  { author: 'maria lê', rating: 4, comment: 'Não consegui largar até o farol acender.', reviewedAt: '2026-09-10T12:00:00Z' },
  { author: 'joão', rating: null, comment: 'Final corajoso.', reviewedAt: '2026-09-12T12:00:00Z' },
]

describe('Página do livro', () => {
  it('mostra detalhes, links de gênero e autor, pistas e temas sensíveis', async () => {
    mockApi({
      'GET /api/books/a-ilha': { body: makeBookDetail() },
      'GET /api/books/a-ilha/comments': { body: [] },
    })
    renderRoute('/livros/a-ilha')

    expect(await screen.findByRole('heading', { level: 1, name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mistério' })).toHaveAttribute('href', '/catalogo?genero=misterio')
    expect(screen.getByRole('link', { name: 'Ana Autora' })).toHaveAttribute('href', '/autores/ana-autora')
    expect(screen.getByText('Ritmo').nextElementSibling).toHaveTextContent('Equilibrado')
    expect(screen.getByText('Clima').nextElementSibling).toHaveTextContent('Sombrio')
    expect(screen.getByText('Páginas').nextElementSibling).toHaveTextContent('300 (médio)')
    expect(screen.getByText(/cartas sem remetente/i)).toBeInTheDocument()
    expect(screen.getByText('farol apagado')).toBeInTheDocument()
    expect(screen.getByText('Violência')).toBeInTheDocument()
  })

  it('avisa quando o livro não tem temas sensíveis', async () => {
    mockApi({
      'GET /api/books/a-ilha': { body: makeBookDetail({ contentNotes: [], publicationYear: null }) },
      'GET /api/books/a-ilha/comments': { body: [] },
    })
    renderRoute('/livros/a-ilha')
    expect(await screen.findByText('Nenhum tema sensível sinalizado.')).toBeInTheDocument()
    expect(screen.queryByText('Ano')).not.toBeInTheDocument()
  })

  it('mostra os comentários públicos de quem leu', async () => {
    const { requests } = mockApi({
      'GET /api/books/a-ilha': { body: makeBookDetail() },
      'GET /api/books/a-ilha/comments': { body: COMMENTS },
    })
    renderRoute('/livros/a-ilha')

    const section = await screen.findByRole('region', { name: 'Comentários de quem leu' })
    expect(await within(section).findByText('Não consegui largar até o farol acender.')).toBeInTheDocument()
    expect(within(section).getByText('maria lê')).toBeInTheDocument()
    expect(within(section).getByRole('img', { name: 'Nota 4 de 5' })).toBeInTheDocument()
    expect(within(section).getByText('Final corajoso.')).toBeInTheDocument()
    // Comentário sem nota não mostra estrelas.
    expect(within(section).getAllByRole('img')).toHaveLength(1)
    expect(requests.some((request) => request.url === '/api/books/a-ilha/comments')).toBe(true)
  })

  it('convida a comentar quando ninguém comentou ainda', async () => {
    mockApi({
      'GET /api/books/a-ilha': { body: makeBookDetail() },
      'GET /api/books/a-ilha/comments': { body: [] },
    })
    renderRoute('/livros/a-ilha')
    expect(await screen.findByText(/ninguém comentou ainda/i)).toBeInTheDocument()
  })

  it('convida o visitante a entrar para guardar o livro, voltando para a mesma página', async () => {
    mockApi({
      'GET /api/books/a-ilha': { body: makeBookDetail() },
      'GET /api/books/a-ilha/comments': { body: [] },
    })
    renderRoute('/livros/a-ilha')
    const link = await screen.findByRole('link', { name: 'Entre' })
    expect(link).toHaveAttribute('href', '/entrar?voltar=%2Flivros%2Fa-ilha')
    expect(screen.queryByLabelText('Na minha biblioteca')).not.toBeInTheDocument()
  })

  it('com login, guarda o livro na biblioteca e favorita', async () => {
    setAuthToken('t')
    const entry: LibraryEntry = {
      book: makeBook(),
      status: null,
      favorite: false,
      updatedAt: null,
      rating: null,
      comment: null,
      reviewedAt: null,
    }
    const { requests } = mockApi({
      'GET /api/auth/me': { body: READER },
      'GET /api/books/a-ilha': { body: makeBookDetail() },
      'GET /api/books/a-ilha/comments': { body: [] },
      'GET /api/me/library/a-ilha': { body: entry },
      'PUT /api/me/library/a-ilha': (request) => ({ body: { ...entry, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/livros/a-ilha')

    const select = await screen.findByLabelText('Na minha biblioteca')
    await user.selectOptions(select, 'Lido')
    await waitFor(() => expect(select).toHaveValue('READ'))
    // Livro lido pode ser comentado direto na página.
    expect(await screen.findByRole('button', { name: /comentar este livro/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Favoritar' }))
    expect(await screen.findByRole('button', { name: 'Favorito' })).toHaveAttribute('aria-pressed', 'true')

    const puts = requests.filter((request) => request.method === 'PUT')
    expect(puts.map((request) => request.body)).toEqual([
      { status: 'READ', favorite: false },
      { status: 'READ', favorite: true },
    ])
  })

  it('mostra a página 404 para livro inexistente', async () => {
    renderRoute('/livros/nao-existe')
    expect(await screen.findByRole('heading', { level: 1, name: /saiu da estante/i })).toBeInTheDocument()
  })
})

describe('Página do autor', () => {
  it('mostra nome, biografia e os livros do autor', async () => {
    mockApi({
      'GET /api/authors/ana-autora': {
        body: { slug: 'ana-autora', name: 'Ana Autora', bio: 'Escreve sobre ilhas e cartas.', books: [ILHA] },
      },
    })
    renderRoute('/autores/ana-autora')

    expect(await screen.findByRole('heading', { level: 1, name: 'Ana Autora' })).toBeInTheDocument()
    expect(screen.getByText('Escreve sobre ilhas e cartas.')).toBeInTheDocument()
    const section = screen.getByRole('region', { name: 'Livros de Ana Autora' })
    expect(within(section).getByRole('link', { name: 'A Ilha das Cartas' })).toHaveAttribute('href', '/livros/a-ilha')
  })

  it('avisa quando o autor não tem livros disponíveis', async () => {
    mockApi({
      'GET /api/authors/ana-autora': { body: { slug: 'ana-autora', name: 'Ana Autora', bio: '', books: [] } },
    })
    renderRoute('/autores/ana-autora')
    expect(await screen.findByText('Nenhum livro disponível no momento')).toBeInTheDocument()
  })

  it('mostra a página 404 para autor inexistente', async () => {
    renderRoute('/autores/ninguem')
    expect(await screen.findByRole('heading', { level: 1, name: /saiu da estante/i })).toBeInTheDocument()
  })
})
