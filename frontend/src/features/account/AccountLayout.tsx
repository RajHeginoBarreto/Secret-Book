import { NavLink, Outlet } from 'react-router'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../auth/AuthContext'
import styles from './Account.module.css'

const TABS = [
  { to: '/minha-conta', label: 'Visão geral', end: true },
  { to: '/minha-conta/biblioteca', label: 'Biblioteca' },
  { to: '/minha-conta/historico', label: 'Histórico do quiz' },
  { to: '/minha-conta/avaliacoes', label: 'Avaliações' },
  { to: '/minha-conta/perfil', label: 'Perfil e senha' },
]

export function AccountLayout() {
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? ''
  return (
    <>
      <PageHeader
        eyebrow="Minha conta"
        title={`Olá, ${firstName}`}
        description="Sua biblioteca, seus resultados do quiz e sua assinatura demonstrativa."
      />
      <div className={styles.page}>
        <nav aria-label="Seções da conta">
          <ul className={styles.tabs}>
            {TABS.map((tab) => (
              <li key={tab.to}>
                <NavLink to={tab.to} end={tab.end} className={styles.tab}>
                  {tab.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Outlet />
      </div>
    </>
  )
}
