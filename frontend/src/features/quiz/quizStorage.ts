import type { Answers, QuizQuestion } from './quizTypes'

/**
 * Salvamento automático do progresso no próprio navegador (localStorage), para retomar um quiz interrompido.
 * O resultado final fica no servidor; aqui guardamos só o id da última tentativa.
 */
export const QUIZ_STORAGE_KEY = 'secretbook:quiz-progress:v2'
export const LAST_RESULT_KEY = 'secretbook:quiz-last-result'

export interface QuizProgress {
  step: number
  answers: Answers
}

/** Lê e VALIDA o progresso salvo contra as perguntas atuais. Dados antigos ou corrompidos são descartados. */
export function loadQuizProgress(questions: QuizQuestion[]): QuizProgress | null {
  const raw = read(QUIZ_STORAGE_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as unknown
    if (typeof data !== 'object' || data === null) return null
    const { step, answers } = data as Record<string, unknown>
    if (!Number.isInteger(step) || (step as number) < 0) return null
    if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) return null

    const bySlug = new Map(questions.map((question) => [question.slug, question]))
    for (const [slug, chosen] of Object.entries(answers)) {
      const question = bySlug.get(slug)
      if (!question || !Array.isArray(chosen)) return null
      const valid = chosen.every((option) => question.options.some((candidate) => candidate.slug === option))
      if (!valid || (!question.multiple && chosen.length > 1)) return null
    }
    return { step: step as number, answers: answers as Answers }
  } catch {
    return null
  }
}

export function saveQuizProgress(progress: QuizProgress): void {
  write(QUIZ_STORAGE_KEY, JSON.stringify(progress))
}

export function clearQuizProgress(): void {
  write(QUIZ_STORAGE_KEY, null)
}

export function rememberLastResult(id: string): void {
  write(LAST_RESULT_KEY, id)
}

export function lastResultId(): string | null {
  return read(LAST_RESULT_KEY)
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null // armazenamento bloqueado (ex.: modo privado restrito)
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Sem armazenamento: o quiz continua funcionando, só não é retomável.
  }
}
