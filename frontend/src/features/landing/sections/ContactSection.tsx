import { CircleCheck } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { SectionHeader } from '../../../components/ui/SectionHeader'
import { buildWhatsAppUrl } from '../../../config/site'
import { buildContactMessage, validateContact, type ContactErrors, type ContactValues } from '../contact'
import styles from './ContactSection.module.css'

const EMPTY: ContactValues = { name: '', email: '', message: '' }

type Status = { kind: 'idle' } | { kind: 'sent'; url: string; blocked: boolean }

export function ContactSection() {
  const [values, setValues] = useState<ContactValues>(EMPTY)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const handleChange = (field: keyof ContactValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = validateContact(values)
    setErrors(found)
    const firstInvalid = (Object.keys(found) as (keyof ContactValues)[])[0]
    if (firstInvalid) {
      document.getElementById(`contato-${firstInvalid}`)?.focus()
      return
    }

    const url = buildWhatsAppUrl(buildContactMessage(values))
    // A mensagem é montada aqui e enviada pelo próprio WhatsApp do visitante:
    // nada passa pelo nosso servidor.
    // Sem "noopener" nas features porque, com ele, window.open sempre retorna null
    // e não daria para detectar bloqueio de pop-up. O opener é anulado logo em seguida.
    const opened = window.open(url, '_blank')
    if (opened) opened.opener = null
    setStatus({ kind: 'sent', url, blocked: opened === null })
    setValues(EMPTY)
  }

  const fieldProps = (field: keyof ContactValues) => ({
    id: `contato-${field}`,
    name: field,
    value: values[field],
    onChange: handleChange(field),
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `contato-${field}-erro` : undefined,
  })

  return (
    <section className={styles.section} id="contato" aria-labelledby="contato-title">
      <div className={styles.inner}>
        <SectionHeader
          id="contato-title"
          eyebrow="Fale com a gente"
          title="Contato"
          description="Dúvidas, sugestões ou ideias? Preencha os campos e continue a conversa pelo WhatsApp."
        />

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="contato-name">Nome</label>
            <input type="text" autoComplete="name" placeholder="Seu nome" {...fieldProps('name')} />
            {errors.name && (
              <p id="contato-name-erro" className={styles.error}>
                {errors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="contato-email">E-mail</label>
            <input type="email" autoComplete="email" placeholder="nome@exemplo.com" {...fieldProps('email')} />
            {errors.email && (
              <p id="contato-email-erro" className={styles.error}>
                {errors.email}
              </p>
            )}
          </div>

          <div className={`${styles.field} ${styles.full}`}>
            <label htmlFor="contato-message">Mensagem</label>
            <textarea rows={5} placeholder="Sua mensagem" {...fieldProps('message')} />
            {errors.message && (
              <p id="contato-message-erro" className={styles.error}>
                {errors.message}
              </p>
            )}
          </div>

          <div className={`${styles.full} ${styles.actions}`}>
            <Button type="submit" size="lg">
              Enviar pelo WhatsApp
            </Button>
            <p className={styles.note}>Abre o WhatsApp em uma nova aba com a mensagem pronta para você enviar.</p>
          </div>

          <div className={styles.full} aria-live="polite">
            {status.kind === 'sent' && (
              <p className={styles.success}>
                <CircleCheck size={18} aria-hidden="true" />
                <span>
                  {status.blocked ? 'Seu navegador bloqueou a nova aba. ' : 'Abrimos o WhatsApp com sua mensagem. '}
                  Se não abriu,{' '}
                  <a href={status.url} target="_blank" rel="noopener noreferrer">
                    clique aqui para continuar
                  </a>
                  .
                </span>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
