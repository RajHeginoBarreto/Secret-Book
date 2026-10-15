import { useState, type FormEvent } from 'react'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { fieldErrorsOf } from '../../api/formErrors'
import { Button } from '../../components/ui/Button'
import { TextAreaField, TextField } from '../../components/ui/Field'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AdminAuthor } from './adminTypes'
import styles from './Admin.module.css'

export function AdminAuthorsPage() {
  usePageTitle('Autores — painel')
  const authors = useApi<AdminAuthor[]>('/api/admin/authors')
  const [editing, setEditing] = useState<AdminAuthor | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const remove = async (author: AdminAuthor) => {
    if (!window.confirm(`Excluir o autor "${author.name}"?`)) return
    setListError(null)
    try {
      await apiRequest(`/api/admin/authors/${author.id}`, { method: 'DELETE' })
      if (editing?.id === author.id) setEditing(null)
      authors.reload()
    } catch (caught) {
      setListError(toApiError(caught).message)
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Autores</h1>
          <p className={styles.subtitle}>Autores fictícios do catálogo demonstrativo.</p>
        </div>
      </header>
      <div className={styles.split}>
        <div>
          {listError && <Notice tone="danger">{listError}</Notice>}
          {authors.error && <ErrorState error={authors.error} onRetry={authors.reload} />}
          {authors.loading && !authors.data && <LoadingState />}
          {authors.data && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Livros</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {authors.data.map((author) => (
                    <tr key={author.id}>
                      <td>
                        {author.name}
                        <div className={styles.muted}>{author.slug}</div>
                      </td>
                      <td>{author.bookCount}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Button variant="ghost" onClick={() => setEditing(author)}>
                          Editar
                        </Button>
                        <Button variant="ghost" onClick={() => remove(author)} aria-label={`Excluir ${author.name}`}>
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AuthorForm
          key={editing?.id ?? 'novo'}
          author={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            authors.reload()
          }}
        />
      </div>
    </>
  )
}

function AuthorForm({ author, onSaved, onCancel }: { author: AdminAuthor | null; onSaved: () => void; onCancel: () => void }) {
  const [error, setError] = useState<ApiError | null>(null)
  const [busy, setBusy] = useState(false)
  const errors = fieldErrorsOf(error)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true)
    setError(null)
    try {
      await apiRequest(author ? `/api/admin/authors/${author.id}` : '/api/admin/authors', {
        method: author ? 'PUT' : 'POST',
        body: {
          name: String(data.get('name') ?? ''),
          slug: String(data.get('slug') ?? '').trim() || undefined,
          bio: String(data.get('bio') ?? ''),
        },
      })
      form.reset()
      onSaved()
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label={author ? 'Editar autor' : 'Novo autor'}>
      <h2 style={{ fontSize: 20 }}>{author ? `Editar ${author.name}` : 'Novo autor'}</h2>
      {error && error.fieldErrors.length === 0 && <Notice tone="danger">{error.message}</Notice>}
      <TextField label="Nome" name="name" defaultValue={author?.name} error={errors.name} required />
      <TextField
        label="Identificador (slug)"
        name="slug"
        defaultValue={author?.slug}
        hint="Em branco: gerado a partir do nome."
        error={errors.slug}
      />
      <TextAreaField label="Biografia" name="bio" defaultValue={author?.bio} error={errors.bio} />
      <div className={styles.formActions}>
        <Button type="submit" loading={busy}>
          {author ? 'Salvar' : 'Cadastrar'}
        </Button>
        {author && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
