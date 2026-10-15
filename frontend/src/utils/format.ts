const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/** Formata um valor inteiro em reais. Ex.: 38 → "R$ 38". */
export function formatPrice(value: number): string {
  return brl.format(value)
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
