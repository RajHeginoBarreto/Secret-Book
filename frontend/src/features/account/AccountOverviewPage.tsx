import { useState } from 'react'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatPrice, pluralize } from '../../utils/format'
import { formatDate, type AttemptSummary, type LibraryEntry, type Subscription } from './accountTypes'
import styles from './Account.module.css'

export function AccountOverviewPage() {
  usePageTitle('Minha conta')
  const subscription = useApi<Subscription | undefined>('/api/me/subscription')
  const history = useApi<AttemptSummary[]>('/api/me/quiz-attempts')
  const library = useApi<LibraryEntry[]>('/api/me/library')
  const lastAttempt = history.data?.[0]
  const reading = library.data?.filter((entry) => entry.status === 'READING').length ?? 0
  const favorites = library.data?.filter((entry) => entry.favorite).length ?? 0

  return (
    <div className={styles.grid}>
      <section className={styles.panel} aria-labelledby="assinatura">
        <h2 id="assinatura">Assinatura</h2>
        {subscription.error && <ErrorState error={subscription.error} onRetry={subscription.reload} />}
        {subscription.loading && !subscription.data && <LoadingState />}
        {!subscription.loading && !subscription.error && (
          <SubscriptionSummary subscription={subscription.data} onCanceled={() => subscription.reload()} />
        )}
      </section>

      <section className={styles.panel} aria-labelledby="ultimo-quiz">
        <h2 id="ultimo-quiz">Último quiz</h2>
        {history.error && <ErrorState error={history.error} onRetry={history.reload} />}
        {history.data &&
          (lastAttempt ? (
            <>
              <p className={styles.stat}>{lastAttempt.profileName}</p>
              <p className={styles.muted}>
                Feito em {formatDate(lastAttempt.createdAt)} ·{' '}
                {pluralize(lastAttempt.recommendedTitles.length, 'livro recomendado', 'livros recomendados')}
              </p>
              <Button to={`/quiz/resultado/${lastAttempt.id}`} variant="outline">
                Ver resultado
              </Button>
            </>
          ) : (
            <>
              <p className={styles.muted}>Você ainda não fez o quiz com esta conta.</p>
              <Button to="/quiz">Fazer o quiz</Button>
            </>
          ))}
      </section>

      <section className={styles.panel} aria-labelledby="biblioteca-resumo">
        <h2 id="biblioteca-resumo">Biblioteca</h2>
        {library.error && <ErrorState error={library.error} onRetry={library.reload} />}
        {library.data && (
          <>
            <p className={styles.stat}>{library.data.length}</p>
            <p className={styles.muted}>
              {pluralize(reading, 'livro sendo lido', 'livros sendo lidos')} ·{' '}
              {pluralize(favorites, 'favorito', 'favoritos')}
            </p>
            <Button to="/minha-conta/biblioteca" variant="outline">
              Abrir biblioteca
            </Button>
          </>
        )}
      </section>
    </div>
  )
}

function SubscriptionSummary({ subscription, onCanceled }: { subscription?: Subscription; onCanceled: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!subscription) {
    return (
      <>
        <p className={styles.muted}>Você não tem assinatura demonstrativa ativa.</p>
        <Button to="/#planos">Ver planos</Button>
      </>
    )
  }

  const cancel = async () => {
    if (!window.confirm('Cancelar a assinatura demonstrativa?')) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest('/api/me/subscription', { method: 'DELETE' })
      onCanceled()
    } catch (caught) {
      setError(toApiError(caught).message)
      setBusy(false)
    }
  }

  return (
    <>
      <p className={styles.stat}>{subscription.plan.name}</p>
      <p className={styles.muted}>
        {formatPrice(subscription.plan.monthlyPriceCents / 100)}/mês (fictício) ·{' '}
        {pluralize(subscription.plan.booksPerMonth, 'livro', 'livros')} por mês · desde{' '}
        {formatDate(subscription.startedAt)}
      </p>
      <Notice>Demonstração: nada é cobrado e nenhum livro é enviado.</Notice>
      <div className={styles.rowActions} style={{ justifyContent: 'flex-start' }}>
        <Button to="/#planos" variant="outline">
          Trocar plano
        </Button>
        <Button variant="ghost" onClick={cancel} loading={busy}>
          Cancelar
        </Button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </>
  )
}
