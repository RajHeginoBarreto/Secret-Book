import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PLANS } from '../../data/plans'
import { renderRoute } from '../../test/renderRoute'

describe('Landing page', () => {
  it('exibe o hero e todas as seções principais', () => {
    renderRoute('/')
    expect(screen.getByRole('heading', { level: 1, name: /livros que combinam/i })).toBeInTheDocument()

    const expectedSections = [
      /uma nova forma de encontrar/i,
      /sem revelar o título/i,
      /o que chega na sua porta/i,
      /que tipo de pacote combina/i,
      /uma surpresa que tem a sua cara/i,
      /escolha seu ritmo de leitura/i,
      /como seria receber/i,
      /perguntas antes de abrir/i,
      /pronto\(a\) para o seu encontro/i,
      /^contato$/i,
    ]
    for (const name of expectedSections) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
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

  it('identifica os depoimentos como fictícios', () => {
    renderRoute('/')
    expect(screen.getByText('Depoimentos fictícios')).toBeInTheDocument()
  })

  it('abre a caixa surpresa e mostra o conteúdo', async () => {
    const { user } = renderRoute('/')
    const button = screen.getByRole('button', { name: 'Abrir a caixa' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Cartão de pistas')).not.toBeVisible()
    await user.click(button)
    expect(screen.getByRole('button', { name: 'Fechar a caixa' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Cartão de pistas')).toBeVisible()
  })

  it('revela as pistas de um pacote de exemplo', async () => {
    const { user } = renderRoute('/')
    const [firstPackage] = screen.getAllByRole('button', { name: /mostrar pistas deste pacote/i })
    await user.click(firstPackage!)
    expect(screen.getByRole('button', { name: /pistas: mistério/i })).toHaveAttribute('aria-pressed', 'true')
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
