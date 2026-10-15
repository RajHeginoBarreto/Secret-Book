import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '../../test/renderRoute'
import { QUIZ_QUESTIONS } from './quizData'
import { QUIZ_STORAGE_KEY } from './quizStorage'

type User = ReturnType<typeof renderRoute>['user']

async function answer(user: User, optionText: string) {
  await user.click(screen.getByRole('radio', { name: new RegExp(optionText, 'i') }))
}

async function next(user: User) {
  await user.click(screen.getByRole('button', { name: /próxima|ver meu perfil/i }))
}

describe('QuizPage', () => {
  it('exige uma resposta antes de avançar', async () => {
    const { user } = renderRoute('/quiz')
    expect(screen.getByRole('heading', { level: 2, name: QUIZ_QUESTIONS[0]!.text })).toBeInTheDocument()
    await next(user)
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma resposta')
    expect(screen.getByText('Pergunta 1 de 6')).toBeInTheDocument()
  })

  it('percorre o quiz e mostra o perfil calculado a partir das respostas', async () => {
    const { user } = renderRoute('/quiz')
    // 4 respostas de fantasia + 2 de romance → "Romantasia"
    for (const question of QUIZ_QUESTIONS.slice(0, 4)) {
      await answer(user, escapeRegExp(question.options[2]!.text))
      await next(user)
    }
    for (const question of QUIZ_QUESTIONS.slice(4)) {
      await answer(user, escapeRegExp(question.options[1]!.text))
      await next(user)
    }

    expect(screen.getByRole('heading', { level: 2, name: 'Romantasia' })).toBeInTheDocument()
    expect(screen.getByText('4 de 6')).toBeInTheDocument()
    expect(screen.getByText('2 de 6')).toBeInTheDocument()
    expect(screen.getByText(/perfil inicial/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Romantasia' })).toHaveFocus()
  })

  it('volta para a pergunta anterior mantendo a resposta', async () => {
    const { user } = renderRoute('/quiz')
    await answer(user, 'comédia romântica')
    await next(user)
    expect(screen.getByText('Pergunta 2 de 6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /voltar/i }))
    expect(screen.getByRole('radio', { name: /comédia romântica/i })).toBeChecked()
  })

  it('salva automaticamente e retoma o quiz interrompido', async () => {
    const first = renderRoute('/quiz')
    await answer(first.user, 'comédia romântica')
    await next(first.user)
    first.unmount()

    const saved = JSON.parse(window.localStorage.getItem(QUIZ_STORAGE_KEY) ?? '{}')
    expect(saved).toMatchObject({ step: 1, finished: false })

    const second = renderRoute('/quiz')
    expect(screen.getByText(/retomamos seu quiz/i)).toBeInTheDocument()
    expect(screen.getByText('Pergunta 2 de 6')).toBeInTheDocument()

    await second.user.click(screen.getByRole('button', { name: /recomeçar/i }))
    expect(screen.getByText('Pergunta 1 de 6')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /comédia romântica/i })).not.toBeChecked()
  })

  it('permite refazer o quiz a partir do resultado', async () => {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ step: 5, answers: [0, 0, 0, 0, 0, 0], finished: true }),
    )
    const { user } = renderRoute('/quiz')
    expect(screen.getByRole('heading', { level: 2, name: 'Mistério clássico' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /refazer o quiz/i }))
    expect(screen.getByText('Pergunta 1 de 6')).toBeInTheDocument()
  })
})

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
