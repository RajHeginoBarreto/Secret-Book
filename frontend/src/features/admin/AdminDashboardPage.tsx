import { ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { CountItem, Stats } from './adminTypes'
import styles from './Admin.module.css'

export function AdminDashboardPage() {
  usePageTitle('Painel administrativo')
  const stats = useApi<Stats>('/api/admin/stats')

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Visão geral</h1>
          <p className={styles.subtitle}>Números do protótipo (dados demonstrativos).</p>
        </div>
      </header>

      {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} />}
      {stats.loading && !stats.data && <LoadingState />}
      {stats.data && <StatsView stats={stats.data} />}
    </>
  )
}

function StatsView({ stats }: { stats: Stats }) {
  const totalFeedback = stats.usefulFeedback + stats.notUsefulFeedback
  const usefulRate = totalFeedback === 0 ? null : Math.round((stats.usefulFeedback / totalFeedback) * 100)
  return (
    <>
      <div className={styles.cards}>
        <StatCard label="Usuários" value={stats.users} note={`${stats.readers} leitores · ${stats.admins} admins`} />
        <StatCard label="Livros ativos" value={stats.activeBooks} note={`${stats.totalBooks} cadastrados`} />
        <StatCard label="Quizzes feitos" value={stats.quizAttempts} note={`${stats.quizAttemptsLast30Days} nos últimos 30 dias`} />
        <StatCard label="Assinaturas ativas" value={stats.activeSubscriptions} note="Demonstrativas" />
        <StatCard
          label="Recomendações aprovadas"
          value={usefulRate === null ? '—' : `${usefulRate}%`}
          note={`${totalFeedback} avaliações`}
        />
      </div>
      <div className={styles.panels}>
        <CountPanel title="Livros mais recomendados" items={stats.mostRecommendedBooks} empty="Ninguém fez o quiz ainda." />
        <CountPanel title="Assinaturas por plano" items={stats.subscriptionsByPlan} empty="Nenhuma assinatura ativa." />
      </div>
    </>
  )
}

function StatCard({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{label}</p>
      <p className={styles.cardValue}>{value}</p>
      <p className={styles.cardNote}>{note}</p>
    </div>
  )
}

function CountPanel({ title, items, empty }: { title: string; items: CountItem[]; empty: string }) {
  return (
    <section className={styles.panel} aria-label={title}>
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className={styles.muted}>{empty}</p>
      ) : (
        <ul className={styles.countList}>
          {items.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <b>{item.count}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
