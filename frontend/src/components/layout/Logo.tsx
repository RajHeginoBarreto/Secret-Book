import { Link } from 'react-router'
import logo480 from '../../assets/secret-book-logo-480.webp'
import logo960 from '../../assets/secret-book-logo-960.webp'
import logoDark480 from '../../assets/secret-book-logo-dark-480.webp'
import logoDark960 from '../../assets/secret-book-logo-dark-960.webp'
import { SITE } from '../../config/site'
import styles from './Logo.module.css'

interface LogoProps {
  /** "light" usa a versão para fundo escuro, com o letreiro cor de papel no lugar do roxo. */
  tone?: 'default' | 'light'
  size?: 'md' | 'lg'
}

/** Logo oficial do Secret Book (baú com livro, laço e fechadura), sem fundo. */
export function Logo({ tone = 'default', size = 'md' }: LogoProps) {
  const [small, large] = tone === 'light' ? [logoDark480, logoDark960] : [logo480, logo960]
  return (
    <Link
      to="/"
      className={`${styles.logo} ${styles[size]} ${tone === 'light' ? styles.light : ''}`}
      aria-label={`${SITE.name} — página inicial`}
    >
      <img
        src={small}
        srcSet={`${small} 480w, ${large} 960w`}
        sizes={size === 'lg' ? '220px' : '90px'}
        alt=""
        width={480}
        height={357}
        className={styles.image}
      />
    </Link>
  )
}
