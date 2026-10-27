import type { CSSProperties } from 'react'
import styles from './KraftPackage.module.css'

interface KraftPackageProps {
  /** Linhas escritas à mão na etiqueta pendurada. */
  tag: string[]
  size?: 'sm' | 'md' | 'lg'
  /** Inclinação do pacote, em graus. */
  tilt?: number
  /** Atraso da animação de flutuar (s), para pacotes lado a lado não balançarem juntos. */
  floatDelay?: number
  className?: string
}

/**
 * Livro embrulhado em papel kraft, amarrado com barbante, com laço, coraçãozinho e etiqueta de pistas.
 * Puramente decorativo: quem usar deve descrever o conteúdo em texto ao lado.
 */
export function KraftPackage({ tag, size = 'md', tilt = 0, floatDelay = 0, className }: KraftPackageProps) {
  const style = { '--tilt': `${tilt}deg`, '--float-delay': `${floatDelay}s` } as CSSProperties
  return (
    <div className={`${styles.wrap} ${styles[size]} ${className ?? ''}`} style={style} aria-hidden="true">
      <div className={styles.package}>
        <span className={styles.heart}>♥</span>
        <span className={styles.twineV} />
        <span className={styles.twineH} />
        <span className={styles.bow}>
          <span />
          <span />
        </span>
        <span className={styles.tag}>
          {tag.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </div>
    </div>
  )
}
