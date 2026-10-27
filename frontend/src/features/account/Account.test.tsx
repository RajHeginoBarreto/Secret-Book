import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAuthToken, setAuthToken } from '../../api/authToken'
import { makeBook, READER } from '../../test/fixtures'
import { mockApi, problem, type MockResponse } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'
import type { AttemptSummary, FeedbackEntry, LibraryEntry, Subscription } from './accountTypes'

const ILHA = makeBook()
const REINO = makeBook({ slug: 'o-reino-de-vidro', title: 'O Reino de Vidro', authors: [{ slug: 'bruno', name: 'Bruno Bardo' }] })
const ESTACAO = makeBook({ slug: 'estacao-nove', title: 'Estação Nove', authors: [{ slug: 'carla', name: 'Carla Cosmos' }] })

const entry = (book = ILHA, changes: Partial<LibraryEntry> = {}): LibraryEntry => ({
  book,
  status: null,
  favorite: false,
  updatedAt: '2026-10-02T12:00:00Z',
  rating: null,
  comment: null,
  reviewedAt: null,
  ...changes,
})

const LIBRARY: LibraryEntry[] = [
  entry(ILHA, { status: 'READING', favorite: true }),
  entry(REINO, { status: 'WANT_TO_READ' }),
  entry(ESTACAO, { status: 'READ' }),
]

const ATTEMPTS: AttemptSummary[] = [
  { id: 'tentativa-2', createdAt: '2026-10-20T15:30:00Z', profileName: 'Romantasia', recommendedTitles: ['O Reino de Vidro', 'A Ilha das Cartas'] },
  { id: 'tentativa-1', createdAt: '2026-10-01T10:00:00Z', profileName: 'Detetive de poltrona', recommendedTitles: ['A Ilha das Cartas'] },
]

const SUBSCRIPTION: Subscription = {
  id: 5,
  plan: { slug: 'leitor-avido', name: 'Leitor ávido', monthlyPriceCents: 7000, booksPerMonth: 2 },
  status: 'ACTIVE',
  startedAt: '2026-09-15T12:00:00Z',
  canceledAt: null,
}

/** Sessão de leitor + as rotas informadas. */
function loggedIn(routes: Parameters<typeof mockApi>[0] = {}) {
  setAuthToken('t')
  return mockApi({ 'GET /api/auth/me': { body: READER }, ...routes })
}

/** Corpo devolvido pelo PUT da biblioteca: a entrada com o novo status/favorito. */
const echoLibrary = (book = ILHA) => (request: { body: unknown }): MockResponse => ({
  body: entry(book, request.body as Partial<LibraryEntry>),
})

