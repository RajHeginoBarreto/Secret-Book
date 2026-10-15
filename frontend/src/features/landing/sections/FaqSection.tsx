import { ChevronDown } from 'lucide-react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { FAQ } from '../../../data/faq'
import styles from './FaqSection.module.css'

export function FaqSection() {
  return (
    <section className={styles.section} id="faq" aria-labelledby="faq-title">
      <div className={styles.inner}>
        <SectionHeader id="faq-title" eyebrow="Dúvidas frequentes" title="Perguntas antes de abrir a caixa" />
        {/* <details>/<summary> são nativos: acessíveis por teclado e leitores de tela sem JavaScript extra. */}
        <div className={styles.list}>
          {FAQ.map((item) => (
            <details key={item.question} className={styles.item}>
              <summary>
                <span>{item.question}</span>
                <ChevronDown size={20} aria-hidden="true" className={styles.chevron} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
