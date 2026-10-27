import { MessageSquareQuote, Star, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { formatDate, type LibraryEntry } from './accountTypes'
import styles from './Review.module.css'

/** Estrelinhas somente leitura. */
export function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <span className={styles.stars} aria-label={`Nota ${rating} de 5`} role="img">
      {'★'.repeat(rating)}
      <span aria-hidden="true">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

/**
 * Mostra e edita o comentário do leitor sobre um livro que ele já leu.
 * Só faz sentido para livros com status "Lido" (o backend recusa os demais).
 */
export function ReviewEditor({ entry, onSaved }: { entry: LibraryEntry; onSaved: (entry: LibraryEntry) => void }) {
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState<number | null>(entry.rating)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  const path = `/api/me/library/${encodeURIComponent(entry.book.slug)}/review`

  if (entry.status !== 'READ') return null

  if (!editing) {
    return entry.comment ? (
      <figure className={styles.view}>
        <Stars rating={entry.rating} />
        <blockquote>{entry.comment}</blockquote>
        <figcaption>
          {entry.reviewedAt && <span>comentado em {formatDate(entry.reviewedAt)}</span>}
          <button type="button" className={styles.link} onClick={() => setEditing(true)}>
            Editar comentário
          </button>
        </figcaption>
      </figure>
    ) : (
      <Button variant="outline" onClick={() => setEditing(true)}>
        <MessageSquareQuote size={16} aria-hidden="true" /> Comentar este livro
      </Button>
    )
  }

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const comment = String(new FormData(event.currentTarget).get('comment') ?? '').trim()
    if (!comment) {
      setError('Escreva um comentário.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onSaved(await apiRequest<LibraryEntry>(path, { method: 'PUT', body: { rating, comment } }))
      setEditing(false)
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Apagar seu comentário sobre este livro?')) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(path, { method: 'DELETE' })
      onSaved({ ...entry, rating: null, comment: null, reviewedAt: null })
      setRating(null)
      setEditing(false)
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={save} noValidate>
      <fieldset className={styles.rating}>
        <legend>Sua nota (opcional)</legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={rating !== null && value <= rating}
            aria-label={`${value} de 5`}
            onClick={() => setRating(rating === value ? null : value)}
          >
            <Star size={22} aria-hidden="true" fill={rating !== null && value <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </fieldset>
      <label htmlFor={`${id}-comentario`} className={styles.label}>
        Comentário sobre {entry.book.title}
      </label>
      <textarea
        id={`${id}-comentario`}
        name="comment"
        maxLength={1000}
        rows={4}
        defaultValue={entry.comment ?? ''}
        placeholder="O que você achou? Sem spoilers do final, combinado?"
        className={styles.textarea}
      />
      <p className={styles.hint}>Aparece na página do livro com o seu nome de usuário.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={busy}>
          Publicar comentário
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>
          Cancelar
        </Button>
        {entry.comment && (
          <Button variant="ghost" onClick={remove} disabled={busy} aria-label="Apagar comentário">
            <Trash2 size={16} aria-hidden="true" /> Apagar
          </Button>
        )}
      </div>
    </form>
  )
}
