import { ArrowLeft, Check, CircleCheck, Info } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import { findPlan, PLANS } from '../../data/plans'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatPrice, pluralize } from '../../utils/format'
import { NotFoundPage } from '../misc/NotFoundPage'
import styles from './CheckoutDemoPage.module.css'

/**
 * Fluxo DEMONSTRATIVO de assinatura: seleção → resumo → confirmação → sucesso.
 * Não há pagamento nem gateway. Com login, o plano escolhido fica registrado na conta (assinatura demonstrativa);
 * sem login, nada é salvo. A interface diz isso explicitamente nos dois casos.
 */
export function CheckoutDemoPage() {
  const { planSlug } = useParams()
  const plan = findPlan(planSlug)
  const navigate = useNavigate()
  const location = useLocation()
  const { status } = useAuth()
  const loggedIn = status === 'authenticated'
  usePageTitle(plan ? `Simular assinatura — ${plan.name}` : 'Plano não encontrado')

  // A confirmação vale só para o plano em que foi feita: trocar de plano reinicia o fluxo.
  const [confirmedSlug, setConfirmedSlug] = useState<string | null>(null)
  const [savedToAccount, setSavedToAccount] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const successRef = useRef<HTMLHeadingElement>(null)
  const isDone = plan !== undefined && confirmedSlug === plan.slug

  useEffect(() => {
    if (isDone) successRef.current?.focus()
  }, [isDone])

  if (!plan) {
    return <NotFoundPage />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!acknowledged) {
      setError('Confirme que entendeu que esta é uma simulação sem cobrança.')
      return
    }
    setError(null)
    if (!loggedIn) {
      setSavedToAccount(false)
      setConfirmedSlug(plan.slug)
      return
    }
    setSubmitting(true)
    try {
      await apiRequest('/api/me/subscription', { method: 'POST', body: { planSlug: plan.slug } })
      setSavedToAccount(true)
      setConfirmedSlug(plan.slug)
    } catch (caught) {
      setError(toApiError(caught).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isDone) {
    return (
      <div className={styles.page}>
        <section className={styles.success} aria-labelledby="sucesso-title">
          <span className={styles.badge}>Simulação</span>
          <CircleCheck size={48} className={styles.successIcon} aria-hidden="true" />
          <h1 id="sucesso-title" ref={successRef} tabIndex={-1}>
            Simulação concluída
          </h1>
          <p>
            Você simulou a assinatura do plano <strong>{plan.name}</strong> ({formatPrice(plan.monthlyPrice)}/mês).
          </p>
          <p className={styles.important}>
            <Info size={18} aria-hidden="true" />
            {savedToAccount
              ? 'Nenhum pagamento foi realizado. A assinatura demonstrativa ficou registrada na sua conta.'
              : 'Nenhum pagamento foi realizado e nenhum dado foi salvo. Este é um protótipo de portfólio.'}
          </p>
          <div className={styles.actions}>
            {savedToAccount ? <Button to="/minha-conta">Ver minha conta</Button> : <Button to="/quiz">Fazer o quiz</Button>}
            <Button to="/#planos" variant="outline">
              Voltar aos planos
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/#planos" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" /> Voltar aos planos
      </Link>

      <header className={styles.header}>
        <span className={styles.badge}>Simulação · nenhum valor será cobrado</span>
        <h1>Simular assinatura</h1>
        <p>Escolha um plano, revise o resumo e confirme. É só uma demonstração do fluxo.</p>
      </header>

      <div className={styles.layout}>
        <fieldset className={styles.chooser}>
          <legend>1. Escolha o plano</legend>
          {PLANS.map((option) => (
            <label key={option.slug} className={`${styles.planOption} ${option.slug === plan.slug ? styles.active : ''}`}>
              <input
                type="radio"
                name="plano"
                value={option.slug}
                checked={option.slug === plan.slug}
                onChange={() => {
                  setAcknowledged(false)
                  setError(null)
                  navigate(`/assinar/${option.slug}`, { replace: true, preventScrollReset: true })
                }}
                className={styles.radio}
              />
              <span className={styles.planName}>
                {option.name}
                {option.featured && <span className={styles.popular}>Mais popular</span>}
              </span>
              <span className={styles.planMeta}>
                {pluralize(option.booksPerMonth, 'livro', 'livros')} por mês · {formatPrice(option.monthlyPrice)}/mês
              </span>
            </label>
          ))}
        </fieldset>

        <form className={styles.summary} onSubmit={handleSubmit} aria-labelledby="resumo-title" noValidate>
          <h2 id="resumo-title">2. Resumo</h2>
          <dl className={styles.details}>
            <div>
              <dt>Plano</dt>
              <dd>{plan.name}</dd>
            </div>
            <div>
              <dt>Livros por mês</dt>
              <dd>{plan.booksPerMonth}</dd>
            </div>
            <div>
              <dt>Mensalidade (fictícia)</dt>
              <dd>{formatPrice(plan.monthlyPrice)}</dd>
            </div>
            <div className={styles.total}>
              <dt>Cobrado hoje</dt>
              <dd>{formatPrice(0)}</dd>
            </div>
          </dl>

          <ul className={styles.perks}>
            {plan.perks.map((perk) => (
              <li key={perk}>
                <Check size={16} aria-hidden="true" /> {perk}
              </li>
            ))}
          </ul>

          <h2 className={styles.stepTitle}>3. Confirmação</h2>
          <label className={styles.ack}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => {
                setAcknowledged(event.target.checked)
                if (event.target.checked) setError(null)
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'ack-erro' : undefined}
            />
            <span>
              {loggedIn
                ? 'Entendo que esta é uma simulação: nenhum pagamento será feito. O plano ficará registrado na minha conta.'
                : 'Entendo que esta é uma simulação: nenhum pagamento será feito e nenhum dado será salvo.'}
            </span>
          </label>
          <p id="ack-erro" className={styles.error} role="alert">
            {error}
          </p>
          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Confirmar simulação
          </Button>
          {!loggedIn && (
            <p className={styles.loginHint}>
              <Link to={`/entrar?voltar=${encodeURIComponent(location.pathname)}`}>Entre na sua conta</Link> para
              registrar a assinatura demonstrativa e vê-la em "Minha conta".
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
