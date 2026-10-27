import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { setAuthToken } from '../../api/authToken'
import { ADMIN, pageOf, searchOf } from '../../test/fixtures'
import { mockApi, problem } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'
import type {
  AdminAuthor,
  AdminBook,
  AdminBookRow,
  AdminFeedback,
  AdminGenre,
  AdminSubscription,
  AdminUser,
  RecommendationSettings,
  Stats,
} from './adminTypes'

/** Sessão de administrador + as rotas informadas. */
function asAdmin(routes: Parameters<typeof mockApi>[0] = {}) {
  setAuthToken('t')
  return mockApi({ 'GET /api/auth/me': { body: ADMIN }, ...routes })
}

const STATS: Stats = {
  users: 12,
  readers: 11,
  admins: 1,
  activeBooks: 30,
  totalBooks: 32,
  quizAttempts: 48,
  quizAttemptsLast30Days: 9,
  activeSubscriptions: 4,
  subscriptionsByPlan: [
    { label: 'Leitor ávido', count: 3 },
    { label: 'Leitor casual', count: 1 },
  ],
  usefulFeedback: 6,
  notUsefulFeedback: 2,
  mostRecommendedBooks: [{ label: 'A Ilha das Cartas', count: 17 }],
}

const AUTHORS: AdminAuthor[] = [
  { id: 1, slug: 'ana-autora', name: 'Ana Autora', bio: 'Escreve sobre ilhas.', bookCount: 2 },
  { id: 2, slug: 'bruno-bardo', name: 'Bruno Bardo', bio: '', bookCount: 0 },
]

const GENRES: AdminGenre[] = [
  { id: 1, slug: 'misterio', name: 'Mistério', description: 'Segredos.', bookCount: 4, usedByQuiz: true },
  { id: 2, slug: 'poesia', name: 'Poesia', description: 'Versos.', bookCount: 0, usedByQuiz: false },
]

const BOOK: AdminBook = {
  id: 7,
  slug: 'a-ilha',
  title: 'A Ilha das Cartas',
  synopsis: 'Cartas sem remetente chegam a uma ilha.',
  publicationYear: 2020,
  pages: 300,
  pace: 'MODERATE',
  tone: 'DARK',
  coverColor: '#333333',
  active: true,
  authorSlugs: ['ana-autora'],
  genreSlugs: ['misterio'],
  contentNotes: [],
  clues: ['ilha isolada'],
}

const BOOK_ROWS: AdminBookRow[] = [
  { id: 7, slug: 'a-ilha', title: 'A Ilha das Cartas', authors: ['Ana Autora'], genres: ['Mistério'], active: true, updatedAt: '2026-10-01T12:00:00Z' },
  { id: 8, slug: 'rascunho', title: 'Rascunho Perdido', authors: ['Bruno Bardo'], genres: ['Poesia'], active: false, updatedAt: '2026-10-02T12:00:00Z' },
]

describe('Painel: visão geral', () => {
  it('mostra os números do protótipo', async () => {
    asAdmin({ 'GET /api/admin/stats': { body: STATS } })
    renderRoute('/admin')

    expect(await screen.findByText('11 leitores · 1 admins')).toBeInTheDocument()
    expect(screen.getByText('Usuários', { selector: 'p' }).nextElementSibling).toHaveTextContent('12')
    expect(screen.getByText('32 cadastrados')).toBeInTheDocument()
    expect(screen.getByText('9 nos últimos 30 dias')).toBeInTheDocument()
    // 6 de 8 avaliações foram positivas.
    expect(screen.getByText('Recomendações aprovadas').nextElementSibling).toHaveTextContent('75%')
    expect(screen.getByText('8 avaliações')).toBeInTheDocument()

    const ranking = screen.getByRole('region', { name: 'Livros mais recomendados' })
    expect(within(ranking).getByText('A Ilha das Cartas').nextElementSibling).toHaveTextContent('17')
    const plans = screen.getByRole('region', { name: 'Assinaturas por plano' })
    expect(within(plans).getByText('Leitor ávido')).toBeInTheDocument()
  })

  it('mostra traço e mensagens vazias quando ainda não há dados', async () => {
    asAdmin({
      'GET /api/admin/stats': {
        body: { ...STATS, usefulFeedback: 0, notUsefulFeedback: 0, mostRecommendedBooks: [], subscriptionsByPlan: [] },
      },
    })
    renderRoute('/admin')

    expect(await screen.findByText('Ninguém fez o quiz ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma assinatura ativa.')).toBeInTheDocument()
    expect(screen.getByText('Recomendações aprovadas').nextElementSibling).toHaveTextContent('—')
  })
})

