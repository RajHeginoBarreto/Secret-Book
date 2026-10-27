import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Balloons } from '../components/Balloons'
import { Bunting } from '../components/Bunting'
import { ChalkSign } from '../components/ChalkSign'
import { KraftPackage } from '../components/KraftPackage'
import styles from './HeroSection.module.css'

const GENRES = ['romance', 'fantasia', 'suspense', 'clássicos', 'terror', 'poesia', 'ficção científica', 'drama', 'mistério', 'distopia']

export function HeroSection() {
  return (
    <section className={`tinsel ${styles.hero}`} id="inicio" aria-labelledby="hero-title">
      <Balloons side="left" />
      <Sparkle className={styles.sparkA} />
      <Sparkle className={styles.sparkB} />
      <Sparkle className={styles.sparkC} />

      <div className={styles.inner}>
        <Bunting rows={['SECRET', 'BOOK']} />

        <div className={styles.grid}>
          <div className={styles.content}>
            <span className={styles.eyebrow}>encontro às cegas com um livro ♥</span>
            <h1 id="hero-title" className={styles.title}>
              Livros surpresa que combinam com <em>você</em>
            </h1>
            <p className={styles.lead}>
              Você escolhe o tema, a gente monta o livro e embrulha à mão em papel kraft, com barbante e um cartão de
              pistas. O título? Só quando você abrir.
            </p>
            <div className={styles.actions}>
              <Button to="/quiz" size="lg" variant="light">
                <Sparkles size={18} aria-hidden="true" /> Descobrir meu tema
              </Button>
              <Button to="/#planos" size="lg" variant="outline-light">
                Ver planos <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
            <p className={styles.note}>Quiz de 2 minutos · sem cadastro · conta só com nome e senha</p>
          </div>

          <div className={styles.art}>
            <div className={styles.basket} aria-hidden="true">
              <KraftPackage size="md" tilt={-8} floatDelay={0.4} tag={['romance', 'de época']} className={styles.pkgBack} />
              <KraftPackage size="lg" tilt={4} tag={['mistério', 'segredo · ilha']} className={styles.pkgFront} />
              <KraftPackage size="sm" tilt={12} floatDelay={1.1} tag={['fantasia', 'magia']} className={styles.pkgSide} />
              <span className={styles.wire} />
            </div>
            <ChalkSign className={styles.price}>
              Livros
              <br />
              Surpresa
              <strong>a partir de R$ 22</strong>
              <small>valor demonstrativo ♡</small>
            </ChalkSign>
          </div>
        </div>
      </div>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.track}>
          {[...GENRES, ...GENRES].map((genre, index) => (
            <span key={`${genre}-${index}`}>
              {genre} <i>✦</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={`${styles.sparkle} ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor" />
    </svg>
  )
}
