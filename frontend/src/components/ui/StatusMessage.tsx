import { AlertCircle, BookOpen, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ApiError } from '../../api/client'
import { Button } from './Button'
import styles from './StatusMessage.module.css'

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className={styles.box} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div className={`${styles.box} ${styles.error}`} role="alert">
      <AlertCircle size={22} aria-hidden="true" />
      <div>
        <strong>{error.title}</strong>
        <p>{error.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${styles.box} ${styles.empty}`}>
      <BookOpen size={28} aria-hidden="true" />
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

/** Faixa informativa (avisos de dados demonstrativos, confirmações etc.). */
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'danger' }) {
  return (
    <p className={`${styles.notice} ${styles[tone]}`} role={tone === 'danger' ? 'alert' : undefined}>
      {tone === 'danger' ? <AlertCircle size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}
