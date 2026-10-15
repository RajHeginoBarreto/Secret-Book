import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/StatusMessage'
import { usePageTitle } from '../../hooks/usePageTitle'
import { useAuth } from './AuthContext'
import styles from '../misc/NotFoundPage.module.css'

/** Protege uma área: visitantes vão para o login (e voltam depois); papel insuficiente vê "acesso negado". */
export function RequireAuth({ children, role }: { children: ReactNode; role?: 'ADMIN' }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Verificando sua sessão…" />
  if (status === 'anonymous' || !user) {
    const back = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/entrar?voltar=${back}`} replace />
  }
  if (role && user.role !== role) return <ForbiddenPage />
  return children
}

function ForbiddenPage() {
  usePageTitle('Acesso negado')
  return (
    <section className={styles.page}>
      <span className={styles.code} aria-hidden="true">
        403
      </span>
      <h1>Esta estante é só para a equipe</h1>
      <p>Sua conta não tem permissão para acessar o painel administrativo.</p>
      <div className={styles.actions}>
        <Button to="/minha-conta">Ir para minha conta</Button>
      </div>
    </section>
  )
}
