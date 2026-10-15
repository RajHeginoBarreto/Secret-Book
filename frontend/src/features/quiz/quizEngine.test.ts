import { describe, expect, it } from 'vitest'
import { QUIZ_QUESTIONS, PROFILES } from './quizData'
import { computeQuizResult, isComplete } from './quizEngine'

// Índices das opções em todas as perguntas: 0 mistério, 1 romance, 2 fantasia, 3 ficção.
const M = 0
const R = 1
const F = 2
const S = 3

describe('computeQuizResult', () => {
  it('retorna o perfil puro quando um gênero domina', () => {
    const result = computeQuizResult(QUIZ_QUESTIONS, [M, M, M, M, M, R])
    expect(result.profileKey).toBe('misterio')
    expect(result.profile).toEqual(PROFILES.misterio)
    expect(result.ranking[0]).toMatchObject({ genre: 'misterio', points: 5 })
    expect(result.ranking[0]?.share).toBeCloseTo(5 / 6)
  })

  it('combina os dois gêneros mais fortes quando o segundo tem 2 pontos ou mais', () => {
    const result = computeQuizResult(QUIZ_QUESTIONS, [F, F, F, F, R, R])
    expect(result.profileKey).toBe('fantasia+romance')
    expect(result.profile.name).toBe('Romantasia')
  })

  it('não combina quando o segundo gênero tem apenas 1 ponto', () => {
    const result = computeQuizResult(QUIZ_QUESTIONS, [S, S, S, M, R, F])
    expect(result.profileKey).toBe('ficcao')
  })

  it('desempata pelo gênero escolhido mais recentemente', () => {
    // Mistério e romance com 3 pontos; romance foi escolhido por último.
    const result = computeQuizResult(QUIZ_QUESTIONS, [M, M, M, R, R, R])
    expect(result.ranking.map((score) => score.genre)).toEqual(['romance', 'misterio'])
    expect(result.profileKey).toBe('misterio+romance')
  })

  it('usa apenas palavras-chave dos gêneros do perfil, no máximo 4', () => {
    const result = computeQuizResult(QUIZ_QUESTIONS, [S, S, S, S, S, M])
    expect(result.keywords).toEqual(['espaço', 'tecnologia', 'estação espacial', 'dilema'])
    expect(result.keywords).not.toContain('culpado')
  })

  it('as frações do ranking somam 1', () => {
    const result = computeQuizResult(QUIZ_QUESTIONS, [M, R, F, S, M, R])
    const total = result.ranking.reduce((sum, score) => sum + score.share, 0)
    expect(total).toBeCloseTo(1)
  })

  it('é determinístico: as mesmas respostas geram o mesmo resultado', () => {
    const answers = [F, M, F, M, S, R]
    expect(computeQuizResult(QUIZ_QUESTIONS, answers)).toEqual(computeQuizResult(QUIZ_QUESTIONS, answers))
  })

  it('recusa quiz incompleto ou respostas fora do intervalo', () => {
    expect(() => computeQuizResult(QUIZ_QUESTIONS, [M, M, null, M, M, M])).toThrow()
    expect(() => computeQuizResult(QUIZ_QUESTIONS, [M, M, M, M, M, 9])).toThrow()
    expect(() => computeQuizResult(QUIZ_QUESTIONS, [M, M])).toThrow()
  })

  it('todas as combinações possíveis de perfil existem no catálogo de perfis', () => {
    const genres = [M, R, F, S]
    for (const a of genres) {
      for (const b of genres) {
        expect(() => computeQuizResult(QUIZ_QUESTIONS, [a, a, a, a, b, b])).not.toThrow()
      }
    }
  })
})

describe('isComplete', () => {
  it('só é verdadeiro com todas as respostas válidas', () => {
    expect(isComplete(QUIZ_QUESTIONS, [])).toBe(false)
    expect(isComplete(QUIZ_QUESTIONS, [M, M, M, M, M, M])).toBe(true)
  })
})
