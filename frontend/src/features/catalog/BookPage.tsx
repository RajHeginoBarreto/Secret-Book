import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { NotFoundPage } from '../misc/NotFoundPage'
import { BookCover } from './BookCover'
import {
  CONTENT_NOTE_LABELS,
  LENGTH_LABELS,
  PACE_LABELS,
  TONE_LABELS,
  type BookDetail,
} from './catalogTypes'
import styles from './BookPage.module.css'
import { LibraryActions } from '../account/LibraryActions'

export function BookPage() {
  const { slug = '' } = useParams()
  const book = useApi<BookDetail>(`/api/books/${encodeURIComponent(slug)}`)
  usePageTitle(book.data?.title ?? 'Livro')

  if (book.error?.status === 404) return <NotFoundPage />

  return (
    <div className={styles.page}>
      <Link to="/catalogo" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar ao catálogo
      </Link>

      {book.error && <ErrorState error={book.error} onRetry={book.reload} />}
      {book.loading && !book.data && <LoadingState label="Carregando livro…" />}

      {book.data && (
        <article className={styles.layout}>
          <div className={styles.coverColumn}>
            <BookCover book={book.data} size="lg" />
            <LibraryActions bookSlug={book.data.slug} />
          </div>

          <div className={styles.info}>
            <p className={styles.genres}>
              {book.data.genres.map((genre) => (
                <Link key={genre.slug} to={`/catalogo?genero=${genre.slug}`}>
                  {genre.name}
                </Link>
              ))}
            </p>
            <h1 className={styles.title}>{book.data.title}</h1>
            <p className={styles.authors}>
              por{' '}
              {book.data.authors.map((author, index) => (
                <span key={author.slug}>
                  {index > 0 && ' e '}
                  <Link to={`/autores/${author.slug}`}>{author.name}</Link>
                </span>
              ))}
            </p>

            <dl className={styles.facts}>
              <div>
                <dt>Páginas</dt>
                <dd>
                  {book.data.pages} ({LENGTH_LABELS[book.data.length].toLowerCase()})
                </dd>
              </div>
              <div>
                <dt>Ritmo</dt>
                <dd>{PACE_LABELS[book.data.pace]}</dd>
              </div>
              <div>
                <dt>Clima</dt>
                <dd>{TONE_LABELS[book.data.tone]}</dd>
              </div>
              {book.data.publicationYear && (
                <div>
                  <dt>Ano</dt>
                  <dd>{book.data.publicationYear}</dd>
                </div>
              )}
            </dl>

            <h2 className={styles.sectionTitle}>Sinopse</h2>
            <p className={styles.synopsis}>{book.data.synopsis}</p>

            <h2 className={styles.sectionTitle}>Pistas do cartão</h2>
            <ul className={styles.clues}>
              {book.data.clues.map((clue) => (
                <li key={clue}>{clue}</li>
              ))}
            </ul>

            <h2 className={styles.sectionTitle}>Temas sensíveis</h2>
            {book.data.contentNotes.length > 0 ? (
              <ul className={styles.notes}>
                {book.data.contentNotes.map((note) => (
                  <li key={note}>{CONTENT_NOTE_LABELS[note]}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Nenhum tema sensível sinalizado.</p>
            )}

            <p className={styles.disclaimer}>Livro fictício do catálogo demonstrativo.</p>
          </div>
        </article>
      )}
    </div>
  )
}
