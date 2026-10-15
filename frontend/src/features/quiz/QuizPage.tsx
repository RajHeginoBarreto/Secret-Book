import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { usePageTitle } from '../../hooks/usePageTitle'
import { QUIZ_QUESTIONS } from './quizData'
import { computeQuizResult } from './quizEngine'
import { clearQuizProgress, emptyProgress, loadQuizProgress, saveQuizProgress, type QuizProgress } from './quizStorage'
import { QuizResultView } from './QuizResultView'
import styles from './QuizPage.module.css'

const LETTERS = 'ABCDEFGH'

export function QuizPage() {
  usePageTitle('Quiz literário')
  const questions = QUIZ_QUESTIONS

  const [progress, setProgress] = useState<QuizProgress>(() => loadQuizProgress(questions) ?? emptyProgress(questions.length))
  const [showResumeNotice, setShowResumeNotice] = useState(
    () => !progress.finished && progress.answers.some((answer) => answer !== null),
  )
  const [error, setError] = useState<string | null>(null)
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
  }, [progress.step, progress.finished])

  const result = useMemo(
    () => (progress.finished ? computeQuizResult(questions, progress.answers) : null),
    [progress, questions],
  )

  const restart = () => {
    clearQuizProgress()
    focusAfterChange.current = true
    setShowResumeNotice(false)
    setError(null)
    setProgress(emptyProgress(questions.length))
  }

  if (result) {
    return (
      <QuizShell>
        <QuizResultView result={result} headingRef={headingRef} onRestart={restart} />
      </QuizShell>
    )
  }

  const { step, answers } = progress
  const question = questions[step]!
  const selected = answers[step]
  const answeredCount = answers.filter((answer) => answer !== null).length
  const percent = Math.round((answeredCount / questions.length) * 100)
  const isLast = step === questions.length - 1

  const choose = (optionIndex: number) => {
    setError(null)
    setProgress((current) => ({
      ...current,
      answers: current.answers.map((answer, index) => (index === current.step ? optionIndex : answer)),
    }))
  }

  const goNext = () => {
    if (selected === null || selected === undefined) {
      setError('Escolha uma resposta para continuar.')
      return
    }
    focusAfterChange.current = true
    setShowResumeNotice(false)
    setProgress((current) =>
      isLast ? { ...current, finished: true } : { ...current, step: current.step + 1 },
    )
  }

  const goBack = () => {
    setError(null)
    focusAfterChange.current = true
    setProgress((current) => ({ ...current, step: Math.max(0, current.step - 1) }))
  }

  return (
    <QuizShell>
      {showResumeNotice && (
        <div className={styles.notice} role="status">
          <span>Retomamos seu quiz de onde você parou.</span>
          <Button variant="ghost" onClick={restart}>
            <RotateCcw size={16} aria-hidden="true" /> Recomeçar
          </Button>
        </div>
      )}

      <div className={styles.meta}>
        <span>
          Pergunta {step + 1} de {questions.length}
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
          </legend>

          <div className={styles.options}>
            {question.options.map((option, index) => {
              const inputId = `quiz-${question.id}-${index}`
              return (
                <label key={inputId} htmlFor={inputId} className={`${styles.option} ${selected === index ? styles.selected : ''}`}>
                  <input
                    id={inputId}
                    type="radio"
                    name={`quiz-${question.id}`}
                    value={index}
                    checked={selected === index}
                    onChange={() => choose(index)}
                    className={styles.radio}
                  />
                  <span className={styles.letter} aria-hidden="true">
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
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft size={18} aria-hidden="true" /> Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit">
            {isLast ? 'Ver meu perfil' : 'Próxima'} <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </div>
      </form>
    </QuizShell>
  )
}

function QuizShell({ children }: { children: ReactNode }) {
  return (
    <>
      <section className={styles.top} aria-labelledby="quiz-title">
        <span className={styles.eyebrow}>
          <span aria-hidden="true">✦ </span>Quiz Secret Book
        </span>
        <h1 id="quiz-title">Vamos descobrir seu perfil de leitura</h1>
      </section>
      <div className={styles.box}>{children}</div>
    </>
  )
}
