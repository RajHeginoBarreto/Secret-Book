import { Link } from 'react-router'
import { BookCover } from './BookCover'
import { authorNames, LENGTH_LABELS, PACE_LABELS, type BookSummary } from './catalogTypes'
import styles from './BookCard.module.css'

export function BookCard({ book }: { book: BookSummary }) {
  return (
    <article className={styles.card}>
      <BookCover book={book} />
      <div className={styles.body}>
        <p className={styles.genres}>{book.genres.map((genre) => genre.name).join(' · ')}</p>
        <h3 className={styles.title}>
          {/* O link cobre o cartão inteiro (ver CSS), mantendo um único destino acessível. */}
          <Link to={`/livros/${book.slug}`} className={styles.link}>
            {book.title}
          </Link>
        </h3>
        <p className={styles.author}>{authorNames(book)}</p>
        <p className={styles.meta}>
          {book.pages} páginas · {LENGTH_LABELS[book.length]} · ritmo {PACE_LABELS[book.pace].toLowerCase()}
        </p>
      </div>
    </article>
  )
}
