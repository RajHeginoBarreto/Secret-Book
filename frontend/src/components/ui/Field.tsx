import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface FieldShellProps {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: (describedBy: string | undefined) => ReactNode
}

/** Rótulo + controle + dica + erro, com os atributos de acessibilidade ligados entre si. */
function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  const hintId = hint ? `${id}-dica` : undefined
  const errorId = error ? `${id}-erro` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children(describedBy)}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
}

export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      {(describedBy) => (
        <input
          id={id}
          className={`${styles.control} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
}

export function TextAreaField({ label, hint, error, className, ...props }: TextAreaFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      {(describedBy) => (
        <textarea
          id={id}
          className={`${styles.control} ${styles.textarea} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      )}
    </FieldShell>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
}

export function SelectField({ label, hint, error, className, children, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      {(describedBy) => (
        <select
          id={id}
          className={`${styles.control} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldShell>
  )
}

interface CheckboxGroupProps<T extends string> {
  legend: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (selected: T[]) => void
  error?: string
  columns?: number
}

/** Grupo de caixas de seleção (autores, gêneros, temas...). */
export function CheckboxGroup<T extends string>({ legend, options, selected, onChange, error, columns = 2 }: CheckboxGroupProps<T>) {
  const id = useId()
  return (
    <fieldset className={styles.group} aria-describedby={error ? `${id}-erro` : undefined}>
      <legend className={styles.label}>{legend}</legend>
      <div className={styles.options} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <label key={option.value} className={styles.check}>
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((value) => value !== option.value),
                )
              }
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-erro`} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  )
}