describe('Minha conta: visão geral', () => {
  it('resume assinatura, último quiz e biblioteca', async () => {
    loggedIn({
      'GET /api/me/subscription': { body: SUBSCRIPTION },
      'GET /api/me/quiz-attempts': { body: ATTEMPTS },
      'GET /api/me/library': { body: LIBRARY },
    })
    renderRoute('/minha-conta')

    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, leitora noturna' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Seções da conta' })
    expect(within(nav).getByRole('link', { name: 'Visão geral' })).toHaveAttribute('aria-current', 'page')

    const subscription = screen.getByRole('region', { name: 'Assinatura' })
    expect(await within(subscription).findByText('Leitor ávido')).toBeInTheDocument()
    expect(within(subscription).getByText(/R\$\s70\/mês \(fictício\) · 2 livros por mês/)).toBeInTheDocument()

    const quiz = screen.getByRole('region', { name: 'Último quiz' })
    expect(await within(quiz).findByText('Romantasia')).toBeInTheDocument()
    expect(within(quiz).getByText(/2 livros recomendados/)).toBeInTheDocument()
    expect(within(quiz).getByRole('link', { name: 'Ver resultado' })).toHaveAttribute('href', '/quiz/resultado/tentativa-2')

    const library = screen.getByRole('region', { name: 'Biblioteca' })
    expect(await within(library).findByText('3')).toBeInTheDocument()
    expect(within(library).getByText('1 livro sendo lido · 1 favorito')).toBeInTheDocument()
  })

  it('sem assinatura nem quiz, convida a ver os planos e fazer o quiz', async () => {
    loggedIn({
      'GET /api/me/subscription': { status: 204 },
      'GET /api/me/quiz-attempts': { body: [] },
      'GET /api/me/library': { body: [] },
    })
    renderRoute('/minha-conta')

    expect(await screen.findByText('Você não tem assinatura demonstrativa ativa.')).toBeInTheDocument()
    expect(await screen.findByText('Você ainda não fez o quiz com esta conta.')).toBeInTheDocument()
    const quiz = screen.getByRole('region', { name: 'Último quiz' })
    expect(within(quiz).getByRole('link', { name: 'Fazer o quiz' })).toHaveAttribute('href', '/quiz')
  })

  it('cancela a assinatura demonstrativa depois de confirmar', async () => {
    let active = true
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { requests } = loggedIn({
      'GET /api/me/subscription': () => (active ? { body: SUBSCRIPTION } : { status: 204 }),
      'DELETE /api/me/subscription': () => {
        active = false
        return { status: 204 }
      },
      'GET /api/me/quiz-attempts': { body: [] },
      'GET /api/me/library': { body: [] },
    })
    const { user } = renderRoute('/minha-conta')

    const subscription = await screen.findByRole('region', { name: 'Assinatura' })
    await user.click(await within(subscription).findByRole('button', { name: 'Cancelar' }))

    expect(confirm).toHaveBeenCalledWith('Cancelar a assinatura demonstrativa?')
    expect(await within(subscription).findByText('Você não tem assinatura demonstrativa ativa.')).toBeInTheDocument()
    expect(requests.filter((request) => request.method === 'DELETE')).toHaveLength(1)
  })

  it('não cancela se o leitor desistir na confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { requests } = loggedIn({
      'GET /api/me/subscription': { body: SUBSCRIPTION },
      'GET /api/me/quiz-attempts': { body: [] },
      'GET /api/me/library': { body: [] },
    })
    const { user } = renderRoute('/minha-conta')

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.getByText('Leitor ávido')).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'DELETE')).toBe(false)
  })
})

