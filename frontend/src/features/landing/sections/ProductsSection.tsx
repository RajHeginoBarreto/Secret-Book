import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { useReveal } from '../../../hooks/useReveal'
import { ChalkSign } from '../components/ChalkSign'
import { KraftPackage } from '../components/KraftPackage'
import styles from './ProductsSection.module.css'

export function ProductsSection() {
  const ref = useReveal<HTMLElement>()
  const [flipped, setFlipped] = useState(false)

  return (
    <section ref={ref} className={`tinsel ${styles.section}`} id="produtos" aria-labelledby="produtos-title">
      <div className="container">
        <SectionHeader
          id="produtos-title"
          tone="dark"
          eyebrow="como são os produtos"
          title="Feito à mão, do embrulho à etiqueta"
          description="Cada detalhe foi pensado para que abrir um Secret Book seja tão bom quanto ler."
        />

        <ul className={styles.grid}>
          <li className={`${styles.card} ${styles.wide}`} data-reveal="">
            <div className={styles.stage}>
              <KraftPackage size="lg" tilt={-4} tag={['suspense', 'noite · carta']} />
            </div>
            <div className={styles.body}>
              <span className={styles.kicker}>O livro surpresa</span>
              <h3>Embrulhado em kraft e barbante</h3>
              <p>
                Um livro selecionado para você, envolto em papel kraft, amarrado com barbante cru, laço e um coraçãozinho
                desenhado à mão. Nenhuma pista do título por fora.
              </p>
              <ul className={styles.specs}>
                <li>Livro novo, escolhido pelo seu perfil</li>
                <li>Embrulho artesanal, um a um</li>
                <li>Lacre com coração ♥</li>
              </ul>
            </div>
          </li>

          <li className={styles.card} data-reveal="" data-reveal-delay="100">
            <div className={styles.stage}>
              <button
                type="button"
                className={`${styles.flip} ${flipped ? styles.flipped : ''}`}
                aria-pressed={flipped}
                aria-label={flipped ? 'Virar o cartão de pistas para a frente' : 'Virar o cartão de pistas para ver o verso'}
                onClick={() => setFlipped((current) => !current)}
              >
                <span className={styles.flipFront}>
                  <small>pista nº 1</small>
                  Mistério com toque de romance
                  <RotateCw size={16} aria-hidden="true" />
                </span>
                <span className={styles.flipBack}>
                  <small>palavras-chave</small>
                  segredo · ilha · traição
                  <small>leitura média · 1ª pessoa</small>
                </span>
              </button>
            </div>
            <div className={styles.body}>
              <span className={styles.kicker}>O cartão de pistas</span>
              <h3>Sinta a história antes de abrir</h3>
              <p>Gênero, clima, extensão e três palavras-chave. Toque no cartão para virar.</p>
            </div>
          </li>

          <li className={styles.card} data-reveal="" data-reveal-delay="200">
            <div className={styles.stage}>
              <div className={styles.tote} aria-hidden="true">
                <span className={styles.handle} />
                <span className={styles.toteBody}>
                  <span className={styles.toteText}>Read More</span>
                  <span className={styles.toteBook}>
                    <span />
                    <span />
                  </span>
                </span>
              </div>
            </div>
            <div className={styles.body}>
              <span className={styles.kicker}>A ecobag</span>
              <h3>“Read More” em algodão cru</h3>
              <p>Ecobag ilustrada para carregar seus livros (e os próximos). Vem nos planos maiores.</p>
            </div>
          </li>

          <li className={styles.card} data-reveal="" data-reveal-delay="300">
            <div className={styles.stage}>
              <div className={styles.bookmarks} aria-hidden="true">
                <span>✦</span>
                <span>♥</span>
                <span>☾</span>
              </div>
            </div>
            <div className={styles.body}>
              <span className={styles.kicker}>Os mimos</span>
              <h3>Marca-páginas e adesivos</h3>
              <p>Marca-páginas da edição e adesivos colecionáveis para personalizar seus cadernos de leitura.</p>
            </div>
          </li>

          <li className={`${styles.card} ${styles.chalkCard}`} data-reveal="" data-reveal-delay="400">
            <ChalkSign easel={false}>
              Livro avulso
              <strong>R$ 22,00</strong>
              <small>no estande · pague no Pix ♡</small>
            </ChalkSign>
            <div className={styles.body}>
              <span className={styles.kicker}>Sem assinatura</span>
              <h3>Avulso, para presentear</h3>
              <p>
                Encontrou nosso estande? Escolha um pacote pelas pistas e leve na hora. Valores demonstrativos neste
                protótipo.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}
