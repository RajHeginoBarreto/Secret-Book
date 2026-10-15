import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { BookCover } from '../catalog/BookCover'
import type { FeedbackEntry } from './accountTypes'
import styles from './Account.module.css'

export function FeedbackPage() {
  usePageTitle('Minhas avaliações')
  const feedback = useApi<FeedbackEntry[]>('/api/me/feedback')
  const [error, setError] = useState<string | null>(null)

  const toggle = async (entry: FeedbackEntry) => {
    setError(null)
    try {
      const saved = await apiRequest<FeedbackEntry>(`/api/me/feedback/${entry.book.slug}`, {
        method: 'PUT',
        body: { useful: !entry.useful, comment: entry.comment, attemptId: entry.attemptId },
      })
      feedback.setData((feedback.data ?? []).map((item) => (item.book.slug === entry.book.slug ? saved : item)))
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const remove = async (entry: FeedbackEntry) => {
    setError(null)
    try {
      await apiRequest(`/api/me/feedback/${entry.book.slug}`, { method: 'DELETE' })
      feedback.setData((feedback.data ?? []).filter((item) => item.book.slug !== entry.book.slug))
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  return (
    <section aria-labelledby="avaliacoes-titulo">
      <h2 id="avaliacoes-titulo" className={styles.sectionTitle}>
        Avaliações das recomendações
      </h2>
      <p className={styles.muted} style={{ marginBottom: 16 }}>
        Livros marcados como "não combina" deixam de aparecer nas suas próximas recomendações.
      </p>
      {error && <Notice tone="danger">{error}</Notice>}
      {feedback.error && <ErrorState error={feedback.error} onRetry={feedback.reload} />}
      {feedback.loading && !feedback.data && <LoadingState />}
      {feedback.data &&
        (feedback.data.length === 0 ? (
          <EmptyState title="Nenhuma avaliação ainda" action={<Button to="/quiz">Fazer o quiz</Button>}>
            Avalie os livros no resultado do quiz para refinar as próximas recomendações.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {feedback.data.map((entry) => (
              <li key={entry.book.slug} className={styles.row}>
                <BookCover book={entry.book} size="sm" />
                <div>
                  <p className={styles.rowTitle}>
                    <Link to={`/livros/${entry.book.slug}`}>{entry.book.title}</Link>
                  </p>
                  <span className={`${styles.badge} ${entry.useful ? styles.badgeGood : styles.badgeBad}`}>
                    {entry.useful ? 'Combinou' : 'Não combina'}
                  </span>
                  {entry.comment && <p className={styles.muted}>“{entry.comment}”</p>}
                </div>
                <div className={styles.rowActions}>
                  <Button variant="outline" onClick={() => toggle(entry)}>
                    Mudar para "{entry.useful ? 'Não combina' : 'Combinou'}"
                  </Button>
                  <Button variant="ghost" aria-label={`Remover avaliação de ${entry.book.title}`} onClick={() => remove(entry)}>
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
