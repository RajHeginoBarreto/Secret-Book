import { useParams } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { NotFoundPage } from '../misc/NotFoundPage'
import { BookCard } from './BookCard'
import type { AuthorDetail } from './catalogTypes'
import styles from './CatalogPage.module.css'

export function AuthorPage() {
  const { slug = '' } = useParams()
  const author = useApi<AuthorDetail>(`/api/authors/${encodeURIComponent(slug)}`)
  usePageTitle(author.data?.name ?? 'Autor')

  if (author.error?.status === 404) return <NotFoundPage />

  return (
    <>
      <PageHeader eyebrow="Autor fictício" title={author.data?.name ?? 'Autor'} description={author.data?.bio} />
      <div className={styles.page}>
        {author.error && <ErrorState error={author.error} onRetry={author.reload} />}
        {author.loading && !author.data && <LoadingState />}
        {author.data &&
          (author.data.books.length === 0 ? (
            <EmptyState title="Nenhum livro disponível no momento" />
          ) : (
            <section aria-labelledby="livros-autor">
              <h2 id="livros-autor" className={styles.results}>
                Livros de {author.data.name}
              </h2>
              <ul className={styles.grid}>
                {author.data.books.map((book) => (
                  <li key={book.slug}>
                    <BookCard book={book} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </>
  )
}
