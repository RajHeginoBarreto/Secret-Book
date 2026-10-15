import { RotateCcw } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { pluralize } from '../../utils/format'
import { useAuth } from '../auth/AuthContext'
import { CONTENT_NOTE_LABELS, LENGTH_LABELS, PACE_LABELS, TONE_LABELS } from '../catalog/catalogTypes'
import { NotFoundPage } from '../misc/NotFoundPage'
import type { FeedbackEntry } from '../account/accountTypes'
import { QuizShell } from './QuizPage'
import { clearQuizProgress } from './quizStorage'
import type { QuizResult } from './quizTypes'
import { RecommendationCard } from './RecommendationCard'
import styles from './QuizPage.module.css'
import resultStyles from './QuizResult.module.css'

export function QuizResultPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const fromSubmit = (location.state as { result?: QuizResult } | null)?.result
  const initial = fromSubmit?.id === id ? fromSubmit : undefined
  const fetched = useApi<QuizResult>(initial ? null : `/api/quiz/attempts/${encodeURIComponent(id)}`)
  const result = initial ?? fetched.data
  usePageTitle(result ? `Perfil: ${result.profile.name}` : 'Resultado do quiz')

  if (fetched.error?.status === 404 || fetched.error?.status === 400) return <NotFoundPage />

  return (
    <QuizShell wide>
      {fetched.error && <ErrorState error={fetched.error} onRetry={fetched.reload} />}
      {!result && !fetched.error && <LoadingState label="Carregando seu resultado…" />}
      {result && <ResultView result={result} />}
    </QuizShell>
  )
}

function ResultView({ result }: { result: QuizResult }) {
  const navigate = useNavigate()
  const { status } = useAuth()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const feedback = useApi<FeedbackEntry[]>(status === 'authenticated' ? '/api/me/feedback' : null)
  const feedbackBySlug = new Map((feedback.data ?? []).map((entry) => [entry.book.slug, entry.useful]))

  useEffect(() => {
    headingRef.current?.focus()
  }, [result.id])

  const restart = () => {
    clearQuizProgress()
    navigate('/quiz')
  }

  const { preferences } = result
  return (
    <div className={styles.result}>
      <span className={styles.resultEyebrow}>
        <span aria-hidden="true">✦ </span>Seu perfil literário
      </span>
      <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
        {result.profile.name}
      </h2>
      <p className={styles.resultText}>{result.profile.description}</p>

      <div className={resultStyles.summary}>
        <section aria-labelledby="distribuicao">
          <h3 id="distribuicao" className={styles.subTitle}>
            Gêneros nas suas respostas
          </h3>
          <ul className={styles.affinity}>
            {result.genres.map((genre) => (
              <li key={genre.slug} className={styles.affinityRow}>
                <span>{genre.name}</span>
                <span className={styles.bar} aria-hidden="true">
                  <i style={{ width: `${genre.percent}%` }} />
                </span>
                <b>{genre.percent}%</b>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="preferencias">
          <h3 id="preferencias" className={styles.subTitle}>
            O que você pediu
          </h3>
          <ul className={resultStyles.prefs}>
            {preferences.pace && <li>Ritmo {PACE_LABELS[preferences.pace].toLowerCase()}</li>}
            {preferences.tone && <li>Clima {TONE_LABELS[preferences.tone].toLowerCase()}</li>}
            <li>
              {preferences.length ? `Leitura ${LENGTH_LABELS[preferences.length].toLowerCase()}` : 'Qualquer tamanho'}
            </li>
            {preferences.avoid.map((note) => (
              <li key={note} className={resultStyles.avoid}>
                Sem {CONTENT_NOTE_LABELS[note].toLowerCase()}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h3 className={resultStyles.recsTitle}>Seus livros-surpresa</h3>
      <p className={resultStyles.recsIntro}>
        Como no clube, cada livro chega embrulhado: leia as pistas e revele só se quiser.
      </p>

      {status !== 'authenticated' && (
        <div className={resultStyles.notice}>
          <Notice>
            Entre na sua conta para guardar o próximo resultado no histórico, avaliar as recomendações e montar sua
            biblioteca.
          </Notice>
        </div>
      )}

      {result.recommendations.length === 0 ? (
        <Notice>
          Nenhum livro do catálogo atende a todos os seus filtros agora. Tente liberar algum tema ou refazer o quiz.
        </Notice>
      ) : (
        <ol className={resultStyles.recs}>
          {result.recommendations.map((recommendation) => (
            <li key={recommendation.book.slug}>
              <RecommendationCard
                recommendation={recommendation}
                attemptId={result.id}
                initialFeedback={feedbackBySlug.get(recommendation.book.slug)}
                canGiveFeedback={status === 'authenticated'}
              />
            </li>
          ))}
        </ol>
      )}

      <p className={styles.disclaimer}>
        A afinidade (0 a 100) combina gênero, ritmo, clima e tamanho com pesos definidos pela equipe; não é uma
        probabilidade de você gostar.
        {result.excludedCount > 0 &&
          ` ${pluralize(result.excludedCount, 'livro ficou', 'livros ficaram')} de fora por temas que você pediu para evitar ou por já estar(em) lido(s) ou descartado(s).`}{' '}
        Livros e autores são fictícios.
      </p>

      <div className={styles.resultActions}>
        <Button to="/catalogo">Explorar o catálogo</Button>
        <Button to="/#planos" variant="outline">
          Ver planos
        </Button>
        <Button variant="ghost" onClick={restart}>
          <RotateCcw size={16} aria-hidden="true" /> Refazer o quiz
        </Button>
      </div>
    </div>
  )
}
