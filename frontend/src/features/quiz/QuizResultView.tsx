import { RotateCcw } from 'lucide-react'
import type { RefObject } from 'react'
import { Button } from '../../components/ui/Button'
import { buildWhatsAppUrl } from '../../config/site'
import { ClueCard } from '../landing/components/ClueCard'
import type { QuizResult } from './quizEngine'
import styles from './QuizPage.module.css'

interface QuizResultViewProps {
  result: QuizResult
  headingRef: RefObject<HTMLHeadingElement | null>
  onRestart: () => void
}

export function QuizResultView({ result, headingRef, onRestart }: QuizResultViewProps) {
  const whatsappMessage = `Olá, Secret Book! Fiz o quiz no site e meu perfil literário deu *${result.profile.name}*. Quero saber mais!`

  return (
    <div className={styles.result}>
      <span className={styles.resultEyebrow}>
        <span aria-hidden="true">✦ </span>Seu perfil literário
      </span>
      <h2 ref={headingRef} tabIndex={-1} className={styles.resultTitle}>
        {result.profile.name}
      </h2>
      <p className={styles.resultText}>{result.profile.description}</p>

      <h3 className={styles.subTitle}>Como suas respostas se distribuíram</h3>
      <ul className={styles.affinity}>
        {result.ranking.map((score) => (
          <li key={score.genre} className={styles.affinityRow}>
            <span>{score.label}</span>
            <span className={styles.bar} aria-hidden="true">
              <i style={{ width: `${Math.round(score.share * 100)}%` }} />
            </span>
            <b>
              {score.points} de {result.answeredCount}
            </b>
          </li>
        ))}
      </ul>

      <div className={styles.clue}>
        <ClueCard
          compact
          label="Pistas do seu perfil"
          title={result.profile.name}
          details="Palavras-chave tiradas das suas respostas"
          keywords={result.keywords}
        />
      </div>

      <p className={styles.disclaimer}>
        Perfil inicial, calculado a partir de {result.answeredCount} respostas: cada uma soma um ponto ao gênero
        escolhido. As recomendações de livros e o refinamento por avaliações chegam com o catálogo e a sua conta.
      </p>

      <div className={styles.resultActions}>
        <Button to="/#planos">Ver planos</Button>
        <Button href={buildWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer" variant="outline">
          Falar pelo WhatsApp
        </Button>
        <Button variant="ghost" onClick={onRestart}>
          <RotateCcw size={16} aria-hidden="true" /> Refazer o quiz
        </Button>
      </div>
    </div>
  )
}