describe('Painel: livros', () => {
  it('lista os livros com situação e busca por título', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/books': (request) => ({
        body: pageOf(searchOf(request.url).get('q') ? [BOOK_ROWS[1]!] : BOOK_ROWS, { size: 20 }),
      }),
    })
    const { user, router } = renderRoute('/admin/livros')

    const row = (await screen.findByRole('link', { name: 'A Ilha das Cartas' })).closest('tr')!
    expect(within(row).getByText('Ativo')).toBeInTheDocument()
    expect(within(row).getByRole('link')).toHaveAttribute('href', '/admin/livros/7')
    expect(screen.getByRole('link', { name: 'Novo livro' })).toHaveAttribute('href', '/admin/livros/novo')

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por título ou autor' }), 'rascunho')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(screen.queryByRole('link', { name: 'A Ilha das Cartas' })).not.toBeInTheDocument())
    expect(within(screen.getByRole('link', { name: 'Rascunho Perdido' }).closest('tr')!).getByText('Inativo')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?busca=rascunho')
    expect(searchOf(requests.at(-1)!.url).get('q')).toBe('rascunho')
  })

  it('cadastra um livro novo e abre a edição dele', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/authors': { body: AUTHORS },
      'GET /api/admin/genres': { body: GENRES },
      'POST /api/admin/books': (request) => ({ status: 201, body: { ...BOOK, ...(request.body as object), id: 42 } }),
      'GET /api/admin/books/42': { body: { ...BOOK, id: 42, title: 'Mar de Tinta', slug: 'mar-de-tinta' } },
    })
    const { user, router } = renderRoute('/admin/livros/novo')

    expect(await screen.findByRole('heading', { level: 1, name: 'Novo livro' })).toBeInTheDocument()
    await user.type(await screen.findByLabelText('Título'), 'Mar de Tinta')
    await user.type(screen.getByLabelText('Sinopse'), 'Um farol que escreve cartas.')
    await user.clear(screen.getByLabelText('Páginas'))
    await user.type(screen.getByLabelText('Páginas'), '180')
    await user.selectOptions(screen.getByLabelText('Ritmo'), 'Rápido')
    await user.click(within(screen.getByRole('group', { name: 'Autoria' })).getByRole('checkbox', { name: 'Bruno Bardo' }))
    await user.click(within(screen.getByRole('group', { name: 'Gêneros' })).getByRole('checkbox', { name: 'Mistério' }))
    await user.click(screen.getByRole('checkbox', { name: 'Luto e perda' }))
    await user.type(screen.getByLabelText('Pista 1'), '  farol  ')
    await user.type(screen.getByLabelText('Pista 3'), 'tinta azul')
    await user.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/livros/42'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Editar livro' })).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      title: 'Mar de Tinta',
      synopsis: 'Um farol que escreve cartas.',
      publicationYear: null,
      pages: 180,
      pace: 'FAST',
      tone: 'EMOTIONAL',
      coverColor: '#1f3f6b',
      active: true,
      authorSlugs: ['bruno-bardo'],
      genreSlugs: ['misterio'],
      contentNotes: ['GRIEF'],
      // Pistas em branco não são enviadas; as demais vão sem espaços nas pontas.
      clues: ['farol', 'tinta azul'],
    })
  })

  it('destaca os campos recusados pela API', async () => {
    asAdmin({
      'GET /api/admin/authors': { body: AUTHORS },
      'GET /api/admin/genres': { body: GENRES },
      'POST /api/admin/books': problem(400, 'Dados inválidos.', [
        { field: 'title', message: 'Informe o título.' },
        { field: 'authorSlugs', message: 'Escolha pelo menos um autor.' },
      ]),
    })
    const { user, router } = renderRoute('/admin/livros/novo')

    await user.click(await screen.findByRole('button', { name: 'Cadastrar livro' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Revise os campos destacados.')
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Informe o título.')).toBeInTheDocument()
    expect(screen.getByText('Escolha pelo menos um autor.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/livros/novo')
  })

  it('edita um livro existente', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/books/7': { body: BOOK },
      'GET /api/admin/authors': { body: AUTHORS },
      'GET /api/admin/genres': { body: GENRES },
      'PUT /api/admin/books/7': (request) => ({ body: { ...BOOK, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/admin/livros/7')

    const title = await screen.findByLabelText('Título')
    expect(title).toHaveValue('A Ilha das Cartas')
    expect(screen.getByLabelText('Identificador na URL (slug)')).toHaveValue('a-ilha')
    expect(screen.getByRole('checkbox', { name: 'Ana Autora' })).toBeChecked()
    // O livro tem uma pista; o formulário completa com campos vazios até três.
    expect(screen.getByLabelText('Pista 1')).toHaveValue('ilha isolada')
    expect(screen.getByLabelText('Pista 3')).toHaveValue('')

    await user.clear(title)
    await user.type(title, 'A Ilha das Cartas Perdidas')
    await user.click(screen.getByRole('checkbox', { name: /ativo/i }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações salvas.')).toBeInTheDocument()
    const body = requests.find((request) => request.method === 'PUT')?.body as AdminBook
    expect(body).toMatchObject({ slug: 'a-ilha', title: 'A Ilha das Cartas Perdidas', active: false, clues: ['ilha isolada'] })
  })

  it('exclui um livro depois de confirmar', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { requests } = asAdmin({
      'GET /api/admin/books/7': { body: BOOK },
      'GET /api/admin/authors': { body: AUTHORS },
      'GET /api/admin/genres': { body: GENRES },
      'DELETE /api/admin/books/7': { status: 204 },
      'GET /api/admin/books': { body: pageOf([BOOK_ROWS[1]!]) },
    })
    const { user, router } = renderRoute('/admin/livros/7')

    await user.click(await screen.findByRole('button', { name: /excluir livro/i }))

    expect(confirm).toHaveBeenCalledWith('Excluir "A Ilha das Cartas"? Esta ação não pode ser desfeita.')
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/livros'))
    expect(requests.some((request) => request.method === 'DELETE' && request.url === '/api/admin/books/7')).toBe(true)
  })

  it('não exclui se o administrador desistir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { requests } = asAdmin({
      'GET /api/admin/books/7': { body: BOOK },
      'GET /api/admin/authors': { body: AUTHORS },
      'GET /api/admin/genres': { body: GENRES },
    })
    const { user, router } = renderRoute('/admin/livros/7')

    await user.click(await screen.findByRole('button', { name: /excluir livro/i }))
    expect(router.state.location.pathname).toBe('/admin/livros/7')
    expect(requests.some((request) => request.method === 'DELETE')).toBe(false)
  })

  it('mostra o erro quando o livro não existe', async () => {
    asAdmin({ 'GET /api/admin/authors': { body: AUTHORS }, 'GET /api/admin/genres': { body: GENRES } })
    renderRoute('/admin/livros/999')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument()
  })
})

describe('Painel: autores', () => {
  it('cadastra um autor e recarrega a lista', async () => {
    let authors = AUTHORS
    const { requests } = asAdmin({
      'GET /api/admin/authors': () => ({ body: authors }),
      'POST /api/admin/authors': (request) => {
        const body = request.body as { name: string; bio: string }
        authors = [...authors, { id: 3, slug: 'clara-cometa', name: body.name, bio: body.bio, bookCount: 0 }]
        return { status: 201, body: authors.at(-1) }
      },
    })
    const { user } = renderRoute('/admin/autores')

    expect(await screen.findByRole('cell', { name: /ana autora/i })).toBeInTheDocument()
    const form = screen.getByRole('form', { name: 'Novo autor' })
    await user.type(within(form).getByLabelText('Nome'), 'Clara Cometa')
    await user.type(within(form).getByLabelText('Biografia'), 'Escreve ficção científica.')
    await user.click(within(form).getByRole('button', { name: 'Cadastrar' }))

    expect(await screen.findByRole('cell', { name: /clara cometa/i })).toBeInTheDocument()
    // Slug em branco não é enviado (o backend gera a partir do nome).
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      name: 'Clara Cometa',
      bio: 'Escreve ficção científica.',
    })
    expect(within(form).getByLabelText('Nome')).toHaveValue('')
  })

  it('edita um autor com o formulário preenchido', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/authors': { body: AUTHORS },
      'PUT /api/admin/authors/1': (request) => ({ body: { ...AUTHORS[0]!, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/admin/autores')

    const row = (await screen.findByRole('cell', { name: /ana autora/i })).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Editar' }))

    const form = screen.getByRole('form', { name: 'Editar autor' })
    expect(within(form).getByRole('heading', { name: 'Editar Ana Autora' })).toBeInTheDocument()
    expect(within(form).getByLabelText('Identificador (slug)')).toHaveValue('ana-autora')
    await user.clear(within(form).getByLabelText('Biografia'))
    await user.type(within(form).getByLabelText('Biografia'), 'Nova biografia.')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(screen.getByRole('form', { name: 'Novo autor' })).toBeInTheDocument())
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({
      name: 'Ana Autora',
      slug: 'ana-autora',
      bio: 'Nova biografia.',
    })
  })

  it('exclui um autor e mostra o erro quando ele ainda tem livros', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    asAdmin({
      'GET /api/admin/authors': { body: AUTHORS },
      'DELETE /api/admin/authors/1': problem(409, 'Este autor tem livros cadastrados.'),
    })
    const { user } = renderRoute('/admin/autores')

    await user.click(await screen.findByRole('button', { name: 'Excluir Ana Autora' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Este autor tem livros cadastrados.')
  })

  it('exclui um autor sem livros', async () => {
    let authors = AUTHORS
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    asAdmin({
      'GET /api/admin/authors': () => ({ body: authors }),
      'DELETE /api/admin/authors/2': () => {
        authors = authors.filter((author) => author.id !== 2)
        return { status: 204 }
      },
    })
    const { user } = renderRoute('/admin/autores')

    await user.click(await screen.findByRole('button', { name: 'Excluir Bruno Bardo' }))
    expect(confirm).toHaveBeenCalledWith('Excluir o autor "Bruno Bardo"?')
    await waitFor(() => expect(screen.queryByRole('cell', { name: /bruno bardo/i })).not.toBeInTheDocument())
  })
})

describe('Painel: gêneros', () => {
  it('mostra quais gêneros o quiz usa e cadastra um novo', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/genres': { body: GENRES },
      'POST /api/admin/genres': { status: 201, body: GENRES[1] },
    })
    const { user } = renderRoute('/admin/generos')

    const row = (await screen.findByRole('cell', { name: /mistério/i })).closest('tr')!
    expect(within(row).getByRole('cell', { name: 'Sim' })).toBeInTheDocument()

    const form = screen.getByRole('form', { name: 'Novo gênero' })
    await user.type(within(form).getByLabelText('Nome'), 'Contos')
    await user.type(within(form).getByLabelText('Identificador (slug)'), 'contos-curtos')
    await user.type(within(form).getByLabelText('Descrição'), 'Histórias curtas.')
    await user.click(within(form).getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => expect(requests.some((request) => request.method === 'POST')).toBe(true))
    expect(requests.find((request) => request.method === 'POST')?.body).toEqual({
      name: 'Contos',
      slug: 'contos-curtos',
      description: 'Histórias curtas.',
    })
  })

  it('na edição não deixa mudar o identificador', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/genres': { body: GENRES },
      'PUT /api/admin/genres/2': { body: GENRES[1] },
    })
    const { user } = renderRoute('/admin/generos')

    const row = (await screen.findByRole('cell', { name: /poesia/i })).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Editar' }))

    const form = screen.getByRole('form', { name: 'Editar gênero' })
    expect(within(form).queryByLabelText('Identificador (slug)')).not.toBeInTheDocument()
    await user.clear(within(form).getByLabelText('Nome'))
    await user.type(within(form).getByLabelText('Nome'), 'Poesia e cordel')
    await user.click(within(form).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(requests.some((request) => request.method === 'PUT')).toBe(true))
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({
      name: 'Poesia e cordel',
      description: 'Versos.',
    })
  })

  it('mostra o erro ao tentar excluir um gênero usado pelo quiz', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    asAdmin({
      'GET /api/admin/genres': { body: GENRES },
      'DELETE /api/admin/genres/1': problem(409, 'Este gênero é usado pelo quiz.'),
    })
    const { user } = renderRoute('/admin/generos')

    await user.click(await screen.findByRole('button', { name: 'Excluir Mistério' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Este gênero é usado pelo quiz.')
  })
})

