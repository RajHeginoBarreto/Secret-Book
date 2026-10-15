import { GENRE_LABELS, PROFILES, type GenreKey, type Profile, type QuizQuestion } from './quizData'

/** Uma resposta é o índice da opção escolhida; null = ainda não respondida. */
export type Answer = number | null

export interface GenreScore {
  genre: GenreKey
  label: string
  points: number
  /** Fração das respostas que apontaram para este gênero (0 a 1). */
  share: number
}

export interface QuizResult {
  profileKey: string
  profile: Profile
  ranking: GenreScore[]
  keywords: string[]
  answeredCount: number
}

/** Quantidade mínima de pontos para o segundo gênero entrar na combinação do perfil. */
export const MIX_THRESHOLD = 2
const MAX_KEYWORDS = 4

export function isComplete(questions: QuizQuestion[], answers: Answer[]): boolean {
  return questions.every((question, index) => {
    const answer = answers[index]
    return answer !== null && answer !== undefined && answer >= 0 && answer < question.options.length
  })
}

/**
 * Calcula o perfil literário a partir das respostas.
 *
 * Regras (as mesmas do quiz original, agora testadas):
 * 1. Cada resposta soma 1 ponto ao gênero da opção escolhida.
 * 2. Ranking por pontos. Empate: vence o gênero escolhido mais recentemente,
 *    pois as últimas perguntas falam mais do livro em si.
 * 3. Se o 2º gênero tiver pelo menos MIX_THRESHOLD pontos, o perfil é a
 *    combinação dos dois primeiros; caso contrário, é o gênero principal puro.
 * 4. As palavras-chave vêm das respostas dos gêneros que compõem o perfil.
 */
export function computeQuizResult(questions: QuizQuestion[], answers: Answer[]): QuizResult {
  if (!isComplete(questions, answers)) {
    throw new Error('O quiz precisa estar completo para calcular o resultado.')
  }

  const chosen = questions.map((question, index) => question.options[answers[index] as number]!)

  const points = new Map<GenreKey, number>()
  const lastSeen = new Map<GenreKey, number>()
  chosen.forEach((option, index) => {
    points.set(option.genre, (points.get(option.genre) ?? 0) + 1)
    lastSeen.set(option.genre, index)
  })

  const genres = [...points.keys()].sort(
    (a, b) => points.get(b)! - points.get(a)! || lastSeen.get(b)! - lastSeen.get(a)!,
  )

  const [main, second] = genres as [GenreKey, GenreKey | undefined]
  const profileGenres: GenreKey[] = second && points.get(second)! >= MIX_THRESHOLD ? [main, second] : [main]
  const profileKey = [...profileGenres].sort().join('+')
  const profile = PROFILES[profileKey]
  if (!profile) throw new Error(`Perfil não cadastrado: ${profileKey}`)

  const ranking: GenreScore[] = genres.map((genre) => ({
    genre,
    label: GENRE_LABELS[genre],
    points: points.get(genre)!,
    share: points.get(genre)! / chosen.length,
  }))

  const keywords = chosen
    .filter((option) => profileGenres.includes(option.genre))
    .map((option) => option.keyword)
    .slice(0, MAX_KEYWORDS)

  return { profileKey, profile, ranking, keywords, answeredCount: chosen.length }
}
