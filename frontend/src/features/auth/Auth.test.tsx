import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { getAuthToken, setAuthToken } from '../../api/authToken'
import { ADMIN, READER } from '../../test/fixtures'
import { mockApi, problem } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'

const SESSION = { token: 'novo-token', expiresAt: '2026-12-01T00:00:00Z', user: READER }

describe('Login', () => {
  it('mostra o erro da API e continua na tela de login', async () => {
    const { requests } = mockApi({
      'POST /api/auth/login': problem(401, 'Nome de usuário ou senha incorretos.'),
    })
    const { user, router } = renderRoute('/entrar')

    await user.type(screen.getByLabelText('Nome de usuário'), 'leitora noturna')
    await user.type(screen.getByLabelText('Senha'), 'senhaerrada1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Nome de usuário ou senha incorretos.')
    expect(router.state.location.pathname).toBe('/entrar')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
    expect(getAuthToken()).toBeNull()
    expect(requests).toHaveLength(1)
  })

  it('sem ?voltar=, vai para "Minha conta" e guarda o token', async () => {
    mockApi({ 'POST /api/auth/login': { body: SESSION } })
    const { user, router } = renderRoute('/entrar')

    await user.type(screen.getByLabelText('Nome de usuário'), '  leitora noturna  ')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/minha-conta'))
    expect(getAuthToken()).toBe('novo-token')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, leitora noturna' })).toBeInTheDocument()
  })

  it('ignora um ?voltar= que aponta para outro site', async () => {
    mockApi({ 'POST /api/auth/login': { body: SESSION } })
    const { user, router } = renderRoute('/entrar?voltar=//site-malicioso.example')

    await user.type(screen.getByLabelText('Nome de usuário'), 'leitora noturna')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/minha-conta'))
  })

  it('quem já está logado é levado direto ao destino de ?voltar=', async () => {
    setAuthToken('t')
    mockApi({ 'GET /api/auth/me': { body: READER }, 'GET /api/genres': { body: [] } })
    const { router } = renderRoute('/entrar?voltar=/catalogo')
    await waitFor(() => expect(router.state.location.pathname).toBe('/catalogo'))
  })

  it('o link "Criar conta" mantém o ?voltar=', () => {
    renderRoute('/entrar?voltar=/quiz')
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/cadastro?voltar=%2Fquiz')
  })
})

