import { Download, LogOut, ShieldCheck, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { setAuthToken } from '../../api/authToken'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Notice } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from '../auth/AuthContext'
import { passwordProblem } from '../auth/authTypes'
import { formatDate } from './accountTypes'
import styles from './Account.module.css'

export function ProfilePage() {
  usePageTitle('Conta e privacidade')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'password' | 'export' | 'delete' | null>(null)

  if (!user) return null

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

  /** Direito de acesso e portabilidade (LGPD): baixa tudo o que guardamos, em JSON. */
  const exportData = async () => {
    setBusy('export')
    setExportError(null)
    try {
      const data = await apiRequest<unknown>('/api/me/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `secret-book-meus-dados.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (caught) {
      setExportError(toApiError(caught).message)
    } finally {
      setBusy(null)
    }
  }

  /** Direito de eliminação (LGPD): apaga a conta e tudo o que está ligado a ela. */
  const deleteAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = String(new FormData(event.currentTarget).get('password') ?? '')
    if (!password) {
      setDeleteError('Digite sua senha para confirmar.')
      return
    }
    if (!window.confirm('Excluir a conta para sempre? Esta ação não pode ser desfeita.')) return
    setBusy('delete')
    setDeleteError(null)
    try {
      await apiRequest('/api/me', { method: 'DELETE', body: { password } })
      setAuthToken(null)
      await logout()
      navigate('/', { replace: true })
    } catch (caught) {
      setDeleteError(toApiError(caught).message)
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
        <dl className={styles.facts}>
          <div>
            <dt>Nome de usuário</dt>
            <dd>{user.username}</dd>
          </div>
          {user.email && (
            <div>
              <dt>E-mail</dt>
              <dd>{user.email}</dd>
            </div>
          )}
          <div>
            <dt>Conta criada em</dt>
            <dd>{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
        <p className={styles.muted}>
          <ShieldCheck size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: -2 }} /> Guardamos só o
          necessário. Veja a <Link to="/privacidade">política de privacidade</Link>.
        </p>
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

      <section className={styles.panel} aria-labelledby="meus-dados">
        <h2 id="meus-dados">Baixar meus dados</h2>
        <p className={styles.muted}>
          Um arquivo JSON com sua conta, perfil de leitor, estante, comentários, avaliações, histórico do quiz e
          assinatura.
        </p>
        {exportError && <Notice tone="danger">{exportError}</Notice>}
        <Button variant="outline" onClick={exportData} loading={busy === 'export'}>
          <Download size={16} aria-hidden="true" /> Baixar meus dados
        </Button>
      </section>

      <section className={styles.panel} aria-labelledby="sessao">
        <h2 id="sessao">Sessão</h2>
        <p className={styles.muted}>Sair encerra a sessão neste navegador na hora.</p>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut size={16} aria-hidden="true" /> Sair da conta
        </Button>
      </section>

      <section className={`${styles.panel} ${styles.danger}`} aria-labelledby="excluir">
        <h2 id="excluir">Excluir conta</h2>
        <p className={styles.muted}>
          Apaga para sempre sua conta, estante, comentários, preferências, avaliações e assinatura demonstrativa.
        </p>
        <form className={styles.form} onSubmit={deleteAccount} noValidate>
          <TextField label="Confirme com sua senha" name="password" type="password" autoComplete="current-password" />
          {deleteError && <Notice tone="danger">{deleteError}</Notice>}
          <Button type="submit" variant="outline" loading={busy === 'delete'}>
            <Trash2 size={16} aria-hidden="true" /> Excluir minha conta
          </Button>
        </form>
      </section>
    </div>
  )
}
