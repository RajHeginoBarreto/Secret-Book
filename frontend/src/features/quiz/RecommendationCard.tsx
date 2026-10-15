import { BookmarkPlus, Eye, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { BookCover } from '../catalog/BookCover'
import { authorNames } from '../catalog/catalogTypes'
import { ClueCard } from '../landing/components/ClueCard'
import type { Recommendation } from './quizTypes'
import styles from './QuizResult.module.css'

interface RecommendationCardProps {
  recommendation: Recommendation
  attemptId: string
  initialFeedback?: boolean
  canGiveFeedback: boolean
}

export function RecommendationCard({ recommendation, attemptId, initialFeedback, canGiveFeedback }: RecommendationCardProps) {
  const { book, score, reasons, breakdown, position } = recommendation
  const [revealed, setRevealed] = useState(false)
  const detailsId = useId()

  return (
    <article className={styles.card} aria-label={`Livro-surpresa ${position}`}>
      <header className={styles.cardHeader}>
        <span className={styles.rank}>Pacote {position}</span>
        <span className={styles.score} title="Afinidade calculada a partir das suas respostas">
          Afinidade <b>{score}</b>/100
        </span>
      </header>

      <div className={styles.cardBody}>
        <div className={styles.reveal}>
          {revealed ? (
            <div id={detailsId} className={styles.revealed}>
              <BookCover book={book} size="sm" />
              <div>
                <h4 className={styles.bookTitle}>
                  <Link to={`/livros/${book.slug}`}>{book.title}</Link>
                </h4>
                <p className={styles.bookMeta}>{authorNames(book)}</p>
                <p className={styles.bookMeta}>{book.genres.map((genre) => genre.name).join(' · ')}</p>
              </div>
            </div>
          ) : (
            <ClueCard compact label="Pistas" title={`Livro-surpresa nº ${position}`} keywords={book.clues} />
          )}
          <Button
            variant="outline"
            onClick={() => setRevealed((current) => !current)}
            aria-expanded={revealed}
            aria-controls={revealed ? detailsId : undefined}
          >
            <Eye size={16} aria-hidden="true" /> {revealed ? 'Embrulhar de novo' : 'Revelar o livro'}
          </Button>
        </div>

        <div className={styles.why}>
          <h4 className={styles.whyTitle}>Por que este livro</h4>
          <ul className={styles.reasons}>
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <dl className={styles.breakdown} aria-label="Afinidade por critério (0 a 100)">
            <div>
              <dt>Gênero</dt>
              <dd>{breakdown.genre}</dd>
            </div>
            <div>
              <dt>Ritmo</dt>
              <dd>{breakdown.pace}</dd>
            </div>
            <div>
              <dt>Clima</dt>
              <dd>{breakdown.tone}</dd>
            </div>
            <div>
              <dt>Tamanho</dt>
              <dd>{breakdown.length}</dd>
            </div>
          </dl>
          {canGiveFeedback && (
            <FeedbackButtons bookSlug={book.slug} attemptId={attemptId} initial={initialFeedback} />
          )}
        </div>
      </div>
    </article>
  )
}

function FeedbackButtons({ bookSlug, attemptId, initial }: { bookSlug: string; attemptId: string; initial?: boolean }) {
  const [useful, setUseful] = useState<boolean | undefined>(initial)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const current = useful ?? initial

  const send = async (value: boolean) => {
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/me/feedback/${bookSlug}`, { method: 'PUT', body: { useful: value, attemptId } })
      setUseful(value)
      setSaved(value ? 'Anotado: este livro combinou com você.' : 'Anotado: ele não volta nas próximas recomendações.')
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  const addToLibrary = async () => {
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/me/library/${bookSlug}`, { method: 'PUT', body: { status: 'WANT_TO_READ', favorite: false } })
      setSaved('Adicionado à sua biblioteca como "Quero ler".')
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.feedback}>
      <span className={styles.feedbackLabel}>Esta recomendação combinou com você?</span>
      <div className={styles.feedbackButtons}>
        <Button variant={current === true ? 'primary' : 'outline'} aria-pressed={current === true} disabled={busy} onClick={() => send(true)}>
          <ThumbsUp size={16} aria-hidden="true" /> Combinou
        </Button>
        <Button variant={current === false ? 'primary' : 'outline'} aria-pressed={current === false} disabled={busy} onClick={() => send(false)}>
          <ThumbsDown size={16} aria-hidden="true" /> Não combina
        </Button>
        <Button variant="ghost" disabled={busy} onClick={addToLibrary}>
          <BookmarkPlus size={16} aria-hidden="true" /> Quero ler
        </Button>
      </div>
      <p className={error ? styles.feedbackError : styles.feedbackSaved} role="status">
        {error ?? saved}
      </p>
    </div>
  )
}
