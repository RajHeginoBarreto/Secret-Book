import { ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { formatDate, type BookComment } from '../account/accountTypes'
import { Stars } from '../account/ReviewEditor'
import styles from './BookComments.module.css'

/** Comentários públicos de quem já leu o livro (nome de usuário + nota + texto). */
export function BookComments({ bookSlug }: { bookSlug: string }) {
  const comments = useApi<BookComment[]>(`/api/books/${encodeURIComponent(bookSlug)}/comments`)

  return (
    <section className={styles.section} aria-labelledby="comentarios">
      <h2 id="comentarios" className={styles.title}>
        Comentários de quem leu
      </h2>
      {comments.error && <ErrorState error={comments.error} onRetry={comments.reload} />}
      {comments.loading && !comments.data && <LoadingState label="Carregando comentários…" />}
      {comments.data &&
        (comments.data.length === 0 ? (
          <p className={styles.empty}>Ninguém comentou ainda. Já leu? Marque como “Lido” e seja a primeira voz aqui.</p>
        ) : (
          <ul className={styles.list}>
            {comments.data.map((comment) => (
              <li key={`${comment.author}-${comment.reviewedAt}`} className={styles.item}>
                <p className={styles.meta}>
                  <span className={styles.avatar} aria-hidden="true">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                  <strong>{comment.author}</strong>
                  <Stars rating={comment.rating} />
                  <time dateTime={comment.reviewedAt}>{formatDate(comment.reviewedAt)}</time>
                </p>
                <blockquote>{comment.comment}</blockquote>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}
