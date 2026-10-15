import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { AuthCard } from './AuthCard'
import styles from './AuthCard.module.css'

export function ForgotPasswordPage() {
  usePageTitle('Esqueci minha senha')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim()
    setSubmitting(true)
    setError(null)
    try {
      const response = await apiRequest<{ message: string }>('/api/auth/password/forgot', {
        method: 'POST',
        body: { email },
      })
      setMessage(response.message)
    } catch (caught) {
      setError(toApiError(caught))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link para criar uma nova senha."
      footer={<Link to="/entrar">Voltar para o login</Link>}
    >
      {message ? (
        <div className={styles.form}>
          <Notice tone="success">{message}</Notice>
          <Notice>
            Protótipo: não há envio de e-mail. O link de redefinição aparece no log do backend e vale por 30
            minutos.
          </Notice>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && <Notice tone="danger">{error.message}</Notice>}
          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            error={error?.fieldError('email')}
            required
          />
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Enviar link
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
