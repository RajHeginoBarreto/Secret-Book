import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import styles from './QuizCtaSection.module.css'

export function QuizCtaSection() {
  return (
    <section className={styles.wrap} aria-labelledby="quiz-cta-title">
      <div className={styles.band}>
        <div>
          <span className={styles.eyebrow}>
            <span aria-hidden="true">✦ </span>Seu próximo livro está esperando
          </span>
          <h2 id="quiz-cta-title">Pronto(a) para o seu encontro às cegas?</h2>
          <p>Responda ao quiz e descubra o perfil literário que combina com você.</p>
        </div>
        <Button to="/quiz" variant="light" size="lg">
          Começar o quiz <ArrowRight size={18} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
