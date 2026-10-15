import { ListChecks, PackageOpen, WandSparkles, type LucideIcon } from 'lucide-react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import styles from './HowItWorksSection.module.css'

interface Step {
  icon: LucideIcon
  title: string
  text: string
}

const STEPS: Step[] = [
  {
    icon: ListChecks,
    title: 'Você responde',
    text: 'Um quiz curto revela seus gêneros favoritos, o clima de história que te prende e o que você prefere evitar.',
  },
  {
    icon: WandSparkles,
    title: 'Nós selecionamos',
    text: 'Suas respostas viram um perfil literário. A seleção compara esse perfil com as características de cada obra.',
  },
  {
    icon: PackageOpen,
    title: 'Você descobre',
    text: 'O livro chega embrulhado com um cartão de pistas, marca-páginas e adesivos. A história se revela aos poucos.',
  },
]

export function HowItWorksSection() {
  return (
    <section className={styles.section} id="como-funciona" aria-labelledby="como-funciona-title">
      <div className="container">
        <SectionHeader
          id="como-funciona-title"
          eyebrow="Como funciona"
          title="Uma nova forma de encontrar sua próxima leitura"
          description="Três passos para transformar a escolha de um livro em uma pequena aventura."
        />
        <ol className={styles.steps}>
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className={styles.step}>
              <div className={styles.illustration} aria-hidden="true">
                <span className={styles.iconWrap}>
                  <Icon size={34} strokeWidth={1.6} />
                </span>
              </div>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
