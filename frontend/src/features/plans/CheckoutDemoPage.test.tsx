import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setAuthToken } from '../../api/authToken'
import { READER } from '../../test/fixtures'
import { mockApi, problem } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'

describe('CheckoutDemoPage', () => {
  it('mostra o resumo do plano escolhido e deixa claro que nada é cobrado', () => {
    renderRoute('/assinar/leitor-avido')
    expect(screen.getByRole('heading', { level: 1, name: 'Simular assinatura' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /leitor ávido/i })).toBeChecked()
    expect(screen.getByText('Cobrado hoje').nextElementSibling).toHaveTextContent(/R\$\s0/)
  })

  it('exige a confirmação de que é uma simulação', async () => {
    const { user } = renderRoute('/assinar/leitor-casual')
    await user.click(screen.getByRole('button', { name: 'Confirmar simulação' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/simulação sem cobrança/i)
    expect(screen.queryByText('Simulação concluída')).not.toBeInTheDocument()
  })

  it('conclui a simulação sem afirmar que houve pagamento', async () => {
    const { user } = renderRoute('/assinar/maratona-literaria')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirmar simulação' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Simulação concluída' })).toHaveFocus()
    expect(screen.getByText(/nenhum pagamento foi realizado/i)).toBeInTheDocument()
    expect(screen.getByText('Maratona literária')).toBeInTheDocument()
  })

  it('permite trocar de plano antes de confirmar', async () => {
    const { user, router } = renderRoute('/assinar/leitor-casual')
    await user.click(screen.getByRole('radio', { name: /maratona literária/i }))
    expect(router.state.location.pathname).toBe('/assinar/maratona-literaria')
    expect(screen.getByText('Livros por mês').nextElementSibling).toHaveTextContent('4')
  })

  it('mostra 404 para plano inexistente', () => {
    renderRoute('/assinar/plano-que-nao-existe')
    expect(screen.getByRole('heading', { level: 1, name: /saiu da estante/i })).toBeInTheDocument()
  })
})

describe('CheckoutDemoPage: com e sem login', () => {
  it('sem login, não chama a API e convida a entrar para registrar a assinatura', async () => {
    const { requests } = mockApi({})
    const { user } = renderRoute('/assinar/leitor-casual')

    expect(screen.getByRole('link', { name: 'Entre na sua conta' })).toHaveAttribute(
      'href',
      '/entrar?voltar=%2Fassinar%2Fleitor-casual',
    )
    await user.click(screen.getByRole('checkbox', { name: /nenhum dado será salvo/i }))
    await user.click(screen.getByRole('button', { name: 'Confirmar simulação' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Simulação concluída' })).toBeInTheDocument()
    expect(screen.getByText(/nenhum dado foi salvo/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver minha conta' })).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('com login, registra a assinatura demonstrativa na conta', async () => {
    setAuthToken('t')
    const { requests } = mockApi({
      'GET /api/auth/me': { body: READER },
      'POST /api/me/subscription': { status: 201, body: {} },
    })
    const { user } = renderRoute('/assinar/leitor-avido')

    await user.click(await screen.findByRole('checkbox', { name: /ficará registrado na minha conta/i }))
    expect(screen.queryByRole('link', { name: 'Entre na sua conta' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar simulação' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Simulação concluída' })).toHaveFocus()
    expect(screen.getByText(/ficou registrada na sua conta/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver minha conta' })).toHaveAttribute('href', '/minha-conta')
    const post = requests.find((request) => request.method === 'POST')
    expect(post?.url).toBe('/api/me/subscription')
    expect(post?.body).toEqual({ planSlug: 'leitor-avido' })
  })

  it('com login, mostra o erro da API e não conclui', async () => {
    setAuthToken('t')
    mockApi({
      'GET /api/auth/me': { body: READER },
      'POST /api/me/subscription': problem(500, 'Não foi possível registrar a assinatura.'),
    })
    const { user } = renderRoute('/assinar/leitor-avido')

    await user.click(await screen.findByRole('checkbox', { name: /ficará registrado/i }))
    await user.click(screen.getByRole('button', { name: 'Confirmar simulação' }))

    expect(await screen.findByText('Não foi possível registrar a assinatura.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Simulação concluída' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar simulação' })).toBeEnabled()
  })
})
