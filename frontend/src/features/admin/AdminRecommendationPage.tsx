import { useState, type FormEvent } from 'react'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { fieldErrorsOf } from '../../api/formErrors'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDateTime } from '../account/accountTypes'
import type { RecommendationSettings } from './adminTypes'
import styles from './Admin.module.css'

const WEIGHTS = [
  { key: 'genreWeight', label: 'Peso do gênero', hint: 'Quanto os gêneros do perfil pesam.' },
  { key: 'paceWeight', label: 'Peso do ritmo', hint: 'Lento, equilibrado ou rápido.' },
  { key: 'toneWeight', label: 'Peso do clima', hint: 'Leve, emocionante, sombrio ou reflexivo.' },
  { key: 'lengthWeight', label: 'Peso do tamanho', hint: 'Curto, médio ou longo.' },
] as const

export function AdminRecommendationPage() {
  usePageTitle('Recomendação — painel')
  const settings = useApi<RecommendationSettings>('/api/admin/recommendation-settings')

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Motor de recomendação</h1>
          <p className={styles.subtitle}>
            A afinidade de cada livro é a média ponderada dos critérios. Só a proporção entre os pesos importa; as
            mudanças valem para as próximas tentativas do quiz.
          </p>
        </div>
      </header>
      {settings.error && <ErrorState error={settings.error} onRetry={settings.reload} />}
      {settings.loading && !settings.data && <LoadingState />}
      {settings.data && (
        <SettingsForm settings={settings.data} onSaved={settings.setData} />
      )}
    </>
  )
}

function SettingsForm({ settings, onSaved }: { settings: RecommendationSettings; onSaved: (value: RecommendationSettings) => void }) {
  const [values, setValues] = useState(settings)
  const [error, setError] = useState<ApiError | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const errors = fieldErrorsOf(error)
  const total = values.genreWeight + values.paceWeight + values.toneWeight + values.lengthWeight

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      const body = {
        genreWeight: values.genreWeight,
        paceWeight: values.paceWeight,
        toneWeight: values.toneWeight,
        lengthWeight: values.lengthWeight,
        maxResults: values.maxResults,
        mixThreshold: values.mixThreshold,
      }
      onSaved(await apiRequest<RecommendationSettings>('/api/admin/recommendation-settings', { method: 'PUT', body }))
      setSaved(true)
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setBusy(false)
    }
  }

  const share = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0)

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <Notice tone="danger">{error.fieldErrors.length > 0 ? 'Revise os valores destacados.' : error.message}</Notice>}
      {saved && <Notice tone="success">Pesos salvos. As próximas recomendações já usam os novos valores.</Notice>}

      <div className={styles.formGrid}>
        {WEIGHTS.map((weight) => (
          <TextField
            key={weight.key}
            label={`${weight.label} (${share(values[weight.key])}%)`}
            type="number"
            min={0}
            max={10}
            step={0.05}
            value={values[weight.key]}
            onChange={(event) => setValues({ ...values, [weight.key]: Number(event.target.value) })}
            hint={weight.hint}
            error={errors[weight.key]}
          />
        ))}
      </div>
      <div className={styles.formGrid}>
        <TextField
          label="Livros por resultado"
          type="number"
          min={1}
          max={12}
          value={values.maxResults}
          onChange={(event) => setValues({ ...values, maxResults: Number(event.target.value) })}
          error={errors.maxResults}
        />
        <TextField
          label="Pontos para perfil combinado"
          type="number"
          min={0.5}
          max={10}
          step={0.5}
          value={values.mixThreshold}
          onChange={(event) => setValues({ ...values, mixThreshold: Number(event.target.value) })}
          hint="Pontos mínimos do 2º gênero para o perfil virar uma combinação (ex.: Romantasia)."
          error={errors.mixThreshold}
        />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" loading={busy}>
          Salvar pesos
        </Button>
        <span className={styles.muted}>Última alteração: {formatDateTime(settings.updatedAt)}</span>
      </div>
    </form>
  )
}
