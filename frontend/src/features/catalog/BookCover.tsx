import { authorNames, type BookSummary } from './catalogTypes'
import styles from './BookCover.module.css'

interface BookCoverProps {
  book: Pick<BookSummary, 'title' | 'authors' | 'coverColor'>
  size?: 'sm' | 'md' | 'lg'
}

/** Capa ilustrativa gerada a partir da cor do livro (o catálogo demonstrativo não tem imagens). */
export function BookCover({ book, size = 'md' }: BookCoverProps) {
  const dark = isDark(book.coverColor)
  return (
    <div
      className={`${styles.cover} ${styles[size]} ${dark ? styles.onDark : styles.onLight}`}
      style={{ backgroundColor: book.coverColor }}
      aria-hidden="true"
    >
      <span className={styles.spine} />
      <span className={styles.title}>{book.title}</span>
      <span className={styles.author}>{authorNames(book)}</span>
    </div>
  )
}

/** Decide a cor do texto pela luminância do fundo, para manter o contraste legível. */
function isDark(hex: string): boolean {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  if (Number.isNaN(value)) return true
  const channel = (shift: number) => {
    const c = ((value >> shift) & 0xff) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
  return luminance < 0.22
}
