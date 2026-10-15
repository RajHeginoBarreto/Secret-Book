import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiRequest, toApiError } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { ErrorState, LoadingState } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  clearQuizProgress,
  lastResultId,
  loadQuizProgress,
  rememberLastResult,
  saveQuizProgress,
  type QuizProgress,
} from './quizStorage'
import { pruneAnswers, visibleQuestions, type QuizDefinition, type QuizQuestion, type QuizResult } from './quizTypes'
import styles from './QuizPage.module.css'

const LETTERS = 'ABCDEFGHIJ'

export function QuizPage() {
  usePageTitle('Quiz literário')
  const quiz = useApi<QuizDefinition>('/api/quiz')

  return (
    <QuizShell>
      {quiz.error && <ErrorState error={quiz.error} onRetry={quiz.reload} />}
      {!quiz.data && !quiz.error && <LoadingState label="Preparando as perguntas…" />}
      {quiz.data && <QuizRunner questions={quiz.data.questions} />}
    </QuizShell>
  )
}

function QuizRunner({ questions }: { questions: QuizQuestion[] }) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState<QuizProgress>(
    () => loadQuizProgress(questions) ?? { step: 0, answers: {} },
  )
  const [showResumeNotice, setShowResumeNotice] = useState(() => Object.keys(progress.answers).length > 0)
  const [previousResult] = useState(() => (Object.keys(progress.answers).length === 0 ? lastResultId() : null))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusAfterChange = useRef(false)

  // Salvamento automático a cada mudança.
  useEffect(() => {
    saveQuizProgress(progress)
  }, [progress])

  // Ao trocar de pergunta, leva o foco ao enunciado (ajuda leitores de tela e teclado).
  useEffect(() => {
    if (focusAfterChange.current) {
      headingRef.current?.focus()
      focusAfterChange.current = false
    }
  }, [progress.step])

  const visible = visibleQuestions(questions, progress.answers)
  const step = Math.min(progress.step, visible.length - 1)
  const question = visible[step]!
  const selected = progress.answers[question.slug] ?? []
  const answeredCount = visible.filter((item) => (progress.answers[item.slug] ?? []).length > 0).length
  const percent = Math.round((answeredCount / visible.length) * 100)
  const isLast = step === visible.length - 1

  const restart = () => {
    clearQuizProgress()
    focusAfterChange.current = true
    setShowResumeNotice(false)
    setError(null)
    setProgress({ step: 0, answers: {} })
  }

  const choose = (optionSlug: string) => {
    setError(null)
    setProgress((current) => {
      const chosen = current.answers[question.slug] ?? []
      let next: string[]
      if (!question.multiple) {
        next = [optionSlug]
      } else {
        const option = question.options.find((item) => item.slug === optionSlug)
        if (chosen.includes(optionSlug)) next = chosen.filter((slug) => slug !== optionSlug)
        else if (option?.exclusive) next = [optionSlug]
        else {
          const exclusive = new Set(question.options.filter((item) => item.exclusive).map((item) => item.slug))
          next = [...chosen.filter((slug) => !exclusive.has(slug)), optionSlug]
        }
      }
      return { ...current, answers: { ...current.answers, [question.slug]: next } }
    })
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const result = await apiRequest<QuizResult>('/api/quiz/attempts', {
        method: 'POST',
        body: { answers: pruneAnswers(questions, progress.answers) },
      })
      clearQuizProgress()
      rememberLastResult(result.id)
      navigate(`/quiz/resultado/${result.id}`, { state: { result } })
    } catch (caught) {
      setError(toApiError(caught).message)
      setSubmitting(false)
    }
  }

  const goNext = () => {
    if (question.required && selected.length === 0) {
      setError(question.multiple ? 'Escolha pelo menos uma opção para continuar.' : 'Escolha uma resposta para continuar.')
      return
    }
    setShowResumeNotice(false)
    if (isLast) {
      void submit()
      return
    }
    focusAfterChange.current = true
    setProgress((current) => ({ ...current, step: step + 1 }))
  }

  const goBack = () => {
    setError(null)
    focusAfterChange.current = true
    setProgress((current) => ({ ...current, step: Math.max(0, step - 1) }))
  }

  return (
    <>
      {showResumeNotice && (
        <div className={styles.notice} role="status">
          <span>Retomamos seu quiz de onde você parou.</span>
          <Button variant="ghost" onClick={restart}>
            <RotateCcw size={16} aria-hidden="true" /> Recomeçar
          </Button>
        </div>
      )}
      {previousResult && step === 0 && (
        <div className={styles.notice}>
          <span>Você já fez o quiz neste navegador.</span>
          <Link to={`/quiz/resultado/${previousResult}`} className={styles.noticeLink}>
            Ver meu último resultado
          </Link>
        </div>
      )}

      <div className={styles.meta}>
        <span>
          Pergunta {step + 1} de {visible.length}
        </span>
        <span>{percent}% respondido</span>
      </div>
      <div
        className={styles.bar}
        role="progressbar"
        aria-label="Progresso do quiz"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <i style={{ width: `${percent}%` }} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          goNext()
        }}
      >
        <fieldset className={styles.fieldset} aria-describedby={error ? 'quiz-erro' : undefined}>
          <legend className={styles.legend}>
            <h2 ref={headingRef} tabIndex={-1} className={styles.question}>
              {question.text}
            </h2>
            {question.helpText && <span className={styles.help}>{question.helpText}</span>}
          </legend>

          <div className={styles.options}>
            {question.options.map((option, index) => {
              const inputId = `quiz-${question.slug}-${option.slug}`
              const checked = selected.includes(option.slug)
              return (
                <label key={inputId} htmlFor={inputId} className={`${styles.option} ${checked ? styles.selected : ''}`}>
                  <input
                    id={inputId}
                    type={question.multiple ? 'checkbox' : 'radio'}
                    name={`quiz-${question.slug}`}
                    value={option.slug}
                    checked={checked}
                    onChange={() => choose(option.slug)}
                    className={styles.radio}
                  />
                  <span className={`${styles.letter} ${question.multiple ? styles.square : ''}`} aria-hidden="true">
                    {LETTERS[index]}
                  </span>
                  <span>{option.text}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <p id="quiz-erro" className={styles.error} role="alert">
          {error}
        </p>

        <div className={styles.actions}>
          {step > 0 ? (
            <Button variant="outline" onClick={goBack} disabled={submitting}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" loading={submitting}>
            {isLast ? 'Ver meu perfil' : 'Próxima'} <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </>
  )
}

export function QuizShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <section className={styles.top} aria-labelledby="quiz-title">
        <span className={styles.eyebrow}>
          <span aria-hidden="true">✦ </span>Quiz Secret Book
        </span>
        <h1 id="quiz-title">Vamos descobrir seu perfil de leitura</h1>
      </section>
      <div className={`${styles.box} ${wide ? styles.wide : ''}`}>{children}</div>
    </>
  )
}
