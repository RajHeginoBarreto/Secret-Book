import { ArrowLeft, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { fieldErrorsOf } from '../../api/formErrors'
import { Button } from '../../components/ui/Button'
import { CheckboxGroup, SelectField, TextAreaField, TextField } from '../../components/ui/Field'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { BookCover } from '../catalog/BookCover'
import {
  CONTENT_NOTE_LABELS,
  PACE_LABELS,
  TONE_LABELS,
  type ContentNote,
  type Pace,
  type Tone,
} from '../catalog/catalogTypes'
import type { AdminAuthor, AdminBook, AdminGenre, BookPayload } from './adminTypes'
import styles from './Admin.module.css'

const EMPTY_BOOK: BookPayload = {
  title: '',
  synopsis: '',
  publicationYear: null,
  pages: 250,
  pace: 'MODERATE',
  tone: 'EMOTIONAL',
  coverColor: '#1f3f6b',
  active: true,
  authorSlugs: [],
  genreSlugs: [],
  contentNotes: [],
  clues: ['', '', ''],
}

/** Cadastro (/admin/livros/novo) e edição (/admin/livros/:id) de livros. */
export function AdminBookFormPage() {
  const { id } = useParams()
  const isNew = id === undefined
  usePageTitle(isNew ? 'Novo livro — painel' : 'Editar livro — painel')
  const book = useApi<AdminBook>(isNew ? null : `/api/admin/books/${id}`)
  const authors = useApi<AdminAuthor[]>('/api/admin/authors')
  const genres = useApi<AdminGenre[]>('/api/admin/genres')

  const loadError = book.error ?? authors.error ?? genres.error
  const ready = authors.data && genres.data && (isNew || book.data)

  return (
    <>
      <Link to="/admin/livros" className={styles.muted}>
        <ArrowLeft size={14} aria-hidden="true" style={{ display: 'inline' }} /> Voltar aos livros
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>{isNew ? 'Novo livro' : 'Editar livro'}</h1>
      </header>
      {loadError && <ErrorState error={loadError} />}
      {!ready && !loadError && <LoadingState />}
      {ready && (
        <BookForm
          key={book.data?.id ?? 'novo'}
          bookId={book.data?.id}
          initial={book.data ? toPayload(book.data) : EMPTY_BOOK}
          authors={authors.data!}
          genres={genres.data!}
        />
      )}
    </>
  )
}

function toPayload(book: AdminBook): BookPayload {
  const clues = [...book.clues]
  while (clues.length < 3) clues.push('')
  return {
    slug: book.slug,
    title: book.title,
    synopsis: book.synopsis,
    publicationYear: book.publicationYear,
    pages: book.pages,
    pace: book.pace,
    tone: book.tone,
    coverColor: book.coverColor,
    active: book.active,
    authorSlugs: book.authorSlugs,
    genreSlugs: book.genreSlugs,
    contentNotes: book.contentNotes,
    clues,
  }
}

interface BookFormProps {
  bookId?: number
  initial: BookPayload
  authors: AdminAuthor[]
  genres: AdminGenre[]
}

function BookForm({ bookId, initial, authors, genres }: BookFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<BookPayload>(initial)
  const [error, setError] = useState<ApiError | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const errors = fieldErrorsOf(error)

  const set = <K extends keyof BookPayload>(key: K, value: BookPayload[K]) => {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const payload: BookPayload = { ...form, clues: form.clues.map((clue) => clue.trim()).filter(Boolean) }
    try {
      const result = await apiRequest<AdminBook>(bookId ? `/api/admin/books/${bookId}` : '/api/admin/books', {
        method: bookId ? 'PUT' : 'POST',
        body: payload,
      })
      if (bookId) {
        setForm(toPayload(result))
        setSaved(true)
      } else {
        navigate(`/admin/livros/${result.id}`, { replace: true })
      }
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!bookId || !window.confirm(`Excluir "${form.title}"? Esta ação não pode ser desfeita.`)) return
    setBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/admin/books/${bookId}`, { method: 'DELETE' })
      navigate('/admin/livros', { replace: true })
    } catch (caught) {
      setError(toApiError(caught))
      setBusy(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <Notice tone="danger">{error.fieldErrors.length > 0 ? 'Revise os campos destacados.' : error.message}</Notice>}
      {saved && <Notice tone="success">Alterações salvas.</Notice>}

      <div className={styles.split}>
        <div className={styles.form} style={{ padding: 0, border: 0 }}>
          <TextField label="Título" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} required />
          <TextField
            label="Identificador na URL (slug)"
            value={form.slug ?? ''}
            onChange={(e) => set('slug', e.target.value || undefined)}
            hint="Deixe em branco para gerar a partir do título."
            error={errors.slug}
          />
          <TextAreaField
            label="Sinopse"
            value={form.synopsis}
            onChange={(e) => set('synopsis', e.target.value)}
            error={errors.synopsis}
            required
          />
        </div>
        <div style={{ maxWidth: 200 }}>
          <BookCover
            book={{
              title: form.title || 'Título do livro',
              coverColor: /^#[0-9a-f]{6}$/i.test(form.coverColor) ? form.coverColor : '#1f3f6b',
              authors: authors.filter((a) => form.authorSlugs.includes(a.slug)).map((a) => ({ slug: a.slug, name: a.name })),
            }}
          />
          <p className={styles.muted} style={{ marginTop: 8 }}>
            Prévia da capa
          </p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <TextField
          label="Páginas"
          type="number"
          min={1}
          value={form.pages}
          onChange={(e) => set('pages', Number(e.target.value))}
          error={errors.pages}
        />
        <TextField
          label="Ano de publicação"
          type="number"
          value={form.publicationYear ?? ''}
          onChange={(e) => set('publicationYear', e.target.value ? Number(e.target.value) : null)}
          error={errors.publicationYear}
        />
        <SelectField label="Ritmo" value={form.pace} onChange={(e) => set('pace', e.target.value as Pace)}>
          {Object.entries(PACE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Clima" value={form.tone} onChange={(e) => set('tone', e.target.value as Tone)}>
          {Object.entries(TONE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <div className={styles.colorRow}>
          <TextField
            label="Cor da capa"
            value={form.coverColor}
            onChange={(e) => set('coverColor', e.target.value)}
            error={errors.coverColor}
          />
          <input
            type="color"
            aria-label="Escolher cor da capa"
            value={/^#[0-9a-f]{6}$/i.test(form.coverColor) ? form.coverColor : '#1f3f6b'}
            onChange={(e) => set('coverColor', e.target.value)}
          />
        </div>
      </div>

      <CheckboxGroup
        legend="Autoria"
        options={authors.map((author) => ({ value: author.slug, label: author.name }))}
        selected={form.authorSlugs}
        onChange={(value) => set('authorSlugs', value)}
        error={errors.authorSlugs}
        columns={3}
      />
      <CheckboxGroup
        legend="Gêneros"
        options={genres.map((genre) => ({ value: genre.slug, label: genre.name }))}
        selected={form.genreSlugs}
        onChange={(value) => set('genreSlugs', value)}
        error={errors.genreSlugs}
        columns={4}
      />
      <CheckboxGroup<ContentNote>
        legend="Temas sensíveis (usados no filtro “evitar” do quiz)"
        options={Object.entries(CONTENT_NOTE_LABELS).map(([value, label]) => ({ value: value as ContentNote, label }))}
        selected={form.contentNotes}
        onChange={(value) => set('contentNotes', value)}
        columns={3}
      />

      <fieldset className={styles.formGrid} style={{ border: 0 }}>
        <legend className={styles.inlineCheck} style={{ marginBottom: 8 }}>
          Pistas do cartão (até 5)
        </legend>
        {form.clues.map((clue, index) => (
          <TextField
            key={index}
            label={`Pista ${index + 1}`}
            value={clue}
            maxLength={200}
            onChange={(e) => set('clues', form.clues.map((item, i) => (i === index ? e.target.value : item)))}
            error={errors[`clues[${index}]`]}
          />
        ))}
        {form.clues.length < 5 && (
          <div style={{ alignSelf: 'end' }}>
            <Button variant="ghost" onClick={() => set('clues', [...form.clues, ''])}>
              + Adicionar pista
            </Button>
          </div>
        )}
      </fieldset>

      <label className={styles.inlineCheck}>
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
        Ativo (aparece no catálogo e pode ser recomendado)
      </label>

      <div className={styles.formActions}>
        <Button type="submit" loading={busy}>
          {bookId ? 'Salvar alterações' : 'Cadastrar livro'}
        </Button>
        {bookId && (
          <Button variant="ghost" onClick={handleDelete} disabled={busy}>
            <Trash2 size={16} aria-hidden="true" /> Excluir livro
          </Button>
        )}
      </div>
    </form>
  )
}
