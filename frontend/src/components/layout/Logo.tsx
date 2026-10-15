import { Link } from 'react-router'
import logoUrl from '../../assets/logo.svg'
import { SITE } from '../../config/site'
import styles from './Logo.module.css'

interface LogoProps {
  tone?: 'default' | 'light'
  showMark?: boolean
}

export function Logo({ tone = 'default', showMark = true }: LogoProps) {
  return (
    <Link to="/" className={`${styles.logo} ${tone === 'light' ? styles.light : ''}`} aria-label={`${SITE.name} — página inicial`}>
      {showMark && <img src={logoUrl} alt="" width={57} height={38} className={styles.mark} />}
      <span className={styles.name}>{SITE.name}</span>
    </Link>
  )
}
