/**
 * Perguntas e perfis do quiz (versão 1), portados do Quiz.html original.
 * Cada opção soma 1 ponto para um gênero e carrega uma palavra-chave usada
 * no cartão de pistas do resultado.
 *
 * Esta versão roda inteiramente no navegador. Na etapa do quiz v2 as perguntas
 * passarão a vir do backend, com perguntas condicionais e mais critérios.
 */
export type GenreKey = 'misterio' | 'romance' | 'fantasia' | 'ficcao'

export const GENRE_LABELS: Record<GenreKey, string> = {
  misterio: 'Mistério',
  romance: 'Romance',
  fantasia: 'Fantasia',
  ficcao: 'Ficção científica',
}

export interface QuizOption {
  text: string
  genre: GenreKey
  keyword: string
}

export interface QuizQuestion {
  id: string
  text: string
  options: QuizOption[]
}

export interface Profile {
  name: string
  description: string
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'noite-livre',
    text: 'Em uma noite livre, o que você prefere fazer?',
    options: [
      { text: 'Assistir a uma série de investigação', genre: 'misterio', keyword: 'investigação' },
      { text: 'Ver uma comédia romântica', genre: 'romance', keyword: 'encontros' },
      { text: 'Jogar um RPG ou ver um filme de aventura', genre: 'fantasia', keyword: 'jornada' },
      { text: 'Ver um documentário sobre o espaço', genre: 'ficcao', keyword: 'espaço' },
    ],
  },
  {
    id: 'historia-que-prende',
    text: 'Que tipo de história te prende mais?',
    options: [
      { text: 'Cheia de segredos e reviravoltas', genre: 'misterio', keyword: 'segredo' },
      { text: 'Com personagens e emoções intensas', genre: 'romance', keyword: 'paixão' },
      { text: 'Em mundos mágicos e criaturas incríveis', genre: 'fantasia', keyword: 'magia' },
      { text: 'Sobre o futuro e a tecnologia', genre: 'ficcao', keyword: 'tecnologia' },
    ],
  },
  {
    id: 'lugar',
    text: 'Qual destes lugares você gostaria de visitar?',
    options: [
      { text: 'Uma ilha isolada e misteriosa', genre: 'misterio', keyword: 'ilha' },
      { text: 'Uma cidade charmosa na Europa', genre: 'romance', keyword: 'Europa' },
      { text: 'Um reino encantado', genre: 'fantasia', keyword: 'reino' },
      { text: 'Uma estação espacial', genre: 'ficcao', keyword: 'estação espacial' },
    ],
  },
  {
    id: 'final',
    text: 'Como você gosta que um livro termine?',
    options: [
      { text: 'Com uma revelação que muda tudo', genre: 'misterio', keyword: 'revelação' },
      { text: 'Com um final emocionante', genre: 'romance', keyword: 'final feliz' },
      { text: 'Com uma grande batalha vencida', genre: 'fantasia', keyword: 'batalha' },
      { text: 'Com uma ideia que me faça pensar', genre: 'ficcao', keyword: 'dilema' },
    ],
  },
  {
    id: 'superpoder',
    text: 'Qual superpoder você escolheria?',
    options: [
      { text: 'Ler pensamentos', genre: 'misterio', keyword: 'mente' },
      { text: 'Fazer todos se sentirem amados', genre: 'romance', keyword: 'afeto' },
      { text: 'Usar magia', genre: 'fantasia', keyword: 'feitiço' },
      { text: 'Viajar no tempo', genre: 'ficcao', keyword: 'viagem no tempo' },
    ],
  },
  {
    id: 'livro-perfeito',
    text: 'Como seria o livro perfeito para você?',
    options: [
      { text: 'Um que eu não consiga largar até descobrir o culpado', genre: 'misterio', keyword: 'culpado' },
      { text: 'Um que me faça rir e chorar', genre: 'romance', keyword: 'emoção' },
      { text: 'Um que me transporte para outro mundo', genre: 'fantasia', keyword: 'outro mundo' },
      { text: 'Um que me faça imaginar o que vem pela frente', genre: 'ficcao', keyword: 'futuro' },
    ],
  },
]

/**
 * Perfis: um gênero puro ou a combinação dos dois mais fortes
 * (chave em ordem alfabética, separada por "+").
 */
export const PROFILES: Record<string, Profile> = {
  misterio: {
    name: 'Mistério clássico',
    description:
      'Você gosta de segredos, pistas e reviravoltas. Combina com histórias que desafiam você a descobrir tudo antes do final.',
  },
  romance: {
    name: 'Romance de tirar o fôlego',
    description:
      'Você se conecta com personagens e sentimentos. Combina com histórias para se apaixonar e, talvez, chorar um pouquinho.',
  },
  fantasia: {
    name: 'Fantasia épica',
    description:
      'Você quer sair da realidade e explorar mundos novos. Combina com viagens cheias de magia e coragem.',
  },
  ficcao: {
    name: 'Ficção científica',
    description:
      'Você tem curiosidade sobre o futuro e as possibilidades. Combina com histórias que levam a imaginação longe.',
  },
  'misterio+romance': {
    name: 'Suspense romântico',
    description:
      'Você quer sentir o coração acelerar, de medo e de amor. Combina com segredos perigosos e paixões inesperadas.',
  },
  'fantasia+misterio': {
    name: 'Fantasia sombria',
    description: 'Magia e enigmas na mesma medida. Combina com mundos encantados onde nada é o que parece.',
  },
  'ficcao+misterio': {
    name: 'Thriller futurista',
    description:
      'Você gosta de pensar e de desconfiar de tudo. Combina com mistérios tecnológicos cheios de reviravoltas.',
  },
  'fantasia+romance': {
    name: 'Romantasia',
    description:
      'Você quer magia e um romance de arrancar suspiros. Combina com reinos, segredos e amores que mudam destinos.',
  },
  'ficcao+romance': {
    name: 'Amor além do tempo',
    description:
      'Você gosta de grandes ideias, mas quer sentir. Combina com histórias de amor que desafiam o tempo e o espaço.',
  },
  'fantasia+ficcao': {
    name: 'Mundos impossíveis',
    description:
      'Para você, quanto mais longe da realidade, melhor. Combina com aventuras épicas em mundos que ainda vão existir.',
  },
}