describe('Minha conta: biblioteca', () => {
  it('lista os livros e filtra por status e favoritos', async () => {
    loggedIn({ 'GET /api/me/library': { body: LIBRARY } })
    const { user } = renderRoute('/minha-conta/biblioteca')

    expect(await screen.findByRole('link', { name: 'A Ilha das Cartas' })).toHaveAttribute('href', '/livros/a-ilha')
    expect(screen.getByRole('link', { name: 'O Reino de Vidro' })).toBeInTheDocument()
    expect(screen.getByLabelText('Status de leitura de A Ilha das Cartas')).toHaveValue('READING')

    const filters = screen.getByRole('group', { name: 'Filtrar biblioteca' })
    await user.click(within(filters).getByRole('button', { name: 'Lidos' }))
    expect(within(filters).getByRole('button', { name: 'Lidos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: 'Estação Nove' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'A Ilha das Cartas' })).not.toBeInTheDocument()

    await user.click(within(filters).getByRole('button', { name: 'Favoritos' }))
    expect(screen.getByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Estação Nove' })).not.toBeInTheDocument()
  })

  it('muda o status de leitura de um livro', async () => {
    const { requests } = loggedIn({
      'GET /api/me/library': { body: LIBRARY },
      'PUT /api/me/library/o-reino-de-vidro': echoLibrary(REINO),
    })
    const { user } = renderRoute('/minha-conta/biblioteca')

    const select = await screen.findByLabelText('Status de leitura de O Reino de Vidro')
    await user.selectOptions(select, 'Lido')
    await waitFor(() => expect(select).toHaveValue('READ'))
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({ status: 'READ', favorite: false })
  })

  it('favorita e desfavorita um livro', async () => {
    const { requests } = loggedIn({
      'GET /api/me/library': { body: LIBRARY },
      'PUT /api/me/library/o-reino-de-vidro': echoLibrary(REINO),
    })
    const { user } = renderRoute('/minha-conta/biblioteca')

    const favorite = await screen.findByRole('button', { name: 'Favorito: O Reino de Vidro' })
    expect(favorite).toHaveAttribute('aria-pressed', 'false')
    await user.click(favorite)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Favorito: O Reino de Vidro' })).toHaveAttribute('aria-pressed', 'true'),
    )
    await user.click(screen.getByRole('button', { name: 'Favorito: O Reino de Vidro' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Favorito: O Reino de Vidro' })).toHaveAttribute('aria-pressed', 'false'),
    )
    expect(requests.filter((request) => request.method === 'PUT').map((request) => request.body)).toEqual([
      { status: 'WANT_TO_READ', favorite: true },
      { status: 'WANT_TO_READ', favorite: false },
    ])
  })

  it('remove um livro da biblioteca', async () => {
    const { requests } = loggedIn({
      'GET /api/me/library': { body: LIBRARY },
      'PUT /api/me/library/a-ilha': echoLibrary(ILHA),
    })
    const { user } = renderRoute('/minha-conta/biblioteca')

    await user.click(await screen.findByRole('button', { name: 'Remover A Ilha das Cartas da biblioteca' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'A Ilha das Cartas' })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'O Reino de Vidro' })).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({ status: null, favorite: false })
  })

  it('mostra o erro quando a alteração falha', async () => {
    loggedIn({
      'GET /api/me/library': { body: LIBRARY },
      'PUT /api/me/library/a-ilha': problem(500, 'Não foi possível salvar agora.'),
    })
    const { user } = renderRoute('/minha-conta/biblioteca')

    await user.click(await screen.findByRole('button', { name: 'Remover A Ilha das Cartas da biblioteca' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar agora.')
    expect(screen.getByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
  })

  it('mostra a estante vazia com convite ao catálogo', async () => {
    loggedIn({ 'GET /api/me/library': { body: [] } })
    renderRoute('/minha-conta/biblioteca')
    expect(await screen.findByText('Sua biblioteca está vazia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute('href', '/catalogo')
  })
})

describe('Minha conta: histórico do quiz', () => {
  it('lista as tentativas com link para cada resultado', async () => {
    loggedIn({ 'GET /api/me/quiz-attempts': { body: ATTEMPTS } })
    renderRoute('/minha-conta/historico')

    expect(await screen.findByText('Romantasia')).toBeInTheDocument()
    expect(screen.getByText('Detetive de poltrona')).toBeInTheDocument()
    expect(screen.getByText(/1 livro recomendado/)).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'Ver resultado' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/quiz/resultado/tentativa-2', '/quiz/resultado/tentativa-1'])
  })

  it('convida a fazer o quiz quando não há histórico', async () => {
    loggedIn({ 'GET /api/me/quiz-attempts': { body: [] } })
    renderRoute('/minha-conta/historico')
    expect(await screen.findByText('Nenhum quiz por aqui ainda')).toBeInTheDocument()
  })
})

const FEEDBACK: FeedbackEntry[] = [
  { book: ILHA, useful: true, comment: 'Exatamente meu tipo.', attemptId: 'tentativa-2', updatedAt: '2026-10-21T12:00:00Z' },
  { book: REINO, useful: false, comment: null, attemptId: null, updatedAt: '2026-10-21T12:00:00Z' },
]

describe('Minha conta: avaliações', () => {
  it('lista as avaliações e inverte uma delas', async () => {
    const { requests } = loggedIn({
      'GET /api/me/feedback': { body: FEEDBACK },
      'PUT /api/me/feedback/a-ilha': (request) => ({ body: { ...FEEDBACK[0]!, ...(request.body as object) } }),
    })
    const { user } = renderRoute('/minha-conta/avaliacoes')

    expect(await screen.findByText('“Exatamente meu tipo.”')).toBeInTheDocument()
    expect(screen.getByText('Combinou')).toBeInTheDocument()
    expect(screen.getByText('Não combina')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mudar para "Não combina"' }))
    await waitFor(() => expect(screen.getAllByText('Não combina')).toHaveLength(2))
    expect(requests.find((request) => request.method === 'PUT')?.body).toEqual({
      useful: false,
      comment: 'Exatamente meu tipo.',
      attemptId: 'tentativa-2',
    })
  })

  it('remove uma avaliação', async () => {
    const { requests } = loggedIn({
      'GET /api/me/feedback': { body: FEEDBACK },
      'DELETE /api/me/feedback/o-reino-de-vidro': { status: 204 },
    })
    const { user } = renderRoute('/minha-conta/avaliacoes')

    await user.click(await screen.findByRole('button', { name: 'Remover avaliação de O Reino de Vidro' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'O Reino de Vidro' })).not.toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'A Ilha das Cartas' })).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'DELETE' && request.url === '/api/me/feedback/o-reino-de-vidro')).toBe(true)
  })

  it('mostra o estado vazio', async () => {
    loggedIn({ 'GET /api/me/feedback': { body: [] } })
    renderRoute('/minha-conta/avaliacoes')
    expect(await screen.findByText('Nenhuma avaliação ainda')).toBeInTheDocument()
  })
})

describe('Minha conta: conta e privacidade', () => {
  beforeEach(() => {
    setAuthToken('t')
  })

  it('mostra os dados guardados (sem e-mail para contas novas)', async () => {
    loggedIn()
    renderRoute('/minha-conta/perfil')

    const section = await screen.findByRole('region', { name: 'Seus dados' })
    expect(within(section).getByText('Nome de usuário').nextElementSibling).toHaveTextContent('leitora noturna')
    expect(within(section).getByText('Conta criada em').nextElementSibling).toHaveTextContent('1 de outubro de 2026')
    expect(within(section).queryByText('E-mail')).not.toBeInTheDocument()
  })

  it('troca a senha', async () => {
    const { requests } = loggedIn({ 'POST /api/auth/password/change': { status: 204 } })
    const { user } = renderRoute('/minha-conta/perfil')

    await user.type(await screen.findByLabelText('Senha atual'), 'segredo123')
    await user.type(screen.getByLabelText('Nova senha'), 'outrasenha9')
    await user.click(screen.getByRole('button', { name: 'Trocar senha' }))

    expect(await screen.findByText(/senha alterada/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(requests.find((request) => request.url === '/api/auth/password/change')?.body).toEqual({
      currentPassword: 'segredo123',
      newPassword: 'outrasenha9',
    })
  })

  it('não envia uma nova senha fraca e mostra o erro da API para a senha atual errada', async () => {
    const { requests } = loggedIn({ 'POST /api/auth/password/change': problem(400, 'A senha atual não confere.') })
    const { user } = renderRoute('/minha-conta/perfil')

    await user.type(await screen.findByLabelText('Senha atual'), 'segredo123')
    await user.type(screen.getByLabelText('Nova senha'), 'fraca')
    await user.click(screen.getByRole('button', { name: 'Trocar senha' }))
    expect(screen.getByRole('alert')).toHaveTextContent('A senha deve ter entre 8 e 64 caracteres.')
    expect(requests.some((request) => request.url === '/api/auth/password/change')).toBe(false)

    await user.clear(screen.getByLabelText('Nova senha'))
    await user.type(screen.getByLabelText('Nova senha'), 'outrasenha9')
    await user.click(screen.getByRole('button', { name: 'Trocar senha' }))
    expect(await screen.findByText('A senha atual não confere.')).toBeInTheDocument()
  })

  it('baixa os dados da conta em JSON', async () => {
    const exported = { account: { username: 'leitora noturna' }, library: [] }
    loggedIn({ 'GET /api/me/export': { body: exported } })
    // O jsdom não implementa URL.createObjectURL nem o download pelo link.
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:meus-dados'
    })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = createObjectURL
        static override revokeObjectURL = revokeObjectURL
      },
    )
    const downloads: { href: string; download: string }[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push({ href: this.getAttribute('href') ?? '', download: this.download })
    })
    const { user } = renderRoute('/minha-conta/perfil')

    await user.click(await screen.findByRole('button', { name: 'Baixar meus dados' }))

    await waitFor(() => expect(downloads).toEqual([{ href: 'blob:meus-dados', download: 'secret-book-meus-dados.json' }]))
    expect(blobs[0]!.type).toBe('application/json')
    expect(JSON.parse(await blobs[0]!.text())).toEqual(exported)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:meus-dados')
  })

  it('mostra o erro quando a exportação falha', async () => {
    loggedIn({ 'GET /api/me/export': problem(500, 'Não foi possível gerar o arquivo.') })
    const { user } = renderRoute('/minha-conta/perfil')
    await user.click(await screen.findByRole('button', { name: 'Baixar meus dados' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar o arquivo.')
  })

  it('pede a senha antes de excluir a conta e respeita a desistência', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { requests } = loggedIn()
    const { user } = renderRoute('/minha-conta/perfil')

    await user.click(await screen.findByRole('button', { name: 'Excluir minha conta' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Digite sua senha para confirmar.')
    expect(confirm).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Confirme com sua senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(requests.some((request) => request.method === 'DELETE')).toBe(false)
  })

  it('exclui a conta com a senha e encerra a sessão', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { requests } = loggedIn({
      'DELETE /api/me': { status: 204 },
      'POST /api/auth/logout': { status: 204 },
    })
    const { user } = renderRoute('/minha-conta/perfil')

    await user.type(await screen.findByLabelText('Confirme com sua senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    await waitFor(() => expect(getAuthToken()).toBeNull())
    await waitFor(() => expect(requests.some((request) => request.url === '/api/auth/logout')).toBe(true))
    const deletion = requests.find((request) => request.method === 'DELETE')
    expect(deletion?.url).toBe('/api/me')
    expect(deletion?.body).toEqual({ password: 'segredo123' })
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('mostra o erro quando a senha de exclusão está errada', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    loggedIn({ 'DELETE /api/me': problem(400, 'Senha incorreta.') })
    const { user, router } = renderRoute('/minha-conta/perfil')

    await user.type(await screen.findByLabelText('Confirme com sua senha'), 'errada123')
    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Senha incorreta.')
    expect(router.state.location.pathname).toBe('/minha-conta/perfil')
    expect(getAuthToken()).toBe('t')
  })

  it('sai da conta', async () => {
    const { requests } = loggedIn({ 'POST /api/auth/logout': { status: 204 } })
    const { user } = renderRoute('/minha-conta/perfil')

    await user.click(await screen.findByRole('button', { name: /sair da conta/i }))
    await waitFor(() => expect(getAuthToken()).toBeNull())
    expect(requests.some((request) => request.url === '/api/auth/logout')).toBe(true)
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('ao sair da conta, termina na página inicial (e não no login)', async () => {
    loggedIn({ 'POST /api/auth/logout': { status: 204 } })
    const { user, router } = renderRoute('/minha-conta/perfil')

    await user.click(await screen.findByRole('button', { name: /sair da conta/i }))
    await waitFor(() => expect(getAuthToken()).toBeNull())
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.search).toBe('')
  })

  it('ao excluir a conta, termina na página inicial (e não no login)', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    loggedIn({ 'DELETE /api/me': { status: 204 }, 'POST /api/auth/logout': { status: 401 } })
    const { user, router } = renderRoute('/minha-conta/perfil')

    await user.type(await screen.findByLabelText('Confirme com sua senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
    await waitFor(() => expect(getAuthToken()).toBeNull())
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.search).toBe('')
  })
})
