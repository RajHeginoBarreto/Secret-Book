import { Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { queryString, type Page } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { pluralize } from '../../utils/format'
import { BookCard } from './BookCard'
import type { BookSummary, Genre } from './catalogTypes'
import styles from './CatalogPage.module.css'

const PAGE_SIZE = 12

export function CatalogPage() {
  usePageTitle('Catálogo')
  const [params, setParams] = useSearchParams()
  const genre = params.get('genero') ?? ''
  const query = params.get('busca') ?? ''
  const page = Math.max(0, Number.parseInt(params.get('pagina') ?? '1', 10) - 1 || 0)

  const genres = useApi<Genre[]>('/api/genres')
  const books = useApi<Page<BookSummary>>(
    `/api/books${queryString({ genre, q: query, page, size: PAGE_SIZE })}`,
  )

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get('busca') ?? '').trim()
    update({ busca: text || null, pagina: null })
  }

  const hasFilters = Boolean(genre || query)

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Explore as histórias da estante"
        description="Navegue pelos livros por gênero ou procure por título e autor. No clube, eles chegam embrulhados, com pistas."
      />

      <div className={styles.page}>
        <Notice>Catálogo demonstrativo: todos os livros e autores são fictícios, criados para este protótipo.</Notice>

        <div className={styles.toolbar}>
          <form className={styles.search} role="search" onSubmit={handleSearch}>
            <label htmlFor="busca-catalogo" className="visually-hidden">
              Buscar por título ou autor
            </label>
            <input
              key={query}
              id="busca-catalogo"
              name="busca"
              type="search"
              defaultValue={query}
              placeholder="Buscar por título ou autor"
              className={styles.input}
            />
            <Button type="submit">
              <Search size={18} aria-hidden="true" /> Buscar
            </Button>
          </form>

          <div className={styles.filters} role="group" aria-label="Filtrar por gênero">
            <button
              type="button"
              className={styles.chip}
              aria-pressed={!genre}
              onClick={() => update({ genero: null, pagina: null })}
            >
              Todos
            </button>
            {genres.data?.map((item) => (
              <button
                key={item.slug}
                type="button"
                className={styles.chip}
                aria-pressed={genre === item.slug}
                onClick={() => update({ genero: item.slug, pagina: null })}
              >
                {item.name} <span className={styles.count}>{item.bookCount}</span>
              </button>
            ))}
          </div>
        </div>

        {books.error && <ErrorState error={books.error} onRetry={books.reload} />}
        {!books.data && books.loading && <LoadingState label="Carregando livros…" />}

        {books.data && (
          <section aria-labelledby="resultados" aria-busy={books.loading}>
            <h2 id="resultados" className={styles.results} aria-live="polite">
              {pluralize(books.data.totalElements, 'livro encontrado', 'livros encontrados')}
            </h2>

            {books.data.content.length === 0 ? (
              <EmptyState
                title="Nenhum livro por aqui"
                action={
                  hasFilters && (
                    <Button variant="outline" onClick={() => update({ genero: null, busca: null, pagina: null })}>
                      Limpar filtros
                    </Button>
                  )
                }
              >
                Tente outro termo de busca ou outro gênero.
              </EmptyState>
            ) : (
              <ul className={styles.grid}>
                {books.data.content.map((book) => (
                  <li key={book.slug}>
                    <BookCard book={book} />
                  </li>
                ))}
              </ul>
            )}

            <Pagination
              page={books.data.page}
              totalPages={books.data.totalPages}
              onChange={(next) => update({ pagina: next > 0 ? String(next + 1) : null })}
            />
          </section>
        )}
      </div>
    </>
  )
}
