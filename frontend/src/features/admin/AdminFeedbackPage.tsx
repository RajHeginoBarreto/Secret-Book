import { useState } from 'react'
import { Link } from 'react-router'
import { queryString, type Page } from '../../api/client'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDateTime } from '../account/accountTypes'
import type { AdminFeedback } from './adminTypes'
import styles from './Admin.module.css'

export function AdminFeedbackPage() {
  usePageTitle('Avaliações — painel')
  const [page, setPage] = useState(0)
  const feedback = useApi<Page<AdminFeedback>>(`/api/admin/feedback${queryString({ page, size: 20 })}`)

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Avaliações das recomendações</h1>
          <p className={styles.subtitle}>O que os leitores acharam dos livros recomendados pelo quiz.</p>
        </div>
      </header>
      {feedback.error && <ErrorState error={feedback.error} onRetry={feedback.reload} />}
      {feedback.loading && !feedback.data && <LoadingState />}
      {feedback.data &&
        (feedback.data.content.length === 0 ? (
          <EmptyState title="Nenhuma avaliação ainda" />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Leitor</th>
                    <th scope="col">Livro</th>
                    <th scope="col">Avaliação</th>
                    <th scope="col">Comentário</th>
                    <th scope="col">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.data.content.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.userName}
                        <div className={styles.muted}>{item.username}</div>
                      </td>
                      <td>
                        <Link to={`/livros/${item.bookSlug}`}>{item.bookTitle}</Link>
                      </td>
                      <td>
                        <span className={`${styles.status} ${item.useful ? styles.on : styles.off}`}>
                          {item.useful ? 'Combinou' : 'Não combina'}
                        </span>
                      </td>
                      <td>{item.comment ?? '—'}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={feedback.data.page} totalPages={feedback.data.totalPages} onChange={setPage} />
          </>
        ))}
    </>
  )
}
