import type { QuizQuestion } from './quizData'
import type { Answer } from './quizEngine'

/**
 * Salvamento automático do progresso no próprio navegador (localStorage).
 * Serve para retomar um quiz interrompido sem precisar de conta.
 * Quando houver login, o resultado final também será salvo no backend.
 */
export const QUIZ_STORAGE_KEY = 'secretbook:quiz-progress:v1'

export interface QuizProgress {
  step: number
  answers: Answer[]
  finished: boolean
}

export function emptyProgress(questionCount: number): QuizProgress {
  return { step: 0, answers: Array.from({ length: questionCount }, () => null), finished: false }
}

/** Lê e VALIDA o progresso salvo. Dados ausentes, antigos ou corrompidos são descartados. */
export function loadQuizProgress(questions: QuizQuestion[]): QuizProgress | null {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(QUIZ_STORAGE_KEY)
  } catch {
    return null // armazenamento bloqueado (ex.: modo privado restrito)
  }
  if (!raw) return null

  try {
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const { step, answers, finished } = data as Record<string, unknown>

    if (!Array.isArray(answers) || answers.length !== questions.length) return null
    const validAnswers = answers.every(
      (answer, index) =>
        answer === null ||
        (Number.isInteger(answer) && (answer as number) >= 0 && (answer as number) < questions[index]!.options.length),
    )
    if (!validAnswers) return null
    if (!Number.isInteger(step) || (step as number) < 0 || (step as number) >= questions.length) return null
    if (typeof finished !== 'boolean') return null
    if (finished && answers.some((answer) => answer === null)) return null

    return { step: step as number, answers: answers as Answer[], finished }
  } catch {
    return null
  }
}

export function saveQuizProgress(progress: QuizProgress): void {
  try {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Sem armazenamento disponível: o quiz continua funcionando, só não é retomável.
  }
}

export function clearQuizProgress(): void {
  try {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY)
  } catch {
    // ignorado: ver saveQuizProgress
  }
}
