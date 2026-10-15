import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

/** Faixa azul do topo das páginas internas (catálogo, conta, painel etc.). */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>
          <span aria-hidden="true">✦ </span>
          {eyebrow}
        </span>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children}
      </div>
    </header>
  )
}
