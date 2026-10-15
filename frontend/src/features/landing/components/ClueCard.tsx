import styles from './ClueCard.module.css'

interface ClueCardProps {
  label: string
  title: string
  details?: string
  keywords: string[]
  compact?: boolean
}

/** Pacote kraft com o "cartão de pistas" — elemento visual central da marca. */
export function ClueCard({ label, title, details, keywords, compact }: ClueCardProps) {
  return (
    <div className={`${styles.package} ${compact ? styles.compact : ''}`}>
      <div className={styles.string} aria-hidden="true" />
      <div className={styles.card}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.title}>{title}</strong>
        {details && <p className={styles.details}>{details}</p>}
        {keywords.length > 0 && <small className={styles.keywords}>{keywords.join(' · ')}</small>}
      </div>
    </div>
  )
}
