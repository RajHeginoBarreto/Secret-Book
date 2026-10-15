import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toApiError, type ApiError } from '../../api/client'
import { fieldErrorsOf } from '../../api/formErrors'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthContext'
import { passwordProblem, safeRedirect } from './authTypes'
import styles from './AuthCard.module.css'

export function RegisterPage() {
  usePageTitle('Criar conta')
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const target = safeRedirect(params.get('voltar'))
  const [error, setError] = useState<ApiError | null>(null)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && !submitting) return <Navigate to={target} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('confirmation') ?? '')

    const problems: Record<string, string> = {}
    if (!name) problems.name = 'Informe seu nome.'
    if (!email.includes('@')) problems.email = 'Informe um e-mail válido.'
    const passwordError = passwordProblem(password)
    if (passwordError) problems.password = passwordError
    else if (password !== confirmation) problems.confirmation = 'As senhas não são iguais.'
    setLocalErrors(problems)
    setError(null)
    if (Object.keys(problems).length > 0) return

    setSubmitting(true)
    try {
      await register(name, email, password)
      navigate(target, { replace: true })
    } catch (caught) {
      setError(toApiError(caught))
      setSubmitting(false)
    }
  }

  const errors = { ...fieldErrorsOf(error), ...localErrors }

  return (
    <AuthCard
      title="Criar conta"
      description="Guarde suas descobertas, avalie as recomendações e simule uma assinatura."
      footer={
        <>
          Já tem conta? <Link to={`/entrar${params.toString() ? `?${params}` : ''}`}>Entrar</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && error.fieldErrors.length === 0 && <Notice tone="danger">{error.message}</Notice>}
        <TextField label="Nome" name="name" autoComplete="name" error={errors.name} required />
        <TextField label="E-mail" name="email" type="email" autoComplete="email" error={errors.email} required />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="De 8 a 64 caracteres, com letras e números."
          error={errors.password}
          required
        />
        <TextField
          label="Confirme a senha"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          error={errors.confirmation}
          required
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Criar conta
        </Button>
      </form>
    </AuthCard>
  )
}
