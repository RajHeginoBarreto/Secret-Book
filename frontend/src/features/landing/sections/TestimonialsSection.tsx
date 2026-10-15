import { Quote } from 'lucide-react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { TESTIMONIALS } from '../../../data/testimonials'
import styles from './TestimonialsSection.module.css'

export function TestimonialsSection() {
  return (
    <section className={styles.section} id="depoimentos" aria-labelledby="depoimentos-title">
      <div className="container">
        <SectionHeader
          id="depoimentos-title"
          eyebrow="Histórias de leitura"
          title="Como seria receber um Secret Book"
          description={
            <>
              <span className={styles.badge}>Depoimentos fictícios</span> Textos criados para demonstrar a experiência.
              Não são de clientes reais.
            </>
          }
        />
        <ul className={styles.grid}>
          {TESTIMONIALS.map((item) => (
            <li key={item.quote}>
              <figure className={styles.card}>
                <Quote size={28} aria-hidden="true" className={styles.icon} />
                <blockquote>
                  <p>{item.quote}</p>
                </blockquote>
                <figcaption>
                  <strong>{item.persona}</strong>
                  <span>{item.profile}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
