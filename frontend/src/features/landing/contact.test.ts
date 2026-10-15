import { describe, expect, it } from 'vitest'
import { buildContactMessage, validateContact } from './contact'

const valid = { name: 'Ana', email: 'ana@exemplo.com', message: 'Uma mensagem com tamanho suficiente.' }

describe('validateContact', () => {
  it('aceita dados válidos', () => {
    expect(validateContact(valid)).toEqual({})
  })

  it('ignora espaços nas bordas ao validar', () => {
    expect(validateContact({ ...valid, name: '   ' }).name).toBeDefined()
  })

  it.each(['ana', 'ana@', 'ana@exemplo', 'a na@exemplo.com'])('recusa e-mail inválido: %s', (email) => {
    expect(validateContact({ ...valid, email }).email).toBeDefined()
  })

  it('limita o tamanho da mensagem', () => {
    expect(validateContact({ ...valid, message: 'curta' }).message).toBeDefined()
    expect(validateContact({ ...valid, message: 'x'.repeat(1001) }).message).toBeDefined()
  })
})

describe('buildContactMessage', () => {
  it('monta o texto com os campos aparados', () => {
    const text = buildContactMessage({ name: ' Ana ', email: 'ana@exemplo.com ', message: ' Oi! ' })
    expect(text).toContain('*Nome:* Ana\n')
    expect(text).toContain('*E-mail:* ana@exemplo.com\n')
    expect(text.endsWith('Oi!')).toBe(true)
  })
})
