/**
 * Configurações públicas do site. Nada aqui é segredo: tudo vai para o
 * navegador do visitante. Segredos ficam somente no backend.
 */
export const SITE = {
  name: 'Secret Book',
  tagline: 'Uma experiência literária dentro de uma caixinha.',
  /** Número público de contato pelo WhatsApp (formato internacional, só dígitos). */
  whatsappNumber: '5548998017673',
} as const

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${SITE.whatsappNumber}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
