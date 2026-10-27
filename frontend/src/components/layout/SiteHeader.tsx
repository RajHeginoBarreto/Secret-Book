import { CircleUser, Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../../features/auth/AuthContext'
import { Button } from '../ui/Button'
import { Logo } from './Logo'
import { MAIN_NAV } from './navigation'
import styles from './SiteHeader.module.css'

export function SiteHeader() {
  const location = useLocation()
  const { status, user } = useAuth()
  const menuId = useId()
  // O menu fica "aberto" apenas para a localização em que foi aberto:
  // qualquer navegação gera uma nova key e o fecha automaticamente.
  const [openForKey, setOpenForKey] = useState<string | null>(null)
  const isOpen = openForKey === location.key

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenForKey(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo tone="light" />

        <button
          type="button"
          className={styles.toggle}
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpenForKey(isOpen ? null : location.key)}
        >
          {isOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <nav id={menuId} className={`${styles.nav} ${isOpen ? styles.open : ''}`} aria-label="Navegação principal">
          <ul className={styles.list}>
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={styles.link} onClick={() => setOpenForKey(null)}>
                  {item.label}
                </Link>
              </li>
            ))}
            {status === 'authenticated' && user?.role === 'ADMIN' && (
              <li>
                <Link to="/admin" className={styles.link} onClick={() => setOpenForKey(null)}>
                  Painel
                </Link>
              </li>
            )}
            {status === 'authenticated' && (
              <li>
                <Link to="/minha-conta" className={styles.link} onClick={() => setOpenForKey(null)}>
                  <CircleUser size={16} aria-hidden="true" className={styles.icon} />
                  Minha conta
                </Link>
              </li>
            )}
            {status === 'anonymous' && (
              <li>
                <Link to="/entrar" className={styles.link} onClick={() => setOpenForKey(null)}>
                  Entrar
                </Link>
              </li>
            )}
            <li className={styles.ctaItem}>
              <Button to="/quiz" variant="light" onClick={() => setOpenForKey(null)}>
                Fazer o quiz
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
