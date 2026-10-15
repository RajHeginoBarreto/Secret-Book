import { useState, type FormEvent } from 'react'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { fieldErrorsOf } from '../../api/formErrors'
import { Button } from '../../components/ui/Button'
import { TextAreaField, TextField } from '../../components/ui/Field'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AdminGenre } from './adminTypes'
import styles from './Admin.module.css'

export function AdminGenresPage() {
  usePageTitle('Gêneros — painel')
  const genres = useApi<AdminGenre[]>('/api/admin/genres')
  const [editing, setEditing] = useState<AdminGenre | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const remove = async (genre: AdminGenre) => {
    if (!window.confirm(`Excluir o gênero "${genre.name}"?`)) return
    setListError(null)
    try {
      await apiRequest(`/api/admin/genres/${genre.id}`, { method: 'DELETE' })
      if (editing?.id === genre.id) setEditing(null)
      genres.reload()
    } catch (caught) {
      setListError(toApiError(caught).message)
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gêneros</h1>
          <p className={styles.subtitle}>
            Gêneros usados pelas perguntas do quiz não podem ser excluídos, e o identificador não muda depois de criado.
          </p>
        </div>
      </header>
      <div className={styles.split}>
        <div>
          {listError && <Notice tone="danger">{listError}</Notice>}
          {genres.error && <ErrorState error={genres.error} onRetry={genres.reload} />}
          {genres.loading && !genres.data && <LoadingState />}
          {genres.data && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Gênero</th>
                    <th scope="col">Livros</th>
                    <th scope="col">No quiz</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {genres.data.map((genre) => (
                    <tr key={genre.id}>
                      <td>
                        {genre.name}
                        <div className={styles.muted}>{genre.slug}</div>
                      </td>
                      <td>{genre.bookCount}</td>
                      <td>{genre.usedByQuiz ? 'Sim' : 'Não'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Button variant="ghost" onClick={() => setEditing(genre)}>
                          Editar
                        </Button>
                        <Button variant="ghost" onClick={() => remove(genre)} aria-label={`Excluir ${genre.name}`}>
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
        <GenreForm
          key={editing?.id ?? 'novo'}
          genre={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            genres.reload()
          }}
        />
      </div>
    </>
  )
}

function GenreForm({ genre, onSaved, onCancel }: { genre: AdminGenre | null; onSaved: () => void; onCancel: () => void }) {
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
      await apiRequest(genre ? `/api/admin/genres/${genre.id}` : '/api/admin/genres', {
        method: genre ? 'PUT' : 'POST',
        body: {
          name: String(data.get('name') ?? ''),
          slug: genre ? undefined : String(data.get('slug') ?? '').trim() || undefined,
          description: String(data.get('description') ?? ''),
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label={genre ? 'Editar gênero' : 'Novo gênero'}>
      <h2 style={{ fontSize: 20 }}>{genre ? `Editar ${genre.name}` : 'Novo gênero'}</h2>
      {error && error.fieldErrors.length === 0 && <Notice tone="danger">{error.message}</Notice>}
      <TextField label="Nome" name="name" defaultValue={genre?.name} error={errors.name} required />
      {!genre && (
        <TextField label="Identificador (slug)" name="slug" hint="Em branco: gerado a partir do nome." error={errors.slug} />
      )}
      <TextAreaField label="Descrição" name="description" defaultValue={genre?.description} error={errors.description} />
      <div className={styles.formActions}>
        <Button type="submit" loading={busy}>
          {genre ? 'Salvar' : 'Cadastrar'}
        </Button>
        {genre && (
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}
