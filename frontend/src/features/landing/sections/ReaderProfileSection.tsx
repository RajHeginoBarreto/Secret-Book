import { BookHeart, KeyRound, MessageSquareQuote, ShieldCheck, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { useReveal } from '../../../hooks/useReveal'
import styles from './ReaderProfileSection.module.css'

const SHELF = [
  { color: '#c49a6c', height: 92 },
  { color: '#2a2420', height: 108 },
  { color: '#efe4d0', height: 84 },
  { color: '#8f7454', height: 100 },
  { color: '#3d342c', height: 88 },
  { color: '#d0aa55', height: 96 },
]

export function ReaderProfileSection() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} className={`paper ${styles.section}`} id="perfil" aria-labelledby="perfil-title">
      <div className={`container ${styles.inner}`}>
        <div>
          <SectionHeader
            id="perfil-title"
            align="left"
            eyebrow="seu cantinho de leitor"
            title="Um perfil que guarda a sua história com os livros"
            description="Monte sua estante, conte o que você ama (e o que não suporta) e comente cada livro que terminou. Tudo isso deixa as próximas surpresas ainda mais certeiras."
          />
          <ul className={styles.features}>
            <li>
              <BookHeart size={20} aria-hidden="true" /> Livros favoritos e já lidos
            </li>
            <li>
              <ThumbsUp size={20} aria-hidden="true" /> Gêneros que você ama
            </li>
            <li>
              <ThumbsDown size={20} aria-hidden="true" /> Gêneros que prefere evitar
            </li>
            <li>
              <UserRound size={20} aria-hidden="true" /> Autores do coração
            </li>
            <li>
              <MessageSquareQuote size={20} aria-hidden="true" /> Comentários nos livros que leu
            </li>
          </ul>

          <div className={styles.lgpd}>
            <ShieldCheck size={26} aria-hidden="true" />
            <div>
              <strong>Só nome e senha. Sério.</strong>
              <p>
                Seguindo a LGPD, pedimos o mínimo: nada de e-mail, CPF ou telefone para criar a conta. Você pode baixar
                ou apagar todos os seus dados quando quiser.
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <Button to="/cadastro" size="lg">
              <KeyRound size={18} aria-hidden="true" /> Criar meu perfil
            </Button>
            <Button to="/entrar" size="lg" variant="outline">
              Já tenho conta
            </Button>
          </div>
        </div>

        {/* Prévia ilustrativa do perfil */}
        <div className={styles.mock} data-reveal="" aria-hidden="true">
          <div className={styles.mockHead}>
            <span className={styles.avatar}>L</span>
            <div>
              <strong>leitora noturna</strong>
              <small>12 livros lidos · 4 favoritos</small>
            </div>
          </div>

          <div className={styles.shelf}>
            {SHELF.map((book, index) => (
              <span key={index} style={{ background: book.color, height: book.height }} />
            ))}
          </div>

          <div className={styles.chips}>
            <span className={styles.like}>♥ fantasia</span>
            <span className={styles.like}>♥ mistério</span>
            <span className={styles.like}>♥ romance de época</span>
            <span className={styles.dislike}>✕ terror</span>
          </div>

          <p className={styles.authors}>
            <small>autores do coração</small>
            Jane Austen · Agatha Christie · Machado de Assis
          </p>

          <blockquote className={styles.comment}>
            “Li em dois dias. A última pista do cartão fez todo sentido no capítulo final!”
            <span>★★★★★</span>
          </blockquote>
        </div>
      </div>
    </section>
  )
}
