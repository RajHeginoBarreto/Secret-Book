import type { ReactNode } from 'react'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  id?: string
  align?: 'center' | 'left'
  tone?: 'default' | 'dark'
}

/** Sobretítulo + título serifado + descrição: padrão editorial das seções. */
export function SectionHeader({ eyebrow, title, description, id, align = 'center', tone = 'default' }: SectionHeaderProps) {
  return (
    <header className={`${styles.header} ${styles[align]} ${tone === 'dark' ? styles.dark : ''}`}>
      <span className={styles.eyebrow}>
        <span aria-hidden="true">✦ </span>
        {eyebrow}
      </span>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {description && <p className={styles.description}>{description}</p>}
    </header>
  )
}
