import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { useReveal } from '../../../hooks/useReveal'
import { KraftPackage } from '../components/KraftPackage'
import styles from './QuizSection.module.css'

interface Theme {
  id: string
  label: string
  emoji: string
  clues: [string, string]
  description: string
}

const THEMES: Theme[] = [
  {
    id: 'romance',
    label: 'Romance',
    emoji: '♥',
    clues: ['romance', 'cartas · verão'],
    description: 'Amores improváveis, cartas esquecidas e aquele final que aperta o coração.',
  },
  {
    id: 'misterio',
    label: 'Mistério',
    emoji: '⚲',
    clues: ['mistério', 'segredo · ilha'],
    description: 'Um segredo antigo, uma ilha isolada e pistas que só fazem sentido no último capítulo.',
  },
  {
    id: 'fantasia',
    label: 'Fantasia',
    emoji: '✦',
    clues: ['fantasia', 'magia · reino'],
    description: 'Mundos com regras próprias, magia com preço e personagens que você vai querer reencontrar.',
  },
  {
    id: 'terror',
    label: 'Terror',
    emoji: '☾',
    clues: ['terror', 'casa · sussurros'],
    description: 'Uma casa que range, sussurros no corredor e a vontade de ler com a luz acesa.',
  },
  {
    id: 'classicos',
    label: 'Clássicos',
    emoji: '❦',
    clues: ['clássico', 'época · destino'],
    description: 'Obras que atravessaram gerações, para ler devagar e sublinhar frases inteiras.',
  },
  {
    id: 'ficcao',
    label: 'Ficção científica',
    emoji: '✺',
    clues: ['sci-fi', 'futuro · estrelas'],
    description: 'Futuros possíveis, viagens impossíveis e perguntas grandes sobre quem somos.',
  },
]

export function QuizSection() {
  const ref = useReveal<HTMLElement>()
  const [selected, setSelected] = useState<Theme>(THEMES[1]!)

  return (
    <section ref={ref} className={`paper ${styles.section}`} id="quiz" aria-labelledby="quiz-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <SectionHeader
            id="quiz-title"
            align="left"
            eyebrow="o quiz literário"
            title="Pronto(a) para o seu encontro às cegas?"
            description="Escolha um tema e veja como ficaria a etiqueta do seu pacote. No quiz completo, suas respostas viram um perfil de leitura com recomendações explicadas."
          />

          <div className={styles.themes} role="group" aria-label="Escolha um tema para testar">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={styles.theme}
                aria-pressed={selected.id === theme.id}
                onClick={() => setSelected(theme)}
              >
                <span aria-hidden="true">{theme.emoji}</span>
                {theme.label}
              </button>
            ))}
          </div>

          <p className={styles.preview} aria-live="polite">
            <strong>{selected.label}:</strong> {selected.description}
          </p>

          <div className={styles.actions}>
            <Button to="/quiz" size="lg">
              Fazer o quiz completo <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <span className={styles.time}>cerca de 2 minutos · sem cadastro</span>
          </div>
        </div>

        <div className={styles.visual} data-reveal="">
          <div className={styles.spotlight} />
          {/* key força a animação de "troca de pacote" sempre que o tema muda */}
          <div key={selected.id} className={styles.swap}>
            <KraftPackage size="lg" tilt={-3} tag={selected.clues} />
          </div>
          <p className={styles.caption}>sua etiqueta de pistas</p>
        </div>
      </div>
    </section>
  )
}
