/**
 * Planos DEMONSTRATIVOS do protótipo. Valores e benefícios são fictícios.
 * Nesta etapa vivem no frontend; quando o backend de assinaturas existir,
 * passarão a ser servidos pela API (e gerenciados no painel administrativo).
 */
export interface Plan {
  slug: string
  name: string
  /** Preço mensal em reais (inteiro, sem centavos). */
  monthlyPrice: number
  booksPerMonth: number
  label: string
  summary: string
  perks: string[]
  featured?: boolean
}

export const PLANS: Plan[] = [
  {
    slug: 'leitor-casual',
    name: 'Leitor casual',
    monthlyPrice: 38,
    booksPerMonth: 1,
    label: 'Para começar',
    summary: 'Para quem quer descobrir novas leituras sem pressa.',
    perks: ['1 livro surpresa por mês', 'Cartão de pistas personalizado', 'Marca-páginas da edição'],
  },
  {
    slug: 'leitor-avido',
    name: 'Leitor ávido',
    monthlyPrice: 70,
    booksPerMonth: 2,
    label: 'Mais popular',
    summary: 'Para quem termina um livro e já quer o próximo.',
    perks: [
      '2 livros surpresa por mês',
      'Cartões de pistas personalizados',
      'Marca-páginas e adesivos da edição',
    ],
    featured: true,
  },
  {
    slug: 'maratona-literaria',
    name: 'Maratona literária',
    monthlyPrice: 130,
    booksPerMonth: 4,
    label: 'Para maratonar',
    summary: 'Para quem lê várias histórias ao mesmo tempo.',
    perks: [
      '4 livros surpresa por mês',
      'Cartões de pistas personalizados',
      'Brindes demonstrativos exclusivos',
    ],
  },
]

export function findPlan(slug: string | undefined): Plan | undefined {
  return PLANS.find((plan) => plan.slug === slug)
}
