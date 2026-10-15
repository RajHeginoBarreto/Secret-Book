import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
