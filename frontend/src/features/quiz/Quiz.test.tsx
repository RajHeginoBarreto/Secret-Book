import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setAuthToken } from '../../api/authToken'
import { makeBookDetail, READER } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderRoute } from '../../test/renderRoute'
import type { FeedbackEntry } from '../account/accountTypes'
import { LAST_RESULT_KEY, QUIZ_STORAGE_KEY } from './quizStorage'
import type { QuizDefinition, QuizQuestion, QuizResult } from './quizTypes'

const option = (slug: string, text: string, exclusive = false) => ({ slug, text, exclusive })

const question = (slug: string, text: string, options: QuizQuestion['options'], extra: Partial<QuizQuestion> = {}): QuizQuestion => ({
  slug,
  text,
  helpText: null,
  multiple: false,
  required: true,
  condition: null,
  options,
  ...extra,
})

/** Recorte das perguntas reais do quiz v2 (mesmos slugs e textos da migração V2__quiz.sql). */
const QUIZ: QuizDefinition = {
  questions: [
    question('noite-livre', 'Em uma noite livre, o que você prefere fazer?', [
      option('investigacao', 'Assistir a uma série de investigação'),
      option('comedia-romantica', 'Ver uma comédia romântica'),
      option('aventura', 'Jogar um RPG ou ver um filme de aventura'),
    ]),
    question('historia-que-prende', 'Que tipo de história te prende mais?', [
      option('segredos', 'Cheia de segredos e reviravoltas'),
      option('emocoes', 'Com personagens e emoções intensas'),
      option('magia', 'Em mundos mágicos e criaturas incríveis'),
    ]),
    question(
      'tipo-de-magia',
      'Já que você gosta de magia: qual delas te encanta?',
      [option('epica', 'Épica, com reinos, batalhas e grandes jornadas'), option('aconchegante', 'Aconchegante e divertida')],
      {
        helpText: 'Esta pergunta aparece porque você escolheu mundos mágicos.',
        condition: { question: 'historia-que-prende', option: 'magia' },
      },
    ),
    question('ritmo', 'Qual ritmo de leitura combina com você?', [
      option('devagar', 'Devagar, saboreando cada página'),
      option('rapido', 'Rápido: quero virar as páginas sem parar'),
    ]),
    question(
      'evitar',
      'Algum tema que você prefere evitar?',
      [
        option('nenhum', 'Nenhum, pode vir tudo', true),
        option('violencia', 'Violência'),
        option('luto', 'Luto e perda'),
        option('terror', 'Terror'),
      ],
      { multiple: true, helpText: 'Pode marcar mais de um. Livros com esses temas não serão recomendados.' },
    ),
  ],
}

const RESULT: QuizResult = {
  id: 'tentativa-1',
  createdAt: '2026-10-20T12:00:00Z',
  profile: { key: 'fantasia', name: 'Explorador de mundos', description: 'Você gosta de reinos, mapas e magia.' },
  genres: [
    { slug: 'fantasia', name: 'Fantasia', points: 3, percent: 75 },
    { slug: 'misterio', name: 'Mistério', points: 1, percent: 25 },
  ],
  preferences: { pace: 'FAST', tone: null, length: null, avoid: ['VIOLENCE'] },
  recommendations: [
    {
      position: 1,
      score: 87,
      breakdown: { genre: 100, pace: 80, tone: 50, length: 70 },
      reasons: ['Fantasia, o gênero que mais apareceu nas suas respostas', 'Ritmo rápido, como você pediu'],
      book: makeBookDetail({
        slug: 'o-reino-de-vidro',
        title: 'O Reino de Vidro',
        authors: [{ slug: 'bruno-bardo', name: 'Bruno Bardo' }],
        genres: [{ slug: 'fantasia', name: 'Fantasia' }],
        clues: ['coroa partida', 'dragão de vidro'],
        contentNotes: [],
      }),
    },
  ],
  excludedCount: 2,
}

