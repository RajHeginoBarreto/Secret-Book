import { LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { apiRequest, toApiError, type ApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from '../auth/AuthContext'
import { passwordProblem, type User } from '../auth/authTypes'
import { formatDate } from './accountTypes'
import styles from './Account.module.css'

export function ProfilePage() {
  usePageTitle('Perfil e senha')
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<ApiError | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'name' | 'password' | null>(null)

  if (!user) return null

  const saveName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim()
    setBusy('name')
    setNameError(null)
    setNameMessage(null)
    try {
      updateUser(await apiRequest<User>('/api/auth/me', { method: 'PATCH', body: { name } }))
      setNameMessage('Nome atualizado.')
    } catch (caught) {
      setNameError(toApiError(caught))
    } finally {
      setBusy(null)
    }
  }

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    setPasswordMessage(null)
    const problem = passwordProblem(newPassword)
    if (problem) {
      setPasswordError(problem)
      return
    }
    setBusy('password')
    setPasswordError(null)
    try {
      await apiRequest('/api/auth/password/change', { method: 'POST', body: { currentPassword, newPassword } })
      form.reset()
      setPasswordMessage('Senha alterada. As outras sessões abertas foram encerradas.')
    } catch (caught) {
      setPasswordError(toApiError(caught).message)
    } finally {
      setBusy(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className={styles.grid}>
      <section className={styles.panel} aria-labelledby="dados">
        <h2 id="dados">Seus dados</h2>
        <p className={styles.muted}>
          {user.email} · conta criada em {formatDate(user.createdAt)}
        </p>
        <form className={styles.form} onSubmit={saveName} noValidate>
          <TextField label="Nome" name="name" defaultValue={user.name} error={nameError?.fieldError('name')} required />
          {nameError && nameError.fieldErrors.length === 0 && <Notice tone="danger">{nameError.message}</Notice>}
          {nameMessage && <Notice tone="success">{nameMessage}</Notice>}
          <Button type="submit" loading={busy === 'name'}>
            Salvar nome
          </Button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="senha">
        <h2 id="senha">Trocar senha</h2>
        <form className={styles.form} onSubmit={changePassword} noValidate>
          <TextField label="Senha atual" name="currentPassword" type="password" autoComplete="current-password" required />
          <TextField
            label="Nova senha"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            hint="De 8 a 64 caracteres, com letras e números."
            required
          />
          {passwordError && <Notice tone="danger">{passwordError}</Notice>}
          {passwordMessage && <Notice tone="success">{passwordMessage}</Notice>}
          <Button type="submit" loading={busy === 'password'}>
            Trocar senha
          </Button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="sessao">
        <h2 id="sessao">Sessão</h2>
        <p className={styles.muted}>Sair encerra a sessão neste navegador na hora.</p>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" /> Sair da conta
        </Button>
      </section>
    </div>
  )
}
