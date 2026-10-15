import { BookOpen, Bookmark, ScrollText, Sticker, type LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import styles from './SurpriseBoxSection.module.css'

interface BoxItem {
  icon: LucideIcon
  title: string
  text: string
}

const BOX_ITEMS: BoxItem[] = [
  { icon: BookOpen, title: 'Um livro embrulhado', text: 'Escolhido para o seu perfil, sem o título à mostra.' },
  { icon: ScrollText, title: 'Cartão de pistas', text: 'Gênero, clima e palavras-chave para aguçar a curiosidade.' },
  { icon: Bookmark, title: 'Marca-páginas', text: 'Uma arte diferente a cada edição.' },
  { icon: Sticker, title: 'Adesivos', text: 'Pequenos detalhes para decorar sua estante.' },
]

export function SurpriseBoxSection() {
  const [open, setOpen] = useState(false)
  const contentsId = useId()

  return (
    <section className={styles.section} id="caixa" aria-labelledby="caixa-title">
      <div className="container">
        <SectionHeader
          id="caixa-title"
          tone="dark"
          eyebrow="A caixa surpresa"
          title="O que chega na sua porta"
          description="Uma ilustração de como é uma caixa do clube. Abra para espiar o conteúdo."
        />

        <div className={`${styles.stage} ${open ? styles.isOpen : ''}`}>
          <div className={styles.box} aria-hidden="true">
            <div className={styles.lid}>
              <span className={styles.bow} />
            </div>
            <div className={styles.body}>
              <span className={styles.keyhole} />
            </div>
            <div className={styles.peek}>
              <span className={styles.peekBook} />
              <span className={styles.peekCard} />
            </div>
          </div>

          <div className={styles.side}>
            <Button
              variant={open ? 'outline-light' : 'light'}
              size="lg"
              aria-expanded={open}
              aria-controls={contentsId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Fechar a caixa' : 'Abrir a caixa'}
            </Button>

            <ul id={contentsId} className={styles.items} hidden={!open}>
              {BOX_ITEMS.map(({ icon: Icon, title, text }, index) => (
                <li key={title} style={{ animationDelay: `${index * 90}ms` }}>
                  <span className={styles.itemIcon} aria-hidden="true">
                    <Icon size={22} strokeWidth={1.7} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <span className={styles.itemText}>{text}</span>
                  </span>
                </li>
              ))}
            </ul>
            {!open && <p className={styles.hint}>Clique para ver o que vem dentro.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
