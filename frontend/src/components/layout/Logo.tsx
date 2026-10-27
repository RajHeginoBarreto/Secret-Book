import { Link } from 'react-router'
import logo480 from '../../assets/secret-book-logo-480.webp'
import logo960 from '../../assets/secret-book-logo-960.webp'
import { SITE } from '../../config/site'
import styles from './Logo.module.css'

interface LogoProps {
  /** "light" coloca a logo sobre uma etiqueta de papel, para ler bem em fundos escuros. */
  tone?: 'default' | 'light'
  size?: 'md' | 'lg'
}

/** Logo oficial do Secret Book (baú com livro, laço e fechadura), extraída do arquivo da marca. */
export function Logo({ tone = 'default', size = 'md' }: LogoProps) {
  return (
    <Link
      to="/"
      className={`${styles.logo} ${styles[size]} ${tone === 'light' ? styles.light : ''}`}
      aria-label={`${SITE.name} — página inicial`}
    >
      <img
        src={logo480}
        srcSet={`${logo480} 480w, ${logo960} 960w`}
        sizes={size === 'lg' ? '220px' : '84px'}
        alt=""
        width={480}
        height={356}
        className={styles.image}
      />
    </Link>
  )
}
