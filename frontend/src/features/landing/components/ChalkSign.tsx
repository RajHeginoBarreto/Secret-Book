import type { ReactNode } from 'react'
import styles from './ChalkSign.module.css'

/** Plaquinha de lousa com moldura de madeira e letra de giz, como a de preço do estande. */
export function ChalkSign({ children, easel = true, className }: { children: ReactNode; easel?: boolean; className?: string }) {
  return (
    <div className={`${styles.sign} ${easel ? styles.withEasel : ''} ${className ?? ''}`}>
      <div className={styles.board}>{children}</div>
    </div>
  )
}
