import type { BookDetail, ContentNote, LengthCategory, Pace, Tone } from '../catalog/catalogTypes'

export interface QuizOption {
  slug: string
  text: string
  /** Não pode ser combinada com outras opções (ex.: "Nenhum"). */
  exclusive: boolean
}

export interface QuizQuestion {
  slug: string
  text: string
  helpText: string | null
  multiple: boolean
  required: boolean
  /** A pergunta só aparece se esta opção foi escolhida. */
  condition: { question: string; option: string } | null
  options: QuizOption[]
}

export interface QuizDefinition {
  questions: QuizQuestion[]
}

/** slug da pergunta → slugs das opções escolhidas */
export type Answers = Record<string, string[]>

export interface QuizResult {
  id: string
  createdAt: string
  profile: { key: string; name: string; description: string }
  genres: { slug: string; name: string; points: number; percent: number }[]
  preferences: { pace: Pace | null; tone: Tone | null; length: LengthCategory | null; avoid: ContentNote[] }
  recommendations: Recommendation[]
  excludedCount: number
}

export interface Recommendation {
  position: number
  /** Afinidade de 0 a 100: média ponderada dos critérios (não é probabilidade de gostar). */
  score: number
  breakdown: { genre: number; pace: number; tone: number; length: number }
  reasons: string[]
  book: BookDetail
}

/** Perguntas visíveis para as respostas atuais (as condicionais só entram quando liberadas). */
export function visibleQuestions(questions: QuizQuestion[], answers: Answers): QuizQuestion[] {
  return questions.filter(
    (question) =>
      !question.condition || (answers[question.condition.question] ?? []).includes(question.condition.option),
  )
}

/** Mantém só as respostas de perguntas visíveis, para não enviar respostas "órfãs". */
export function pruneAnswers(questions: QuizQuestion[], answers: Answers): Answers {
  const visible = visibleQuestions(questions, answers)
  return Object.fromEntries(
    visible.filter((question) => (answers[question.slug] ?? []).length > 0).map((q) => [q.slug, answers[q.slug]!]),
  )
}
