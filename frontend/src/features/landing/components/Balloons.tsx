import styles from './Balloons.module.css'

type Kind = 'black' | 'confetti' | 'star'

const BALLOONS: { kind: Kind; x: number; y: number; size: number; delay: number }[] = [
  { kind: 'star', x: 30, y: 0, size: 112, delay: 0 },
  { kind: 'confetti', x: 96, y: 70, size: 92, delay: 1.2 },
  { kind: 'star', x: 0, y: 118, size: 96, delay: 0.6 },
  { kind: 'black', x: 66, y: 150, size: 88, delay: 2 },
  { kind: 'black', x: 10, y: 222, size: 80, delay: 1.5 },
  { kind: 'confetti', x: 70, y: 244, size: 84, delay: 0.3 },
]

/** Buquê de balões pretos, de confete e de estrela, flutuando — decoração do hero. */
export function Balloons({ side = 'left' }: { side?: 'left' | 'right' }) {
  return (
    <div className={`${styles.bouquet} ${styles[side]}`} aria-hidden="true">
      {BALLOONS.map((balloon, index) => (
        <span
          key={index}
          className={`${styles.balloon} ${styles[balloon.kind]}`}
          style={{
            left: balloon.x,
            top: balloon.y,
            width: balloon.size,
            height: balloon.kind === 'star' ? balloon.size : balloon.size * 1.12,
            animationDelay: `${balloon.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
