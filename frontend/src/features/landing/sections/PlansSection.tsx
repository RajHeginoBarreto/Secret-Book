import { Check, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { PLANS } from '../../../data/plans'
import { useReveal } from '../../../hooks/useReveal'
import { formatPrice } from '../../../utils/format'
import styles from './PlansSection.module.css'

export function PlansSection() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`tinsel ${styles.section}`} id="planos" aria-labelledby="planos-title">
      <div className="container">
        <SectionHeader
          id="planos-title"
          tone="dark"
          eyebrow="clube secret book"
          title="Escolha seu ritmo de leitura"
          description="Todo mês, livros surpresa embrulhados à mão na sua porta. Compare os planos e simule uma assinatura."
        />

        <ul className={styles.list}>
          {PLANS.map((plan, index) => (
            <li key={plan.slug} data-reveal="" data-reveal-delay={index * 120}>
              <article className={`${styles.plan} ${plan.featured ? styles.featured : ''}`}>
                <span className={styles.hole} aria-hidden="true" />
                <span className={styles.label}>{plan.label}</span>
                <h3 className={styles.name}>{plan.name}</h3>
                <p className={styles.books} aria-hidden="true">
                  {Array.from({ length: plan.booksPerMonth }, (_, book) => (
                    <span key={book} />
                  ))}
                </p>
                <p className={styles.price}>
                  {formatPrice(plan.monthlyPrice)}
                  <small>/mês</small>
                </p>
                <p className={styles.summary}>{plan.summary}</p>
                <ul className={styles.perks}>
                  {plan.perks.map((perk) => (
                    <li key={perk}>
                      <Check size={16} aria-hidden="true" />
                      {perk}
                    </li>
                  ))}
                </ul>
                <Button
                  to={`/assinar/${plan.slug}`}
                  variant={plan.featured ? 'primary' : 'outline-light'}
                  fullWidth
                  aria-label={`Escolher o plano ${plan.name}`}
                >
                  Escolher este plano
                </Button>
              </article>
            </li>
          ))}
        </ul>

        <p className={styles.disclaimer}>
          <Info size={16} aria-hidden="true" />
          Protótipo: valores e benefícios fictícios. Nenhuma cobrança é feita.
        </p>
      </div>
    </section>
  )
}
