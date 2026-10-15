import { describe, expect, it } from 'vitest'
import { QUIZ_QUESTIONS } from './quizData'
import { emptyProgress, loadQuizProgress, QUIZ_STORAGE_KEY, saveQuizProgress } from './quizStorage'

describe('quizStorage', () => {
  it('salva e recupera o progresso', () => {
    const progress = { step: 2, answers: [0, 1, null, null, null, null], finished: false }
    saveQuizProgress(progress)
    expect(loadQuizProgress(QUIZ_QUESTIONS)).toEqual(progress)
  })

  it('retorna null quando não há nada salvo', () => {
    expect(loadQuizProgress(QUIZ_QUESTIONS)).toBeNull()
  })

  it.each([
    ['JSON inválido', '{quebrado'],
    ['quantidade errada de respostas', JSON.stringify({ step: 0, answers: [0], finished: false })],
    ['resposta fora do intervalo', JSON.stringify({ step: 0, answers: [7, null, null, null, null, null], finished: false })],
    ['passo inexistente', JSON.stringify({ step: 99, answers: emptyProgress(6).answers, finished: false })],
    ['finalizado com respostas vazias', JSON.stringify({ step: 5, answers: emptyProgress(6).answers, finished: true })],
  ])('descarta dados corrompidos: %s', (_, raw) => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, raw)
    expect(loadQuizProgress(QUIZ_QUESTIONS)).toBeNull()
  })
})
