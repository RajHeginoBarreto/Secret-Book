import { Heart, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { BookCover } from '../catalog/BookCover'
import { authorNames } from '../catalog/catalogTypes'
import { READING_STATUS_LABELS, type LibraryEntry, type ReadingStatus } from './accountTypes'
import styles from './Account.module.css'

type Filter = 'ALL' | ReadingStatus | 'FAVORITES'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'WANT_TO_READ', label: 'Quero ler' },
  { value: 'READING', label: 'Lendo' },
  { value: 'READ', label: 'Lidos' },
  { value: 'FAVORITES', label: 'Favoritos' },
]

export function LibraryPage() {
  usePageTitle('Minha biblioteca')
  const library = useApi<LibraryEntry[]>('/api/me/library')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [error, setError] = useState<string | null>(null)

  const update = async (entry: LibraryEntry, status: ReadingStatus | null, favorite: boolean) => {
    setError(null)
    try {
      const saved = await apiRequest<LibraryEntry>(`/api/me/library/${entry.book.slug}`, {
        method: 'PUT',
        body: { status, favorite },
      })
      const removed = saved.status === null && !saved.favorite
      library.setData(
        (library.data ?? []).flatMap((item) =>
          item.book.slug === entry.book.slug ? (removed ? [] : [saved]) : [item],
        ),
      )
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const entries = (library.data ?? []).filter((entry) =>
    filter === 'ALL' ? true : filter === 'FAVORITES' ? entry.favorite : entry.status === filter,
  )

  return (
    <section aria-labelledby="biblioteca-titulo">
      <h2 id="biblioteca-titulo" className={styles.sectionTitle}>
        Minha biblioteca
      </h2>
      <div className={styles.filters} role="group" aria-label="Filtrar biblioteca">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={styles.chip}
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <Notice tone="danger">{error}</Notice>}
      {library.error && <ErrorState error={library.error} onRetry={library.reload} />}
      {library.loading && !library.data && <LoadingState />}

      {library.data &&
        (entries.length === 0 ? (
          <EmptyState
            title={library.data.length === 0 ? 'Sua biblioteca está vazia' : 'Nada neste filtro'}
            action={<Button to="/catalogo">Explorar o catálogo</Button>}
          >
            Marque livros como "Quero ler", "Lendo" ou "Lido", ou favorite os que você amou.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.book.slug} className={styles.row}>
                <BookCover book={entry.book} size="sm" />
                <div>
                  <p className={styles.rowTitle}>
                    <Link to={`/livros/${entry.book.slug}`}>{entry.book.title}</Link>
                  </p>
                  <p className={styles.muted}>{authorNames(entry.book)}</p>
                </div>
                <div className={styles.rowActions}>
                  <label className="visually-hidden" htmlFor={`status-${entry.book.slug}`}>
                    Status de leitura de {entry.book.title}
                  </label>
                  <select
                    id={`status-${entry.book.slug}`}
                    value={entry.status ?? ''}
                    onChange={(event) =>
                      update(entry, (event.target.value || null) as ReadingStatus | null, entry.favorite)
                    }
                  >
                    <option value="">Sem status</option>
                    {Object.entries(READING_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant={entry.favorite ? 'primary' : 'outline'}
                    aria-pressed={entry.favorite}
                    aria-label={`Favorito: ${entry.book.title}`}
                    onClick={() => update(entry, entry.status, !entry.favorite)}
                  >
                    <Heart size={16} aria-hidden="true" fill={entry.favorite ? 'currentColor' : 'none'} />
                  </Button>
                  <Button
                    variant="ghost"
                    aria-label={`Remover ${entry.book.title} da biblioteca`}
                    onClick={() => update(entry, null, false)}
                  >
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
