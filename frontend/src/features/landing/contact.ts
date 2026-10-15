export interface ContactValues {
  name: string
  email: string
  message: string
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Validação do formulário de contato. Retorna um objeto vazio quando tudo está certo. */
export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const message = values.message.trim()

  if (name.length < 2) errors.name = 'Informe seu nome (pelo menos 2 letras).'
  else if (name.length > 80) errors.name = 'Use no máximo 80 caracteres.'

  if (!email) errors.email = 'Informe seu e-mail.'
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido, como nome@exemplo.com.'

  if (message.length < 10) errors.message = 'Escreva uma mensagem com pelo menos 10 caracteres.'
  else if (message.length > 1000) errors.message = 'Use no máximo 1000 caracteres.'

  return errors
}

export function buildContactMessage(values: ContactValues): string {
  return [
    'Olá, Secret Book! Vim pelo site.',
    '',
    `*Nome:* ${values.name.trim()}`,
    `*E-mail:* ${values.email.trim()}`,
    '',
    '*Mensagem:*',
    values.message.trim(),
  ].join('\n')
}
