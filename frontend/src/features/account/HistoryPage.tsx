import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { pluralize } from '../../utils/format'
import { formatDateTime, type AttemptSummary } from './accountTypes'
import styles from './Account.module.css'

export function HistoryPage() {
  usePageTitle('Histórico do quiz')
  const history = useApi<AttemptSummary[]>('/api/me/quiz-attempts')

  return (
    <section aria-labelledby="historico-titulo">
      <h2 id="historico-titulo" className={styles.sectionTitle}>
        Histórico do quiz
      </h2>
      {history.error && <ErrorState error={history.error} onRetry={history.reload} />}
      {history.loading && !history.data && <LoadingState />}
      {history.data &&
        (history.data.length === 0 ? (
          <EmptyState title="Nenhum quiz por aqui ainda" action={<Button to="/quiz">Fazer o quiz</Button>}>
            Os quizzes que você fizer com a conta aberta aparecem aqui.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {history.data.map((attempt) => (
              <li key={attempt.id} className={styles.row} style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
                <div>
                  <p className={styles.rowTitle}>{attempt.profileName}</p>
                  <p className={styles.muted}>
                    {formatDateTime(attempt.createdAt)} ·{' '}
                    {pluralize(attempt.recommendedTitles.length, 'livro recomendado', 'livros recomendados')}
                  </p>
                </div>
                <Button to={`/quiz/resultado/${attempt.id}`} variant="outline">
                  Ver resultado
                </Button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
