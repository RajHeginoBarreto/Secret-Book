import { BookCheck, Heart, Plus, Search, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { apiRequest, queryString, toApiError, type Page } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { pluralize } from '../../utils/format'
import { useAuth } from '../auth/AuthContext'
import { BookCover } from '../catalog/BookCover'
import { authorNames, type BookSummary } from '../catalog/catalogTypes'
import { LITERARY_TYPES, type LibraryEntry, type ReaderProfile, type ReadingStatus } from './accountTypes'
import { ReviewEditor, Stars } from './ReviewEditor'
import styles from './ReaderProfile.module.css'

type ShelfTab = 'READ' | 'FAVORITES'

/** Perfil de leitor: estante (favoritos e lidos com comentários), gêneros que gosta/não gosta e autores do coração. */
export function ReaderProfilePage() {
  usePageTitle('Meu perfil de leitor')
  const { user } = useAuth()
  const library = useApi<LibraryEntry[]>('/api/me/library')
  const profile = useApi<ReaderProfile>('/api/me/reader-profile')
  const [tab, setTab] = useState<ShelfTab>('READ')

  const entries = library.data ?? []
  const read = entries.filter((entry) => entry.status === 'READ')
  const favorites = entries.filter((entry) => entry.favorite)
  const comments = read.filter((entry) => entry.comment).length
  const shelf = tab === 'READ' ? read : favorites

  /** Grava status/favorito de um livro e atualiza a lista local. */
  const saveEntry = async (book: BookSummary, status: ReadingStatus | null, favorite: boolean) => {
    const saved = await apiRequest<LibraryEntry>(`/api/me/library/${encodeURIComponent(book.slug)}`, {
      method: 'PUT',
      body: { status, favorite },
    })
    replaceEntry(saved)
  }

  const replaceEntry = (saved: LibraryEntry) => {
    const removed = saved.status === null && !saved.favorite
    const others = entries.filter((item) => item.book.slug !== saved.book.slug)
    library.setData(removed ? others : [saved, ...others])
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="leitor-nome">
        <span className={styles.avatar} aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <div>
          <h2 id="leitor-nome" className={styles.username}>
            {user.username}
          </h2>
          <p className={styles.stats}>
            {pluralize(read.length, 'livro lido', 'livros lidos')} · {pluralize(favorites.length, 'favorito', 'favoritos')}{' '}
            · {pluralize(comments, 'comentário', 'comentários')}
          </p>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="estante">
        <div className={styles.panelHead}>
          <h2 id="estante">Minha estante</h2>
          <div className={styles.tabs} role="group" aria-label="Mostrar na estante">
            <button type="button" aria-pressed={tab === 'READ'} onClick={() => setTab('READ')}>
              <BookCheck size={16} aria-hidden="true" /> Já li ({read.length})
            </button>
            <button type="button" aria-pressed={tab === 'FAVORITES'} onClick={() => setTab('FAVORITES')}>
              <Heart size={16} aria-hidden="true" /> Favoritos ({favorites.length})
            </button>
          </div>
        </div>

        <AddBook entries={entries} onSave={saveEntry} />

        {library.error && <ErrorState error={library.error} onRetry={library.reload} />}
        {library.loading && !library.data && <LoadingState />}
        {library.data &&
          (shelf.length === 0 ? (
            <EmptyState title={tab === 'READ' ? 'Nenhum livro lido ainda' : 'Nenhum favorito ainda'}>
              Busque um livro acima e marque como “Já li” ou “Favorito”.
            </EmptyState>
          ) : (
            <ul className={styles.shelf}>
              {shelf.map((entry) => (
                <ShelfItem key={entry.book.slug} entry={entry} onSave={saveEntry} onReview={replaceEntry} />
              ))}
            </ul>
          ))}
      </section>

      {profile.error && <ErrorState error={profile.error} onRetry={profile.reload} />}
      {profile.loading && !profile.data && <LoadingState label="Carregando preferências…" />}
      {profile.data && <PreferencesEditor initial={profile.data} onSaved={profile.setData} />}
    </div>
  )
}

function ShelfItem({
  entry,
  onSave,
  onReview,
}: {
  entry: LibraryEntry
  onSave: (book: BookSummary, status: ReadingStatus | null, favorite: boolean) => Promise<void>
  onReview: (entry: LibraryEntry) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const run = async (status: ReadingStatus | null, favorite: boolean) => {
    setError(null)
    try {
      await onSave(entry.book, status, favorite)
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }
  const read = entry.status === 'READ'

  return (
    <li className={styles.item}>
      <BookCover book={entry.book} size="sm" />
      <div className={styles.itemBody}>
        <p className={styles.title}>
          <Link to={`/livros/${entry.book.slug}`}>{entry.book.title}</Link>
        </p>
        <p className={styles.muted}>{authorNames(entry.book)}</p>
        {read && !entry.comment && <Stars rating={entry.rating} />}
        <div className={styles.itemActions}>
          <Button
            variant={entry.favorite ? 'primary' : 'outline'}
            aria-pressed={entry.favorite}
            aria-label={`Favorito: ${entry.book.title}`}
            onClick={() => run(entry.status, !entry.favorite)}
          >
            <Heart size={16} aria-hidden="true" fill={entry.favorite ? 'currentColor' : 'none'} />
          </Button>
          <Button
            variant={read ? 'primary' : 'outline'}
            aria-pressed={read}
            onClick={() => run(read ? null : 'READ', entry.favorite)}
          >
            <BookCheck size={16} aria-hidden="true" /> {read ? 'Lido' : 'Marcar como lido'}
          </Button>
        </div>
        <ReviewEditor entry={entry} onSaved={onReview} />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </li>
  )
}

/** Busca no catálogo para colocar um livro na estante. */
function AddBook({
  entries,
  onSave,
}: {
  entries: LibraryEntry[]
  onSave: (book: BookSummary, status: ReadingStatus | null, favorite: boolean) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const results = useApi<Page<BookSummary>>(
    submitted ? `/api/books${queryString({ q: submitted, size: 5 })}` : null,
  )

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(query.trim() || null)
  }

  const add = async (book: BookSummary, kind: 'READ' | 'FAVORITE') => {
    const current = entries.find((entry) => entry.book.slug === book.slug)
    setError(null)
    try {
      await onSave(
        book,
        kind === 'READ' ? 'READ' : (current?.status ?? null),
        kind === 'FAVORITE' ? true : (current?.favorite ?? false),
      )
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  return (
    <div className={styles.add}>
      <form className={styles.search} role="search" onSubmit={search}>
        <label htmlFor="buscar-livro" className="visually-hidden">
          Buscar livro no catálogo
        </label>
        <Search size={18} aria-hidden="true" />
        <input
          id="buscar-livro"
          type="search"
          placeholder="Adicionar livro: busque por título ou autor"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit">Buscar</Button>
      </form>
      {error && <Notice tone="danger">{error}</Notice>}
      {results.loading && <LoadingState label="Buscando…" />}
      {results.error && <ErrorState error={results.error} />}
      {results.data &&
        (results.data.content.length === 0 ? (
          <p className={styles.muted}>Nenhum livro encontrado para “{submitted}”.</p>
        ) : (
          <ul className={styles.results}>
            {results.data.content.map((book) => {
              const current = entries.find((entry) => entry.book.slug === book.slug)
              return (
                <li key={book.slug}>
                  <span>
                    <strong>{book.title}</strong> <span className={styles.muted}>· {authorNames(book)}</span>
                  </span>
                  <span className={styles.resultActions}>
                    <Button
                      variant="outline"
                      disabled={current?.status === 'READ'}
                      onClick={() => add(book, 'READ')}
                      aria-label={`Marcar ${book.title} como lido`}
                    >
                      <Plus size={14} aria-hidden="true" /> Já li
                    </Button>
                    <Button
                      variant="outline"
                      disabled={current?.favorite}
                      onClick={() => add(book, 'FAVORITE')}
                      aria-label={`Favoritar ${book.title}`}
                    >
                      <Heart size={14} aria-hidden="true" /> Favorito
                    </Button>
                  </span>
                </li>
              )
            })}
          </ul>
        ))}
    </div>
  )
}

type Sentiment = 'like' | 'dislike' | null

/** Gêneros (tocar alterna: gosto → não gosto → neutro) e autores favoritos, salvos juntos. */
function PreferencesEditor({ initial, onSaved }: { initial: ReaderProfile; onSaved: (profile: ReaderProfile) => void }) {
  const [liked, setLiked] = useState(initial.likedGenres)
  const [disliked, setDisliked] = useState(initial.dislikedGenres)
  const [authors, setAuthors] = useState(initial.favoriteAuthors)
  const [customGenre, setCustomGenre] = useState('')
  const [author, setAuthor] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)

  const same = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0
  const has = (list: string[], value: string) => list.some((item) => same(item, value))
  const without = (list: string[], value: string) => list.filter((item) => !same(item, value))
  const sentimentOf = (genre: string): Sentiment => (has(liked, genre) ? 'like' : has(disliked, genre) ? 'dislike' : null)

  const setSentiment = (genre: string, sentiment: Sentiment) => {
    setLiked((list) => (sentiment === 'like' ? [...without(list, genre), genre] : without(list, genre)))
    setDisliked((list) => (sentiment === 'dislike' ? [...without(list, genre), genre] : without(list, genre)))
    setMessage(null)
  }

  const cycle = (genre: string) => {
    const current = sentimentOf(genre)
    setSentiment(genre, current === null ? 'like' : current === 'like' ? 'dislike' : null)
  }

  // Sugestões + o que o leitor digitou e não está na lista padrão
  const genres = [
    ...LITERARY_TYPES,
    ...[...liked, ...disliked].filter((genre) => !LITERARY_TYPES.some((type) => same(type, genre))),
  ]

  const addCustom = (sentiment: 'like' | 'dislike') => {
    const value = customGenre.trim().replace(/\s+/g, ' ')
    if (!value) return
    setSentiment(value, sentiment)
    setCustomGenre('')
  }

  const addAuthor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = author.trim().replace(/\s+/g, ' ')
    if (value && !has(authors, value)) setAuthors([...authors, value])
    setAuthor('')
    setMessage(null)
  }

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const saved = await apiRequest<ReaderProfile>('/api/me/reader-profile', {
        method: 'PUT',
        body: { likedGenres: liked, dislikedGenres: disliked, favoriteAuthors: authors },
      })
      onSaved(saved)
      setMessage({ tone: 'success', text: 'Preferências salvas. As próximas recomendações vão levar isso em conta.' })
    } catch (caught) {
      setMessage({ tone: 'danger', text: toApiError(caught).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className={styles.panel} aria-labelledby="generos">
        <div className={styles.panelHead}>
          <h2 id="generos">Tipos de literatura</h2>
          <p className={styles.legend}>
            <span className={styles.likeDot}>
              <ThumbsUp size={14} aria-hidden="true" /> gosto
            </span>
            <span className={styles.dislikeDot}>
              <ThumbsDown size={14} aria-hidden="true" /> não gosto
            </span>
          </p>
        </div>
        <p className={styles.muted}>Toque para alternar: gosto → não gosto → neutro.</p>
        <ul className={styles.chips}>
          {genres.map((genre) => {
            const sentiment = sentimentOf(genre)
            const label = sentiment === 'like' ? 'gosto' : sentiment === 'dislike' ? 'não gosto' : 'neutro'
            return (
              <li key={genre}>
                <button
                  type="button"
                  className={`${styles.chip} ${sentiment ? styles[sentiment] : ''}`}
                  onClick={() => cycle(genre)}
                  aria-label={`${genre}: ${label}`}
                >
                  {sentiment === 'like' && <ThumbsUp size={14} aria-hidden="true" />}
                  {sentiment === 'dislike' && <ThumbsDown size={14} aria-hidden="true" />}
                  {genre}
                </button>
              </li>
            )
          })}
        </ul>
        <div className={styles.inline}>
          <label htmlFor="outro-genero" className="visually-hidden">
            Outro tipo de literatura
          </label>
          <input
            id="outro-genero"
            placeholder="Outro tipo (ex.: cozy mystery)"
            maxLength={60}
            value={customGenre}
            onChange={(event) => setCustomGenre(event.target.value)}
          />
          <Button variant="outline" onClick={() => addCustom('like')}>
            <ThumbsUp size={14} aria-hidden="true" /> Gosto
          </Button>
          <Button variant="outline" onClick={() => addCustom('dislike')}>
            <ThumbsDown size={14} aria-hidden="true" /> Não gosto
          </Button>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="autores">
        <h2 id="autores">Autores do coração</h2>
        {authors.length === 0 ? (
          <p className={styles.muted}>Nenhum autor ainda. Quem você leria de olhos fechados?</p>
        ) : (
          <ol className={styles.authors}>
            {authors.map((name) => (
              <li key={name}>
                {name}
                <button
                  type="button"
                  aria-label={`Remover ${name}`}
                  onClick={() => {
                    setAuthors(without(authors, name))
                    setMessage(null)
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        )}
        <form className={styles.inline} onSubmit={addAuthor}>
          <label htmlFor="novo-autor" className="visually-hidden">
            Nome do autor
          </label>
          <input
            id="novo-autor"
            placeholder="Ex.: Clarice Lispector"
            maxLength={120}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
          <Button type="submit" variant="outline">
            <Plus size={14} aria-hidden="true" /> Adicionar autor
          </Button>
        </form>
      </section>

      <div className={styles.saveBar}>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <Button size="lg" onClick={save} loading={busy}>
          Salvar preferências
        </Button>
      </div>
    </>
  )
}
