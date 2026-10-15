import type { ReactNode } from 'react'
import styles from './AuthCard.module.css'

/** Moldura das telas de login, cadastro e senha. */
export function AuthCard({ title, description, children, footer }: {
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <span className={styles.eyebrow}>
          <span aria-hidden="true">✦ </span>Secret Book
        </span>
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </section>
    </div>
  )
}
