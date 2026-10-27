import { ShieldCheck } from 'lucide-react'
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
import { passwordProblem, safeRedirect, usernameProblem } from './authTypes'
import styles from './AuthCard.module.css'

export function RegisterPage() {
  usePageTitle('Criar conta')
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const target = safeRedirect(params.get('voltar'), '/minha-conta/leitor')
  const [error, setError] = useState<ApiError | null>(null)
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && !submitting) return <Navigate to={target} replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = String(data.get('username') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const confirmation = String(data.get('confirmation') ?? '')
    const acceptPrivacy = data.get('acceptPrivacy') === 'on'

    const problems: Record<string, string> = {}
    const usernameError = usernameProblem(username)
    if (usernameError) problems.username = usernameError
    const passwordError = passwordProblem(password)
    if (passwordError) problems.password = passwordError
    else if (password !== confirmation) problems.confirmation = 'As senhas não são iguais.'
    if (!acceptPrivacy) problems.acceptPrivacy = 'Para criar a conta, aceite a política de privacidade.'
    setLocalErrors(problems)
    setError(null)
    if (Object.keys(problems).length > 0) return

    setSubmitting(true)
    try {
      await register(username, password, acceptPrivacy)
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
      description="Monte seu perfil de leitor: livros favoritos, lidos, gêneros, autores e comentários."
      footer={
        <>
          Já tem conta? <Link to={`/entrar${params.toString() ? `?${params}` : ''}`}>Entrar</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {error && error.fieldErrors.length === 0 && <Notice tone="danger">{error.message}</Notice>}
        <TextField
          label="Nome de usuário"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          hint="É com ele que você entra e é assim que aparece nos comentários. De 3 a 40 caracteres."
          error={errors.username}
          required
        />
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

        <div className={styles.privacy}>
          <p className={styles.privacyTitle}>
            <ShieldCheck size={18} aria-hidden="true" /> Seus dados, do jeito da LGPD
          </p>
          <ul>
            <li>Guardamos só o nome de usuário e a senha (criptografada). Sem e-mail, CPF ou telefone.</li>
            <li>Suas preferências e sua biblioteca servem apenas para recomendar livros.</li>
            <li>Seus comentários em livros aparecem publicamente com o seu nome de usuário.</li>
            <li>Você pode baixar ou excluir todos os seus dados a qualquer momento.</li>
          </ul>
          <label className={styles.consent}>
            <input
              type="checkbox"
              name="acceptPrivacy"
              aria-invalid={errors.acceptPrivacy ? true : undefined}
              aria-describedby={errors.acceptPrivacy ? 'consentimento-erro' : undefined}
            />
            <span>
              Li e aceito a <Link to="/privacidade">política de privacidade</Link>.
            </span>
          </label>
          {errors.acceptPrivacy && (
            <p id="consentimento-erro" className={styles.fieldError}>
              {errors.acceptPrivacy}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Criar conta
        </Button>
      </form>
    </AuthCard>
  )
}
