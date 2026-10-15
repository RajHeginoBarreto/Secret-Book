import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { AuthCard } from './AuthCard'
import { passwordProblem } from './authTypes'
import styles from './AuthCard.module.css'

export function ResetPasswordPage() {
  usePageTitle('Nova senha')
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [localError, setLocalError] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!token) {
    return (
      <AuthCard title="Link incompleto" footer={<Link to="/esqueci-senha">Pedir um novo link</Link>}>
        <Notice tone="danger">Este endereço não tem o código de redefinição. Abra o link completo que você recebeu.</Notice>
      </AuthCard>
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('confirmation') ?? '')
    const problem = passwordProblem(password)
    const problems: Record<string, string> = {}
    if (problem) problems.password = problem
    else if (password !== confirmation) problems.confirmation = 'As senhas não são iguais.'
    setLocalError(problems)
    if (Object.keys(problems).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/auth/password/reset', { method: 'POST', body: { token, newPassword: password } })
      setDone(true)
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthCard title="Senha alterada">
        <div className={styles.form}>
          <Notice tone="success">Pronto! Por segurança, todas as sessões abertas foram encerradas.</Notice>
          <Button to="/entrar" size="lg" fullWidth>
            Entrar com a nova senha
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Crie uma nova senha"
      footer={<Link to="/esqueci-senha">Pedir um novo link</Link>}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <Notice tone="danger">{error.message}</Notice>}
        <TextField
          label="Nova senha"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="De 8 a 64 caracteres, com letras e números."
          error={localError.password ?? error?.fieldError('newPassword')}
          required
        />
        <TextField
          label="Confirme a nova senha"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          error={localError.confirmation}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  )
}
