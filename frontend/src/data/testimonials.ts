/**
 * Depoimentos FICTÍCIOS, criados apenas para demonstrar o layout.
 * Não representam clientes nem opiniões reais; a interface deixa isso explícito.
 */
export interface Testimonial {
  quote: string
  persona: string
  profile: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Eu sempre voltava para os mesmos autores. O cartão de pistas me convenceu a abrir uma fantasia sombria, e virou meu gênero favorito do ano.',
    persona: 'Leitora fictícia',
    profile: 'Perfil: Fantasia sombria',
  },
  {
    quote:
      'Gosto de não saber o que vem. Abrir o pacote no fim do mês virou um ritual de domingo, com café e uma página de cada vez.',
    persona: 'Leitor fictício',
    profile: 'Perfil: Mistério clássico',
  },
  {
    quote:
      'O quiz entendeu que eu queria algo leve depois de um ano pesado. As pistas acertaram o clima sem entregar a história.',
    persona: 'Pessoa leitora fictícia',
    profile: 'Perfil: Romance de tirar o fôlego',
  },
]
