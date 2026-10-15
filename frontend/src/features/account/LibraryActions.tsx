import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/Field'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../auth/AuthContext'
import { READING_STATUS_LABELS, type LibraryEntry, type ReadingStatus } from './accountTypes'
import styles from './Account.module.css'

/** Status de leitura e favorito de um livro (na página do livro). Visitantes veem um convite para entrar. */
export function LibraryActions({ bookSlug }: { bookSlug: string }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status !== 'authenticated') {
    return (
      <p className={styles.loginHint}>
        <Link to={`/entrar?voltar=${encodeURIComponent(location.pathname)}`}>Entre</Link> para guardar este livro na
        sua biblioteca.
      </p>
    )
  }
  return <LibraryControls bookSlug={bookSlug} />
}

function LibraryControls({ bookSlug }: { bookSlug: string }) {
  const entry = useApi<LibraryEntry>(`/api/me/library/${encodeURIComponent(bookSlug)}`)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!entry.data) return null

  const save = async (status: ReadingStatus | null, favorite: boolean) => {
    setSaving(true)
    setError(null)
    try {
      entry.setData(
        await apiRequest<LibraryEntry>(`/api/me/library/${encodeURIComponent(bookSlug)}`, {
          method: 'PUT',
          body: { status, favorite },
        }),
      )
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setSaving(false)
    }
  }

  const { status, favorite } = entry.data
  return (
    <div className={styles.libraryBox}>
      <SelectField
        label="Na minha biblioteca"
        value={status ?? ''}
        disabled={saving}
        onChange={(event) => save((event.target.value || null) as ReadingStatus | null, favorite)}
      >
        <option value="">Fora da biblioteca</option>
        {Object.entries(READING_STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <Button
        variant={favorite ? 'primary' : 'outline'}
        aria-pressed={favorite}
        disabled={saving}
        onClick={() => save(status, !favorite)}
        fullWidth
      >
        <Heart size={16} aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />
        {favorite ? 'Favorito' : 'Favoritar'}
      </Button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
