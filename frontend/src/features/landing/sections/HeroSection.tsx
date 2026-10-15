import { ArrowRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <section className={styles.hero} id="inicio" aria-labelledby="hero-title">
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>
            <span aria-hidden="true">✦ </span>Encontro às cegas com um livro
          </span>
          <h1 id="hero-title" className={styles.title}>
            Livros que combinam
            <br />
            com <em>você</em>
          </h1>
          <p className={styles.lead}>
            Responda ao quiz literário e descubra seu perfil de leitura. A cada mês, um livro chega embrulhado à mão,
            com pistas, mas sem o título. Você só descobre a história quando abrir.
          </p>
          <div className={styles.actions}>
            <Button to="/quiz" size="lg" variant="light">
              Descobrir meu perfil <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button to="/#planos" size="lg" variant="outline-light">
              Ver planos
            </Button>
          </div>
          <p className={styles.note}>Leva cerca de 2 minutos · não precisa de cadastro</p>
        </div>

        <div className={styles.art} aria-hidden="true">
          <span className={`${styles.spark} ${styles.sparkOne}`}>✦</span>
          <span className={`${styles.spark} ${styles.sparkTwo}`}>✦</span>
          <span className={`${styles.spark} ${styles.sparkThree}`}>✦</span>
          <div className={styles.package}>
            <div className={styles.string} />
            <div className={styles.stringH} />
            <div className={styles.tag}>
              <span>Pista nº 1</span>
              <strong>segredo · ilha</strong>
            </div>
          </div>
          <div className={styles.books}>
            <div className={`${styles.book} ${styles.bookOne}`} />
            <div className={`${styles.book} ${styles.bookTwo}`} />
            <div className={`${styles.book} ${styles.bookThree}`} />
          </div>
        </div>
      </div>
    </section>
  )
}
