import { Link } from 'react-router'
import { SITE } from '../../config/site'
import { Logo } from './Logo'
import { MAIN_NAV } from './navigation'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo tone="light" showMark={false} />
          <p>{SITE.tagline}</p>
        </div>

        <nav aria-label="Navegação do rodapé">
          <h2 className={styles.heading}>Explore</h2>
          <ul className={styles.list}>
            <li>
              <Link to="/quiz">Quiz literário</Link>
            </li>
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.about}>
          <h2 className={styles.heading}>Sobre este projeto</h2>
          <p>
            Protótipo de portfólio. Planos, valores e depoimentos são demonstrativos: nenhuma assinatura é cobrada e
            nenhum pagamento é processado.
          </p>
        </div>
      </div>
      <p className={styles.copy}>
        © {new Date().getFullYear()} {SITE.name} · Projeto demonstrativo
      </p>
    </footer>
  )
}
