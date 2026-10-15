import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toApiError, type ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { AuthCard } from './AuthCard'
import { useAuth } from './AuthContext'
import { safeRedirect } from './authTypes'
import styles from './AuthCard.module.css'

export function LoginPage() {
  usePageTitle('Entrar')
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const target = safeRedirect(params.get('voltar'))
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && !submitting) return <Navigate to={target} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    try {
      await login(String(data.get('email') ?? ''), String(data.get('password') ?? ''))
      navigate(target, { replace: true })
    } catch (caught) {
      setError(toApiError(caught))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Entrar"
      description="Acesse sua biblioteca, o histórico do quiz e a sua assinatura demonstrativa."
      footer={
        <>
          Ainda não tem conta? <Link to={`/cadastro${params.toString() ? `?${params}` : ''}`}>Criar conta</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && <Notice tone="danger">{error.message}</Notice>}
        <TextField label="E-mail" name="email" type="email" autoComplete="email" required />
        <TextField label="Senha" name="password" type="password" autoComplete="current-password" required />
        <Link to="/esqueci-senha" className={styles.inlineLink}>
          Esqueci minha senha
        </Link>
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Entrar
        </Button>
      </form>
    </AuthCard>
  )
}
