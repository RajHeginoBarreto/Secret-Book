import { Check } from 'lucide-react'
import { ClueCard } from '../components/ClueCard'
import styles from './CluesSection.module.css'

const CLUE_ITEMS = ['Gênero e clima da história', 'Extensão aproximada da leitura', 'Palavras-chave que despertam curiosidade']

export function CluesSection() {
  return (
    <section className={styles.section} id="pistas" aria-labelledby="pistas-title">
      <div className={styles.inner}>
        <div className={styles.visual}>
          <ClueCard
            label="Exemplo de cartão de pistas"
            title="Mistério com toque de romance"
            details="Leitura média · narrativa em primeira pessoa"
            keywords={['segredo', 'ilha', 'traição']}
          />
        </div>

        <div className={styles.content}>
          <span className={styles.eyebrow}>
            <span aria-hidden="true">✦ </span>Pistas na embalagem
          </span>
          <h2 id="pistas-title">
            Sem revelar o título.
            <br />
            Mas com boas pistas.
          </h2>
          <p>
            Cada pacote traz um cartão que deixa você sentir a história antes de abrir, sem estragar a surpresa.
          </p>
          <ul className={styles.list}>
            {CLUE_ITEMS.map((item) => (
              <li key={item}>
                <Check size={18} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
