import { Plus, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { queryString, type Page } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDateTime } from '../account/accountTypes'
import type { AdminBookRow } from './adminTypes'
import styles from './Admin.module.css'

export function AdminBooksPage() {
  usePageTitle('Livros — painel')
  const [params, setParams] = useSearchParams()
  const query = params.get('busca') ?? ''
  const page = Math.max(0, Number.parseInt(params.get('pagina') ?? '1', 10) - 1 || 0)
  const books = useApi<Page<AdminBookRow>>(`/api/admin/books${queryString({ q: query, page, size: 20 })}`)

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get('busca') ?? '').trim()
    setParams(text ? { busca: text } : {})
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Livros</h1>
          <p className={styles.subtitle}>Livros inativos não aparecem no catálogo nem nas recomendações.</p>
        </div>
        <Button to="/admin/livros/novo">
          <Plus size={18} aria-hidden="true" /> Novo livro
        </Button>
      </header>

      <form className={styles.toolbar} role="search" onSubmit={handleSearch}>
        <label htmlFor="busca-admin-livros" className="visually-hidden">
          Buscar por título ou autor
        </label>
        <input
          key={query}
          id="busca-admin-livros"
          name="busca"
          type="search"
          defaultValue={query}
          placeholder="Buscar por título ou autor"
          className={styles.search}
        />
        <Button type="submit" variant="outline">
          <Search size={16} aria-hidden="true" /> Buscar
        </Button>
      </form>

      {books.error && <ErrorState error={books.error} onRetry={books.reload} />}
      {books.loading && !books.data && <LoadingState />}
      {books.data &&
        (books.data.content.length === 0 ? (
          <EmptyState title="Nenhum livro encontrado" />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Título</th>
                    <th scope="col">Autoria</th>
                    <th scope="col">Gêneros</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Atualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {books.data.content.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <Link to={`/admin/livros/${book.id}`}>{book.title}</Link>
                      </td>
                      <td>{book.authors.join(', ')}</td>
                      <td>{book.genres.join(', ')}</td>
                      <td>
                        <span className={`${styles.status} ${book.active ? styles.on : styles.off}`}>
                          {book.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{formatDateTime(book.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={books.data.page}
              totalPages={books.data.totalPages}
              onChange={(next) => {
                const nextParams = new URLSearchParams(params)
                if (next > 0) nextParams.set('pagina', String(next + 1))
                else nextParams.delete('pagina')
                setParams(nextParams)
              }}
            />
          </>
        ))}
    </>
  )
}
