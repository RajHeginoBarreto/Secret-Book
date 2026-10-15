import { Check, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { PLANS } from '../../../data/plans'
import { formatPrice } from '../../../utils/format'
import styles from './PlansSection.module.css'

export function PlansSection() {
  return (
    <section className={styles.section} id="planos" aria-labelledby="planos-title">
      <div className="container">
        <SectionHeader
          id="planos-title"
          eyebrow="Clube Secret Book"
          title="Escolha seu ritmo de leitura"
          description="Compare os planos e simule uma assinatura. Tudo aqui é demonstrativo."
        />

        <ul className={styles.list}>
          {PLANS.map((plan) => (
            <li key={plan.slug} className={`${styles.plan} ${plan.featured ? styles.featured : ''}`}>
              <span className={styles.label}>{plan.label}</span>
              <h3 className={styles.name}>{plan.name}</h3>
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
                variant={plan.featured ? 'primary' : 'outline'}
                fullWidth
                aria-label={`Escolher o plano ${plan.name}`}
              >
                Escolher este plano
              </Button>
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