const radio = (name: RegExp | string) => screen.getByRole('radio', { name })
const checkbox = (name: RegExp | string) => screen.getByRole('checkbox', { name })
const next = () => screen.getByRole('button', { name: /próxima/i })
/** Enunciado da pergunta atual (o h2 dentro do formulário do quiz). */
const questionHeading = (text: string | RegExp) => screen.getByRole('heading', { level: 2, name: text })

describe('Quiz v2', () => {
  it('percorre o quiz inteiro, envia só as respostas visíveis e abre o resultado', async () => {
    const { requests } = mockApi({
      'GET /api/quiz': { body: QUIZ },
      'POST /api/quiz/attempts': { status: 201, body: RESULT },
    })
    const { user, router } = renderRoute('/quiz')

    expect(await screen.findByText('Pergunta 1 de 4')).toBeInTheDocument()
    expect(questionHeading('Em uma noite livre, o que você prefere fazer?')).toBeInTheDocument()

    // Pergunta obrigatória: não avança sem resposta.
    await user.click(next())
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha uma resposta para continuar.')
    expect(screen.getByText('Pergunta 1 de 4')).toBeInTheDocument()

    await user.click(radio(/série de investigação/i))
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
    expect(screen.getByRole('progressbar', { name: 'Progresso do quiz' })).toHaveAttribute('aria-valuenow', '25')
    await user.click(next())

    expect(questionHeading('Que tipo de história te prende mais?')).toHaveFocus()
    await user.click(radio(/segredos e reviravoltas/i))
    await user.click(next())

    expect(screen.getByText('Pergunta 3 de 4')).toBeInTheDocument()
    await user.click(radio(/rápido/i))
    await user.click(next())

    expect(questionHeading('Algum tema que você prefere evitar?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ver meu perfil/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha pelo menos uma opção para continuar.')
    await user.click(checkbox('Violência'))
    await user.click(screen.getByRole('button', { name: /ver meu perfil/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/quiz/resultado/tentativa-1'))
    expect(await screen.findByRole('heading', { level: 2, name: 'Explorador de mundos' })).toBeInTheDocument()

    const attempt = requests.find((request) => request.method === 'POST')
    expect(attempt?.body).toEqual({
      answers: {
        'noite-livre': ['investigacao'],
        'historia-que-prende': ['segredos'],
        ritmo: ['rapido'],
        evitar: ['violencia'],
      },
    })
    // O resultado veio junto com a navegação: não precisa buscar de novo.
    expect(requests.some((request) => request.url === '/api/quiz/attempts/tentativa-1')).toBe(false)
    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem(LAST_RESULT_KEY)).toBe('tentativa-1')
  })

  it('só mostra "tipo-de-magia" depois de escolher "magia" e descarta a resposta se a escolha mudar', async () => {
    const { requests } = mockApi({
      'GET /api/quiz': { body: QUIZ },
      'POST /api/quiz/attempts': { status: 201, body: RESULT },
    })
    const { user } = renderRoute('/quiz')

    await user.click(await screen.findByRole('radio', { name: /série de investigação/i }))
    await user.click(next())
    expect(screen.getByText('Pergunta 2 de 4')).toBeInTheDocument()

    await user.click(radio(/mundos mágicos/i))
    // A pergunta condicional entra na contagem assim que é liberada.
    expect(screen.getByText('Pergunta 2 de 5')).toBeInTheDocument()
    await user.click(next())

    expect(questionHeading('Já que você gosta de magia: qual delas te encanta?')).toBeInTheDocument()
    expect(screen.getByText('Esta pergunta aparece porque você escolheu mundos mágicos.')).toBeInTheDocument()
    await user.click(radio(/aconchegante/i))

    // Volta e troca "magia" por "segredos": a condicional some.
    await user.click(screen.getByRole('button', { name: /voltar/i }))
    await user.click(radio(/segredos e reviravoltas/i))
    expect(screen.getByText('Pergunta 2 de 4')).toBeInTheDocument()
    await user.click(next())
    expect(questionHeading('Qual ritmo de leitura combina com você?')).toBeInTheDocument()

    await user.click(radio(/devagar/i))
    await user.click(next())
    await user.click(checkbox(/nenhum/i))
    await user.click(screen.getByRole('button', { name: /ver meu perfil/i }))

    await waitFor(() => expect(requests.some((request) => request.method === 'POST')).toBe(true))
    const answers = (requests.find((request) => request.method === 'POST')?.body as { answers: object }).answers
    expect(answers).not.toHaveProperty('tipo-de-magia')
    expect(answers).toEqual({
      'noite-livre': ['investigacao'],
      'historia-que-prende': ['segredos'],
      ritmo: ['devagar'],
      evitar: ['nenhum'],
    })
  })

  it('"Nenhum" não se combina com outros temas', async () => {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        step: 3,
        answers: { 'noite-livre': ['aventura'], 'historia-que-prende': ['emocoes'], ritmo: ['rapido'] },
      }),
    )
    mockApi({ 'GET /api/quiz': { body: QUIZ } })
    const { user } = renderRoute('/quiz')

    expect(await screen.findByRole('heading', { level: 2, name: 'Algum tema que você prefere evitar?' })).toBeInTheDocument()
    await user.click(checkbox('Violência'))
    await user.click(checkbox('Terror'))
    expect(checkbox('Violência')).toBeChecked()
    expect(checkbox('Terror')).toBeChecked()

    await user.click(checkbox(/nenhum/i))
    expect(checkbox(/nenhum/i)).toBeChecked()
    expect(checkbox('Violência')).not.toBeChecked()
    expect(checkbox('Terror')).not.toBeChecked()

    await user.click(checkbox(/luto/i))
    expect(checkbox(/luto/i)).toBeChecked()
    expect(checkbox(/nenhum/i)).not.toBeChecked()

    // Desmarcar funciona normalmente.
    await user.click(checkbox(/luto/i))
    expect(checkbox(/luto/i)).not.toBeChecked()
  })

  it('salva o progresso automaticamente a cada resposta', async () => {
    mockApi({ 'GET /api/quiz': { body: QUIZ } })
    const { user } = renderRoute('/quiz')

    await user.click(await screen.findByRole('radio', { name: /comédia romântica/i }))
    await user.click(next())

    const saved = JSON.parse(window.localStorage.getItem(QUIZ_STORAGE_KEY) ?? 'null') as unknown
    expect(saved).toEqual({ step: 1, answers: { 'noite-livre': ['comedia-romantica'] } })
  })

  it('retoma o progresso salvo e permite recomeçar', async () => {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ step: 2, answers: { 'noite-livre': ['aventura'], 'historia-que-prende': ['magia'] } }),
    )
    mockApi({ 'GET /api/quiz': { body: QUIZ } })
    const { user } = renderRoute('/quiz')

    expect(await screen.findByText('Retomamos seu quiz de onde você parou.')).toBeInTheDocument()
    expect(screen.getByText('Pergunta 3 de 5')).toBeInTheDocument()
    expect(questionHeading(/já que você gosta de magia/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /voltar/i }))
    expect(radio(/mundos mágicos/i)).toBeChecked()

    await user.click(screen.getByRole('button', { name: /recomeçar/i }))
    expect(screen.queryByText('Retomamos seu quiz de onde você parou.')).not.toBeInTheDocument()
    expect(screen.getByText('Pergunta 1 de 4')).toBeInTheDocument()
    expect(radio(/aventura/i)).not.toBeChecked()
    expect(JSON.parse(window.localStorage.getItem(QUIZ_STORAGE_KEY) ?? 'null')).toEqual({ step: 0, answers: {} })
  })

  it('descarta progresso salvo que não bate com as perguntas atuais', async () => {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ step: 3, answers: { 'noite-livre': ['opcao-que-nao-existe'] } }),
    )
    mockApi({ 'GET /api/quiz': { body: QUIZ } })
    renderRoute('/quiz')

    expect(await screen.findByText('Pergunta 1 de 4')).toBeInTheDocument()
    expect(screen.queryByText('Retomamos seu quiz de onde você parou.')).not.toBeInTheDocument()
  })

  it('oferece o último resultado de quem já fez o quiz neste navegador', async () => {
    window.localStorage.setItem(LAST_RESULT_KEY, 'tentativa-antiga')
    mockApi({ 'GET /api/quiz': { body: QUIZ } })
    renderRoute('/quiz')

    expect(await screen.findByRole('link', { name: 'Ver meu último resultado' })).toHaveAttribute(
      'href',
      '/quiz/resultado/tentativa-antiga',
    )
  })

  it('mostra o erro do envio e permite tentar de novo', async () => {
    window.localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({
        step: 3,
        answers: { 'noite-livre': ['aventura'], 'historia-que-prende': ['emocoes'], ritmo: ['rapido'], evitar: ['nenhum'] },
      }),
    )
    mockApi({
      'GET /api/quiz': { body: QUIZ },
      'POST /api/quiz/attempts': { status: 503, body: { title: 'Erro', detail: 'Serviço indisponível no momento.' } },
    })
    const { user, router } = renderRoute('/quiz')

    await user.click(await screen.findByRole('button', { name: /ver meu perfil/i }))
    expect(await screen.findByText('Serviço indisponível no momento.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/quiz')
    expect(screen.getByRole('button', { name: /ver meu perfil/i })).toBeEnabled()
    // O progresso continua salvo para uma nova tentativa.
    expect(window.localStorage.getItem(QUIZ_STORAGE_KEY)).not.toBeNull()
  })
})

