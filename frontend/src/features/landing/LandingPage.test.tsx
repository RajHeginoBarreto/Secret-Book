import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PLANS } from '../../data/plans'
import { renderRoute } from '../../test/renderRoute'

describe('Landing page', () => {
  it('exibe o hero e todas as seções principais', () => {
    renderRoute('/')
    expect(screen.getByRole('heading', { level: 1, name: /livros surpresa que combinam/i })).toBeInTheDocument()

    const expectedSections = [
      /uma nova forma de encontrar/i,
      /feito à mão, do embrulho à etiqueta/i,
      /pronto\(a\) para o seu encontro/i,
      /escolha seu ritmo de leitura/i,
      /um perfil que guarda a sua história/i,
      /perguntas antes de abrir/i,
      /^contato$/i,
    ]
    for (const name of expectedSections) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })

  it('não tem mais a seção de depoimentos', () => {
    renderRoute('/')
    expect(screen.queryByText(/depoimentos fictícios/i)).not.toBeInTheDocument()
  })

  it('cada plano leva ao fluxo de simulação correspondente', () => {
    renderRoute('/')
    for (const plan of PLANS) {
      expect(screen.getByRole('link', { name: `Escolher o plano ${plan.name}` })).toHaveAttribute(
        'href',
        `/assinar/${plan.slug}`,
      )
    }
    expect(screen.getByText(/valores e benefícios fictícios/i)).toBeInTheDocument()
  })

  it('vira o cartão de pistas dos produtos', async () => {
    const { user } = renderRoute('/')
    const card = screen.getByRole('button', { name: /virar o cartão de pistas para ver o verso/i })
    expect(card).toHaveAttribute('aria-pressed', 'false')
    await user.click(card)
    expect(screen.getByRole('button', { name: /virar o cartão de pistas para a frente/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('troca a prévia do quiz ao escolher um tema', async () => {
    const { user } = renderRoute('/')
    const group = screen.getByRole('group', { name: /escolha um tema/i })
    await user.click(within(group).getByRole('button', { name: /fantasia/i }))
    expect(within(group).getByRole('button', { name: /fantasia/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/mundos com regras próprias/i)).toBeInTheDocument()
  })

  it('explica que a conta pede só nome e senha', () => {
    renderRoute('/')
    expect(screen.getByText(/só nome e senha/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /criar meu perfil/i })).toHaveAttribute('href', '/cadastro')
  })
})

// O jsdom não avalia media queries: o botão do menu móvel fica com display:none
// (largura "desktop") e sem nome acessível calculado; por isso a busca é pelo aria-label.
const menuButton = (label: string) => screen.getByLabelText(label, { selector: 'button' })

describe('Cabeçalho', () => {
  it('abre e fecha o menu móvel, inclusive com Esc', async () => {
    const { user } = renderRoute('/')
    const toggle = menuButton('Abrir menu')
    await user.click(toggle)
    expect(menuButton('Fechar menu')).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(menuButton('Abrir menu')).toHaveAttribute('aria-expanded', 'false')
  })

  it('fecha o menu ao navegar', async () => {
    const { user, router } = renderRoute('/')
    await user.click(menuButton('Abrir menu'))
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    await user.click(within(nav).getByRole('link', { name: 'Fazer o quiz' }))
    expect(router.state.location.pathname).toBe('/quiz')
    expect(menuButton('Abrir menu')).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Contato', () => {
  it('mostra erros e não abre o WhatsApp quando o formulário é inválido', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const { user } = renderRoute('/')
    await user.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }))
    expect(screen.getByText(/informe seu nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(open).not.toHaveBeenCalled()
  })

  it('abre o WhatsApp com a mensagem codificada quando válido', async () => {
    const fakeWindow = { opener: {} } as unknown as Window
    const open = vi.spyOn(window, 'open').mockReturnValue(fakeWindow)
    const { user } = renderRoute('/')
    await user.type(screen.getByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Mensagem'), 'Quero saber mais sobre o clube.')
    await user.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }))

    expect(open).toHaveBeenCalledTimes(1)
    const url = String(open.mock.calls[0]![0])
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(decodeURIComponent(url.split('text=')[1]!)).toContain('*Nome:* Ana')
    expect(fakeWindow.opener).toBeNull()
    expect(screen.getByText(/abrimos o whatsapp/i)).toBeInTheDocument()
  })

  it('oferece um link alternativo quando o pop-up é bloqueado', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    const { user } = renderRoute('/')
    await user.type(screen.getByLabelText('Nome'), 'Ana')
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com')
    await user.type(screen.getByLabelText('Mensagem'), 'Quero saber mais sobre o clube.')
    await user.click(screen.getByRole('button', { name: 'Enviar pelo WhatsApp' }))
    expect(screen.getByText(/bloqueou a nova aba/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /clique aqui para continuar/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me'),
    )
  })
})

describe('Rotas', () => {
  it('mostra a página 404 para endereços inexistentes', () => {
    renderRoute('/nao-existe')
    expect(screen.getByRole('heading', { level: 1, name: /saiu da estante/i })).toBeInTheDocument()
  })
})
