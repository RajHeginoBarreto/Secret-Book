import { Check, Gift, PackageOpen, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { useReveal } from '../../../hooks/useReveal'
import styles from './HowItWorksSection.module.css'

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Sparkles,
    title: 'Você escolhe o tema',
    text: 'Responda ao quiz literário ou nos conte o clima que quer ler: romance, mistério, fantasia, terror…',
  },
  {
    icon: Gift,
    title: 'A gente monta o livro',
    text: 'Selecionamos uma obra que combina com seu perfil e embrulhamos à mão em kraft, barbante e etiqueta de pistas.',
  },
  {
    icon: PackageOpen,
    title: 'É uma surpresa!',
    text: 'O livro chega sem o título à vista. Só as pistas. A história você descobre quando desamarrar o laço.',
  },
]

export function HowItWorksSection() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`paper ${styles.section}`} id="como-funciona" aria-labelledby="como-funciona-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <SectionHeader
            id="como-funciona-title"
            align="left"
            eyebrow="como funciona"
            title="Uma nova forma de encontrar sua próxima leitura"
            description="Inspirado no nosso estande de livros surpresa: três passos simples, uma leitura inesquecível."
          />

          {/* Cartaz de lona, como o pendurado na mesa do estande */}
          <div className={styles.poster} data-reveal="">
            <p className={styles.posterTitle}>Secret Book</p>
            <p className={styles.posterSub}>Livros surpresa!</p>
            <ul>
              {STEPS.map((step) => (
                <li key={step.title}>
                  <Check size={18} aria-hidden="true" strokeWidth={3} />
                  {step.title}
                </li>
              ))}
            </ul>
            <p className={styles.posterFoot}>porque todo livro é uma nova aventura ♥</p>
          </div>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li key={step.title} data-reveal="" data-reveal-delay={index * 140}>
              <div className={styles.step}>
                <span className={styles.number} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.icon} aria-hidden="true">
                  <step.icon size={24} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
