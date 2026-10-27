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
          <Logo tone="light" size="lg" />
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
            Protótipo de portfólio. Planos e valores são demonstrativos: nenhuma assinatura é cobrada e nenhum
            pagamento é processado.
          </p>
          <h2 className={styles.heading}>Privacidade (LGPD)</h2>
          <p>
            Para criar sua conta pedimos só um nome de usuário e uma senha. Você pode baixar ou excluir seus dados a
            qualquer momento em <Link to="/minha-conta/perfil">Minha conta</Link>. Leia a{' '}
            <Link to="/privacidade">política de privacidade</Link>.
          </p>
        </div>
      </div>
      <p className={styles.motto}>porque todo livro é uma nova aventura ♥</p>
      <p className={styles.copy}>
        © {new Date().getFullYear()} {SITE.name} · Projeto demonstrativo
      </p>
    </footer>
  )
}
