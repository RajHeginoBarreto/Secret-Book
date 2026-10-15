import { NavLink, Outlet } from 'react-router'
import styles from './Admin.module.css'

const SECTIONS = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/livros', label: 'Livros' },
  { to: '/admin/autores', label: 'Autores' },
  { to: '/admin/generos', label: 'Gêneros' },
  { to: '/admin/usuarios', label: 'Usuários' },
  { to: '/admin/avaliacoes', label: 'Avaliações' },
  { to: '/admin/assinaturas', label: 'Assinaturas' },
  { to: '/admin/recomendacao', label: 'Recomendação' },
]

export function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>
          <span aria-hidden="true">✦ </span>Painel administrativo
        </p>
        <nav aria-label="Seções do painel">
          <ul className={styles.nav}>
            {SECTIONS.map((section) => (
              <li key={section.to}>
                <NavLink to={section.to} end={section.end} className={styles.navLink}>
                  {section.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
