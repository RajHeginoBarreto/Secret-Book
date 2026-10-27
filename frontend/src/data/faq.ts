export interface FaqItem {
  question: string
  answer: string
}

export const FAQ: FaqItem[] = [
  {
    question: 'Como vocês escolhem o meu livro?',
    answer:
      'Tudo começa no quiz literário. Suas respostas formam um perfil de leitura (gêneros, clima das histórias, temas que você prefere evitar), e a seleção busca obras compatíveis com esse perfil. Quanto mais você avalia as sugestões, mais a seleção se ajusta.',
  },
  {
    question: 'Vou saber qual é o livro antes de abrir?',
    answer:
      'Não. A ideia é o encontro às cegas: o livro vem embrulhado, acompanhado de um cartão com pistas como gênero, extensão e palavras-chave. Você sente a história sem estragar a surpresa.',
  },
  {
    question: 'E se eu receber um livro que já li?',
    answer:
      'No seu perfil de leitor você marca os livros que já leu, os gêneros que ama e os que prefere evitar, e os autores do coração. Livros lidos deixam de ser recomendados para você.',
  },
  {
    question: 'Os planos e preços são reais?',
    answer:
      'Não. O Secret Book é um protótipo de portfólio. Os planos, valores e benefícios são demonstrativos, e o fluxo de assinatura é apenas uma simulação: nenhum valor é cobrado.',
  },
  {
    question: 'Posso trocar ou cancelar meu plano?',
    answer:
      'No protótipo, a troca e o cancelamento também são simulações. A ideia é demonstrar como esses fluxos funcionariam sem burocracia.',
  },
  {
    question: 'Que dados vocês pedem para criar a conta?',
    answer:
      'Só um nome de usuário e uma senha, seguindo o princípio de minimização da LGPD: nada de e-mail, CPF ou telefone. Em Minha conta você pode baixar todos os seus dados ou excluir a conta quando quiser. Seus comentários nos livros aparecem com o seu nome de usuário.',
  },
  {
    question: 'Preciso de conta para fazer o quiz?',
    answer:
      'Não. Você pode responder ao quiz e ver seu perfil sem cadastro. A conta serve para guardar seus resultados, sua biblioteca e suas avaliações.',
  },
]
