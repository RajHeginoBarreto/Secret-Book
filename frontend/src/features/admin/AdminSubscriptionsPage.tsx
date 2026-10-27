import { useState } from 'react'
import { queryString, type Page } from '../../api/client'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDateTime } from '../account/accountTypes'
import type { AdminSubscription } from './adminTypes'
import styles from './Admin.module.css'

export function AdminSubscriptionsPage() {
  usePageTitle('Assinaturas — painel')
  const [page, setPage] = useState(0)
  const subscriptions = useApi<Page<AdminSubscription>>(`/api/admin/subscriptions${queryString({ page, size: 20 })}`)

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinaturas</h1>
          <p className={styles.subtitle}>Assinaturas demonstrativas: nenhuma cobrança foi feita.</p>
        </div>
      </header>
      {subscriptions.error && <ErrorState error={subscriptions.error} onRetry={subscriptions.reload} />}
      {subscriptions.loading && !subscriptions.data && <LoadingState />}
      {subscriptions.data &&
        (subscriptions.data.content.length === 0 ? (
          <EmptyState title="Nenhuma assinatura ainda" />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Leitor</th>
                    <th scope="col">Plano</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Início</th>
                    <th scope="col">Cancelamento</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.data.content.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.userName}
                        <div className={styles.muted}>{item.username}</div>
                      </td>
                      <td>{item.planName}</td>
                      <td>
                        <span className={`${styles.status} ${item.status === 'ACTIVE' ? styles.on : styles.off}`}>
                          {item.status === 'ACTIVE' ? 'Ativa' : 'Cancelada'}
                        </span>
                      </td>
                      <td>{formatDateTime(item.startedAt)}</td>
                      <td>{item.canceledAt ? formatDateTime(item.canceledAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={subscriptions.data.page} totalPages={subscriptions.data.totalPages} onChange={setPage} />
          </>
        ))}
    </>
  )
}