describe('Resultado do quiz', () => {
  it('mostra o perfil, as preferências e embrulha o livro até ser revelado', async () => {
    mockApi({ 'GET /api/quiz/attempts/tentativa-1': { body: RESULT } })
    const { user } = renderRoute('/quiz/resultado/tentativa-1')

    expect(await screen.findByRole('heading', { level: 2, name: 'Explorador de mundos' })).toHaveFocus()
    expect(screen.getByText('Você gosta de reinos, mapas e magia.')).toBeInTheDocument()
    const genres = screen.getByRole('region', { name: 'Gêneros nas suas respostas' })
    expect(within(genres).getByText('75%')).toBeInTheDocument()
    const prefs = screen.getByRole('region', { name: 'O que você pediu' })
    expect(within(prefs).getByText('Ritmo rápido')).toBeInTheDocument()
    expect(within(prefs).getByText('Qualquer tamanho')).toBeInTheDocument()
    expect(within(prefs).getByText('Sem violência')).toBeInTheDocument()

    const card = screen.getByRole('article', { name: 'Livro-surpresa 1' })
    expect(within(card).getByText(/87/)).toBeInTheDocument()
    expect(within(card).getByText('coroa partida · dragão de vidro')).toBeInTheDocument()
    expect(within(card).queryByRole('link', { name: 'O Reino de Vidro' })).not.toBeInTheDocument()

    // Justificativas e afinidade por critério ficam visíveis mesmo embrulhado.
    expect(within(card).getByText('Ritmo rápido, como você pediu')).toBeInTheDocument()
    expect(within(card).getByLabelText('Afinidade por critério (0 a 100)')).toHaveTextContent('Gênero100')

    const reveal = within(card).getByRole('button', { name: /revelar o livro/i })
    expect(reveal).toHaveAttribute('aria-expanded', 'false')
    await user.click(reveal)
    expect(within(card).getByRole('link', { name: 'O Reino de Vidro' })).toHaveAttribute('href', '/livros/o-reino-de-vidro')
    expect(within(card).getByText('Bruno Bardo', { selector: 'p' })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: /embrulhar de novo/i })).toHaveAttribute('aria-expanded', 'true')

    expect(screen.getByText(/2 livros ficaram de fora/)).toBeInTheDocument()
  })

  it('para visitantes, convida a entrar e não mostra os botões de avaliação', async () => {
    const { requests } = mockApi({ 'GET /api/quiz/attempts/tentativa-1': { body: RESULT } })
    renderRoute('/quiz/resultado/tentativa-1')

    expect(await screen.findByText(/entre na sua conta para guardar o próximo resultado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /combinou/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /quero ler/i })).not.toBeInTheDocument()
    expect(requests.some((request) => request.url === '/api/me/feedback')).toBe(false)
  })

  it('com login, avalia a recomendação e guarda o livro como "Quero ler"', async () => {
    setAuthToken('t')
    const { requests } = mockApi({
      'GET /api/auth/me': { body: READER },
      'GET /api/quiz/attempts/tentativa-1': { body: RESULT },
      'GET /api/me/feedback': { body: [] },
      'PUT /api/me/feedback/o-reino-de-vidro': (request) => ({ body: request.body }),
      'PUT /api/me/library/o-reino-de-vidro': (request) => ({ body: request.body }),
    })
    const { user } = renderRoute('/quiz/resultado/tentativa-1')

    const card = await screen.findByRole('article', { name: 'Livro-surpresa 1' })
    expect(screen.queryByText(/entre na sua conta para guardar/i)).not.toBeInTheDocument()

    await user.click(await within(card).findByRole('button', { name: /não combina/i }))
    expect(await within(card).findByText(/não volta nas próximas recomendações/i)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: /não combina/i })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(card).getByRole('button', { name: /quero ler/i }))
    expect(await within(card).findByText(/adicionado à sua biblioteca/i)).toBeInTheDocument()

    expect(requests.find((request) => request.url === '/api/me/feedback/o-reino-de-vidro')?.body).toEqual({
      useful: false,
      attemptId: 'tentativa-1',
    })
    expect(requests.find((request) => request.url === '/api/me/library/o-reino-de-vidro')?.body).toEqual({
      status: 'WANT_TO_READ',
      favorite: false,
    })
  })

  it('com login, marca a avaliação que o leitor já tinha dado', async () => {
    setAuthToken('t')
    const previous: FeedbackEntry = {
      book: RESULT.recommendations[0]!.book,
      useful: true,
      comment: null,
      attemptId: 'tentativa-1',
      updatedAt: '2026-10-21T12:00:00Z',
    }
    mockApi({
      'GET /api/auth/me': { body: READER },
      'GET /api/quiz/attempts/tentativa-1': { body: RESULT },
      'GET /api/me/feedback': { body: [previous] },
    })
    renderRoute('/quiz/resultado/tentativa-1')

    await waitFor(() => expect(screen.getByRole('button', { name: /^combinou$/i })).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('button', { name: /não combina/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('avisa quando nenhum livro atende aos filtros', async () => {
    mockApi({ 'GET /api/quiz/attempts/vazio': { body: { ...RESULT, id: 'vazio', recommendations: [], excludedCount: 0 } } })
    renderRoute('/quiz/resultado/vazio')
    expect(await screen.findByText(/nenhum livro do catálogo atende a todos os seus filtros/i)).toBeInTheDocument()
  })

  it('"Refazer o quiz" apaga o progresso salvo e volta ao começo', async () => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ step: 1, answers: { 'noite-livre': ['aventura'] } }))
    mockApi({ 'GET /api/quiz/attempts/tentativa-1': { body: RESULT }, 'GET /api/quiz': { body: QUIZ } })
    const { user, router } = renderRoute('/quiz/resultado/tentativa-1')

    await user.click(await screen.findByRole('button', { name: /refazer o quiz/i }))
    expect(router.state.location.pathname).toBe('/quiz')
    expect(await screen.findByText('Pergunta 1 de 4')).toBeInTheDocument()
    expect(screen.queryByText('Retomamos seu quiz de onde você parou.')).not.toBeInTheDocument()
  })

  it('mostra a página 404 para resultado inexistente', async () => {
    renderRoute('/quiz/resultado/nao-existe')
    expect(await screen.findByRole('heading', { level: 1, name: /saiu da estante/i })).toBeInTheDocument()
  })
})