const USERS: AdminUser[] = [
  { id: 99, name: 'equipe', username: 'equipe', email: 'equipe@secretbook.test', role: 'ADMIN', enabled: true, createdAt: '2026-01-01T12:00:00Z' },
  { id: 1, name: 'leitora noturna', username: 'leitora noturna', email: null, role: 'READER', enabled: true, createdAt: '2026-10-01T12:00:00Z' },
]

describe('Painel: usuários', () => {
  it('não deixa o administrador mudar o próprio papel nem se desativar', async () => {
    asAdmin({ 'GET /api/admin/users': { body: pageOf(USERS, { size: 20 }) } })
    renderRoute('/admin/usuarios')

    const me = (await screen.findByText('(você)')).closest('tr')!
    expect(within(me).getByLabelText('Papel de equipe')).toBeDisabled()
    expect(within(me).queryByRole('button', { name: 'Desativar' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Papel de leitora noturna')).toBeEnabled()
  })

  it('promove um leitor a administrador', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/users': { body: pageOf(USERS, { size: 20 }) },
      'PATCH /api/admin/users/1': (request) => ({ body: { ...USERS[1]!, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/admin/usuarios')

    const select = await screen.findByLabelText('Papel de leitora noturna')
    await user.selectOptions(select, 'Administrador')

    await waitFor(() => expect(select).toHaveValue('ADMIN'))
    expect(requests.find((request) => request.method === 'PATCH')?.body).toEqual({ role: 'ADMIN' })
  })

  it('desativa um usuário depois de confirmar e reativa sem confirmação', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { requests } = asAdmin({
      'GET /api/admin/users': { body: pageOf(USERS, { size: 20 }) },
      'PATCH /api/admin/users/1': (request) => ({ body: { ...USERS[1]!, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/admin/usuarios')

    const row = (await screen.findByLabelText('Papel de leitora noturna')).closest('tr')!
    await user.click(within(row).getByRole('button', { name: 'Desativar' }))
    expect(confirm).toHaveBeenCalledWith('Desativar leitora noturna? As sessões abertas serão encerradas.')
    expect(await within(row).findByText('Desativado')).toBeInTheDocument()

    await user.click(within(row).getByRole('button', { name: 'Reativar' }))
    expect(await within(row).findByText('Ativo')).toBeInTheDocument()
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(requests.filter((request) => request.method === 'PATCH').map((request) => request.body)).toEqual([
      { enabled: false },
      { enabled: true },
    ])
  })

  it('não desativa se o administrador desistir', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { requests } = asAdmin({ 'GET /api/admin/users': { body: pageOf(USERS, { size: 20 }) } })
    const { user } = renderRoute('/admin/usuarios')

    await user.click(await screen.findByRole('button', { name: 'Desativar' }))
    expect(requests.some((request) => request.method === 'PATCH')).toBe(false)
  })

  it('busca por nome de usuário', async () => {
    const { requests } = asAdmin({ 'GET /api/admin/users': { body: pageOf([USERS[1]!], { size: 20 }) } })
    const { user, router } = renderRoute('/admin/usuarios')

    await user.type(await screen.findByRole('searchbox', { name: /buscar por nome de usuário/i }), 'leitora')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => expect(router.state.location.search).toBe('?busca=leitora'))
    await waitFor(() => expect(searchOf(requests.at(-1)!.url).get('q')).toBe('leitora'))
  })
})

describe('Painel: avaliações e assinaturas', () => {
  it('lista as avaliações das recomendações e pagina', async () => {
    const feedback: AdminFeedback = {
      id: 1,
      userName: 'leitora noturna',
      username: 'leitora noturna',
      userEmail: null,
      bookSlug: 'a-ilha',
      bookTitle: 'A Ilha das Cartas',
      useful: false,
      comment: null,
      attemptId: 'tentativa-1',
      updatedAt: '2026-10-21T12:00:00Z',
    }
    const { requests } = asAdmin({
      'GET /api/admin/feedback': (request) => {
        const page = Number(searchOf(request.url).get('page'))
        return { body: pageOf([{ ...feedback, id: page + 1 }], { page, size: 20, totalPages: 2 }) }
      },
    })
    const { user } = renderRoute('/admin/avaliacoes')

    const row = (await screen.findByRole('link', { name: 'A Ilha das Cartas' })).closest('tr')!
    expect(within(row).getByRole('link')).toHaveAttribute('href', '/livros/a-ilha')
    expect(within(row).getByText('Não combina')).toBeInTheDocument()
    expect(within(row).getByRole('cell', { name: '—' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /próxima/i }))
    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
    expect(searchOf(requests.at(-1)!.url).get('page')).toBe('1')
  })

  it('lista as assinaturas demonstrativas', async () => {
    const subscriptions: AdminSubscription[] = [
      {
        id: 1,
        userName: 'leitora noturna',
        username: 'leitora noturna',
        userEmail: null,
        planName: 'Leitor ávido',
        status: 'ACTIVE',
        startedAt: '2026-09-15T12:00:00Z',
        canceledAt: null,
      },
      {
        id: 2,
        userName: 'joão',
        username: 'joão',
        userEmail: null,
        planName: 'Leitor casual',
        status: 'CANCELED',
        startedAt: '2026-08-01T12:00:00Z',
        canceledAt: '2026-08-20T12:00:00Z',
      },
    ]
    asAdmin({ 'GET /api/admin/subscriptions': { body: pageOf(subscriptions, { size: 20 }) } })
    renderRoute('/admin/assinaturas')

    const active = (await screen.findByRole('cell', { name: 'Leitor ávido' })).closest('tr')!
    expect(within(active).getByText('Ativa')).toBeInTheDocument()
    expect(within(active).getByRole('cell', { name: '—' })).toBeInTheDocument()
    const canceled = screen.getByRole('cell', { name: 'Leitor casual' }).closest('tr')!
    expect(within(canceled).getByText('Cancelada')).toBeInTheDocument()
  })

  it('mostra os estados vazios', async () => {
    asAdmin({
      'GET /api/admin/feedback': { body: pageOf([]) },
      'GET /api/admin/subscriptions': { body: pageOf([]) },
    })
    const { user } = renderRoute('/admin/avaliacoes')
    expect(await screen.findByText('Nenhuma avaliação ainda')).toBeInTheDocument()

    await user.click(within(screen.getByRole('navigation', { name: 'Seções do painel' })).getByRole('link', { name: 'Assinaturas' }))
    expect(await screen.findByText('Nenhuma assinatura ainda')).toBeInTheDocument()
  })
})

const SETTINGS: RecommendationSettings = {
  genreWeight: 0.5,
  paceWeight: 0.15,
  toneWeight: 0.2,
  lengthWeight: 0.15,
  maxResults: 5,
  mixThreshold: 2,
  updatedAt: '2026-10-01T12:00:00Z',
}

describe('Painel: pesos da recomendação', () => {
  it('mostra a proporção de cada peso e salva os novos valores', async () => {
    const { requests } = asAdmin({
      'GET /api/admin/recommendation-settings': { body: SETTINGS },
      'PUT /api/admin/recommendation-settings': (request) => ({
        body: { ...(request.body as object), updatedAt: '2026-10-26T12:00:00Z' },
      }),
    })
    const { user } = renderRoute('/admin/recomendacao')

    expect(await screen.findByLabelText('Peso do gênero (50%)')).toHaveValue(0.5)
    expect(screen.getByLabelText('Peso do clima (20%)')).toBeInTheDocument()

    // Gênero 1 + 0,15 + 0,2 + 0,15 = 1,5 → gênero vira 67%.
    const genre = screen.getByLabelText('Peso do gênero (50%)')
    await user.clear(genre)
    await user.type(genre, '1')
    expect(screen.getByLabelText('Peso do gênero (67%)')).toBeInTheDocument()
    expect(screen.getByLabelText('Peso do clima (13%)')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Livros por resultado'))
    await user.type(screen.getByLabelText('Livros por resultado'), '8')
    await user.click(screen.getByRole('button', { name: 'Salvar pesos' }))

    expect(await screen.findByText(/pesos salvos/i)).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({
      genreWeight: 1,
      paceWeight: 0.15,
      toneWeight: 0.2,
      lengthWeight: 0.15,
      maxResults: 8,
      mixThreshold: 2,
    })
  })

  it('destaca os valores recusados pela API', async () => {
    asAdmin({
      'GET /api/admin/recommendation-settings': { body: SETTINGS },
      'PUT /api/admin/recommendation-settings': problem(400, 'Dados inválidos.', [
        { field: 'maxResults', message: 'Escolha de 1 a 12 livros.' },
      ]),
    })
    const { user } = renderRoute('/admin/recomendacao')

    await user.click(await screen.findByRole('button', { name: 'Salvar pesos' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Revise os valores destacados.')
    expect(screen.getByLabelText('Livros por resultado')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Escolha de 1 a 12 livros.')).toBeInTheDocument()
  })
})
