import { usePageTitle } from '../../hooks/usePageTitle'
import { Button } from '../../components/ui/Button'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  usePageTitle('Página não encontrada')
  return (
    <section className={styles.page}>
      <span className={styles.code} aria-hidden="true">
        404
      </span>
      <h1>Esta página saiu da estante</h1>
      <p>O endereço que você procurou não existe ou foi movido. Que tal voltar e descobrir outra história?</p>
      <div className={styles.actions}>
        <Button to="/">Voltar ao início</Button>
        <Button to="/quiz" variant="outline">
          Fazer o quiz
        </Button>
      </div>
    </section>
  )
}
