import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import styles from './DiscoverySection.module.css'

interface SamplePackage {
  id: string
  wrapColor: string
  genre: string
  mood: string
  length: string
  keywords: string[]
}

/**
 * Pacotes ILUSTRATIVOS: mostram o formato das pistas, sem representar
 * livros específicos. O catálogo real será servido pelo backend.
 */
const SAMPLES: SamplePackage[] = [
  {
    id: 'misterio',
    wrapColor: 'var(--navy-700)',
    genre: 'Mistério',
    mood: 'Tenso e cheio de reviravoltas',
    length: 'Leitura média',
    keywords: ['investigação', 'segredo', 'revelação'],
  },
  {
    id: 'fantasia',
    wrapColor: 'var(--kraft)',
    genre: 'Fantasia',
    mood: 'Épico e aventureiro',
    length: 'Leitura longa',
    keywords: ['jornada', 'reino', 'magia'],
  },
  {
    id: 'romance',
    wrapColor: 'var(--blue-400)',
    genre: 'Romance',
    mood: 'Emocionante e acolhedor',
    length: 'Leitura curta',
    keywords: ['encontros', 'verão', 'promessa'],
  },
  {
    id: 'ficcao',
    wrapColor: 'var(--navy-900)',
    genre: 'Ficção científica',
    mood: 'Instigante e reflexivo',
    length: 'Leitura média',
    keywords: ['futuro', 'tecnologia', 'dilema'],
  },
]

export function DiscoverySection() {
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) =>
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section className={styles.section} id="descobertas" aria-labelledby="descobertas-title">
      <div className="container">
        <SectionHeader
          id="descobertas-title"
          eyebrow="Descobertas"
          title="Que tipo de pacote combina com você?"
          description="Toque em um pacote para ler as pistas. São exemplos ilustrativos do formato: não representam livros específicos."
        />

        <ul className={styles.grid}>
          {SAMPLES.map((sample) => {
            const isRevealed = revealed.has(sample.id)
            return (
              <li key={sample.id}>
                <button
                  type="button"
                  className={`${styles.package} ${isRevealed ? styles.revealed : ''}`}
                  style={{ ['--wrap' as string]: sample.wrapColor }}
                  aria-pressed={isRevealed}
                  aria-label={
                    isRevealed
                      ? `Pistas: ${sample.genre}. ${sample.mood}. ${sample.length}. Palavras-chave: ${sample.keywords.join(', ')}.`
                      : 'Pacote secreto: mostrar pistas deste pacote'
                  }
                  onClick={() => toggle(sample.id)}
                >
                  <span className={styles.front} aria-hidden="true">
                    <span className={styles.ribbon} />
                    <span className={styles.frontLabel}>Pacote secreto</span>
                    <span className={styles.frontHint}>Ver pistas</span>
                  </span>
                  <span className={styles.back} aria-hidden="true">
                    <span className={styles.genre}>{sample.genre}</span>
                    <span className={styles.mood}>{sample.mood}</span>
                    <span className={styles.length}>{sample.length}</span>
                    <span className={styles.keywords}>{sample.keywords.join(' · ')}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className={styles.cta}>
          <Button to="/quiz" size="lg">
            Descobrir o meu pacote
          </Button>
        </div>
      </div>
    </section>
  )
}
