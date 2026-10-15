import { Compass, RotateCcw, ShieldCheck, Target, type LucideIcon } from 'lucide-react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import styles from './BenefitsSection.module.css'

interface Benefit {
  icon: LucideIcon
  title: string
  text: string
}

const BENEFITS: Benefit[] = [
  {
    icon: Target,
    title: 'Feito a partir das suas respostas',
    text: 'O perfil literário é calculado com base no que você responde, não sorteado.',
  },
  {
    icon: Compass,
    title: 'Saia da bolha com segurança',
    text: 'Combine gêneros que você ama com outros que deseja explorar, no seu ritmo.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus limites são respeitados',
    text: 'Temas que você prefere evitar ficam fora da seleção.',
  },
  {
    icon: RotateCcw,
    title: 'Melhora a cada leitura',
    text: 'Suas avaliações ajustam as próximas sugestões, e você sempre pode ver o porquê de cada uma.',
  },
]

export function BenefitsSection() {
  return (
    <section className={styles.section} id="beneficios" aria-labelledby="beneficios-title">
      <div className="container">
        <SectionHeader
          id="beneficios-title"
          eyebrow="Personalização"
          title="Uma surpresa que tem a sua cara"
          description="O mistério está no título, não no gosto. Cada escolha parte do seu perfil de leitura."
        />
        <ul className={styles.grid}>
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className={styles.card}>
              <span className={styles.icon} aria-hidden="true">
                <Icon size={24} strokeWidth={1.7} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