describe('Cadastro', () => {
  const fillForm = async (user: ReturnType<typeof renderRoute>['user'], username = 'leitora noturna') => {
    await user.type(screen.getByLabelText('Nome de usuário'), username)
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirme a senha'), 'segredo123')
    await user.click(screen.getByRole('checkbox', { name: /li e aceito/i }))
  }

  it('mostra no campo o erro que a API devolveu', async () => {
    mockApi({
      'POST /api/auth/register': problem(409, 'Dados inválidos.', [
        { field: 'username', message: 'Este nome de usuário já está em uso.' },
      ]),
    })
    const { user, router } = renderRoute('/cadastro')
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Este nome de usuário já está em uso.')).toBeInTheDocument()
    const username = screen.getByLabelText('Nome de usuário')
    expect(username).toHaveAttribute('aria-invalid', 'true')
    expect(username).toHaveAccessibleDescription(expect.stringContaining('Este nome de usuário já está em uso.'))
    // Com erro de campo, não aparece o aviso genérico.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/cadastro')
  })

  it('mostra o aviso geral quando o erro não é de um campo', async () => {
    mockApi({ 'POST /api/auth/register': problem(429, 'Muitas tentativas. Tente de novo em alguns minutos.') })
    const { user } = renderRoute('/cadastro')
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas tentativas')
  })

  it('valida nome, senha e confirmação antes de enviar', async () => {
    const { requests } = mockApi({})
    const { user } = renderRoute('/cadastro')

    await user.type(screen.getByLabelText('Nome de usuário'), 'ab')
    await user.type(screen.getByLabelText('Senha'), 'somenteletras')
    await user.click(screen.getByRole('checkbox', { name: /li e aceito/i }))
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText('O nome de usuário deve ter de 3 a 40 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('A senha deve ter letras e números.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nome de usuário'))
    await user.type(screen.getByLabelText('Nome de usuário'), 'leitora')
    await user.clear(screen.getByLabelText('Senha'))
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirme a senha'), 'segredo124')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
    expect(screen.queryByText('A senha deve ter letras e números.')).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })
})

describe('Esqueci minha senha', () => {
  it('envia o e-mail e mostra a mensagem da API', async () => {
    const { requests } = mockApi({
      'POST /api/auth/password/forgot': { body: { message: 'Se o e-mail estiver cadastrado, enviaremos um link.' } },
    })
    const { user } = renderRoute('/esqueci-senha')

    await user.type(screen.getByLabelText('E-mail'), ' ana@exemplo.com ')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByText('Se o e-mail estiver cadastrado, enviaremos um link.')).toBeInTheDocument()
    expect(screen.getByText(/não há envio de e-mail/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument()
    expect(requests[0]?.body).toEqual({ email: 'ana@exemplo.com' })
  })

  it('mostra o erro de validação no campo', async () => {
    mockApi({
      'POST /api/auth/password/forgot': problem(400, 'Dados inválidos.', [{ field: 'email', message: 'Informe um e-mail válido.' }]),
    })
    const { user } = renderRoute('/esqueci-senha')
    await user.type(screen.getByLabelText('E-mail'), 'nao-e-email')
    await user.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('Redefinir senha', () => {
  it('avisa quando o link não tem o código', () => {
    renderRoute('/redefinir-senha')
    expect(screen.getByRole('heading', { level: 1, name: 'Link incompleto' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedir um novo link' })).toHaveAttribute('href', '/esqueci-senha')
  })

  it('valida a nova senha antes de enviar', async () => {
    const { requests } = mockApi({})
    const { user } = renderRoute('/redefinir-senha?token=abc')

    await user.type(screen.getByLabelText('Nova senha'), 'curta1')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    expect(screen.getByText('A senha deve ter entre 8 e 64 caracteres.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nova senha'))
    await user.type(screen.getByLabelText('Nova senha'), 'novasenha1')
    await user.type(screen.getByLabelText('Confirme a nova senha'), 'novasenha2')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))
    expect(screen.getByText('As senhas não são iguais.')).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('envia o código e a nova senha e confirma a troca', async () => {
    const { requests } = mockApi({ 'POST /api/auth/password/reset': { status: 204 } })
    const { user } = renderRoute('/redefinir-senha?token=abc123')

    await user.type(screen.getByLabelText('Nova senha'), 'novasenha1')
    await user.type(screen.getByLabelText('Confirme a nova senha'), 'novasenha1')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Senha alterada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Entrar com a nova senha' })).toHaveAttribute('href', '/entrar')
    expect(requests[0]?.body).toEqual({ token: 'abc123', newPassword: 'novasenha1' })
  })

  it('mostra o erro da API para código vencido', async () => {
    mockApi({ 'POST /api/auth/password/reset': problem(400, 'O link expirou. Peça um novo.') })
    const { user } = renderRoute('/redefinir-senha?token=velho')

    await user.type(screen.getByLabelText('Nova senha'), 'novasenha1')
    await user.type(screen.getByLabelText('Confirme a nova senha'), 'novasenha1')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O link expirou. Peça um novo.')
    expect(screen.queryByRole('heading', { name: 'Senha alterada' })).not.toBeInTheDocument()
  })
})

describe('RequireAuth', () => {
  it('leva o visitante ao login, guardando para onde ele queria ir', async () => {
    const { router } = renderRoute('/minha-conta/biblioteca?filtro=lidos')
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(new URLSearchParams(router.state.location.search).get('voltar')).toBe('/minha-conta/biblioteca?filtro=lidos')
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('mostra "verificando sessão" enquanto confirma o token', () => {
    setAuthToken('t')
    mockApi({ 'GET /api/auth/me': () => new Promise(() => {}) })
    renderRoute('/minha-conta')
    expect(screen.getByRole('status')).toHaveTextContent('Verificando sua sessão…')
  })

  it('descarta um token recusado pelo servidor e manda para o login', async () => {
    setAuthToken('expirado')
    mockApi({ 'GET /api/auth/me': problem(401, 'Sessão expirada.') })
    const { router } = renderRoute('/minha-conta')
    await waitFor(() => expect(router.state.location.pathname).toBe('/entrar'))
    expect(getAuthToken()).toBeNull()
  })

  it('mostra 403 para quem não é administrador em /admin', async () => {
    setAuthToken('t')
    const { requests } = mockApi({ 'GET /api/auth/me': { body: READER } })
    const { router } = renderRoute('/admin')

    expect(await screen.findByRole('heading', { level: 1, name: 'Esta estante é só para a equipe' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para minha conta' })).toHaveAttribute('href', '/minha-conta')
    expect(router.state.location.pathname).toBe('/admin')
    expect(requests.some((request) => request.url.startsWith('/api/admin'))).toBe(false)
  })

  it('deixa o administrador entrar no painel', async () => {
    setAuthToken('t')
    mockApi({ 'GET /api/auth/me': { body: ADMIN } })
    renderRoute('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/admin')
  })
})
