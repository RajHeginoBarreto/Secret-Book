import type { CSSProperties } from 'react'
import styles from './Bunting.module.css'

/**
 * Varal de bandeirolas de papel antigo com uma letra em cada, como o "SECRET BOOK" pendurado no estande.
 * Decorativo: o texto equivalente deve existir na página (o h1, por exemplo).
 */
export function Bunting({ rows }: { rows: string[] }) {
  return (
    <div className={styles.bunting} aria-hidden="true">
      {rows.map((word, rowIndex) => (
        <div key={word} className={styles.row}>
          <svg className={styles.string} viewBox="0 0 100 12" preserveAspectRatio="none">
            <path d="M0 1 Q50 16 100 1" fill="none" stroke="currentColor" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </svg>
          {[...word].map((letter, index) => {
            const middle = (word.length - 1) / 2
            const offset = index - middle
            // Acompanha a curva do barbante: as bandeirolas do meio ficam mais baixas e as das pontas, inclinadas.
            const style = {
              '--drop': `${Math.round((1 - (offset / (middle + 1)) ** 2) * 14)}px`,
              '--angle': `${(offset * 3.2).toFixed(1)}deg`,
              '--delay': `${(rowIndex * word.length + index) * 0.09}s`,
            } as CSSProperties
            return (
              <span key={`${letter}-${index}`} className={styles.flag} style={style}>
                <span className={styles.clip} />
                {letter}
                <span className={styles.star}>✦</span>
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
