import type { BookSummary } from '../catalog/catalogTypes'

export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'READ'

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  WANT_TO_READ: 'Quero ler',
  READING: 'Lendo',
  READ: 'Lido',
}

export interface LibraryEntry {
  book: BookSummary
  status: ReadingStatus | null
  favorite: boolean
  updatedAt: string | null
  /** Nota de 1 a 5 do comentário (opcional). */
  rating: number | null
  comment: string | null
  reviewedAt: string | null
}

/** Preferências do perfil de leitor. */
export interface ReaderProfile {
  likedGenres: string[]
  dislikedGenres: string[]
  favoriteAuthors: string[]
}

/** Comentário público de um livro lido; author é o nome de usuário. */
export interface BookComment {
  author: string
  rating: number | null
  comment: string
  reviewedAt: string
}

/** Tipos literários sugeridos no perfil (o leitor também pode digitar outros). */
export const LITERARY_TYPES = [
  'Romance',
  'Romance de época',
  'Fantasia',
  'Mistério',
  'Suspense',
  'Thriller',
  'Terror',
  'Ficção científica',
  'Distopia',
  'Clássicos',
  'Literatura brasileira',
  'Poesia',
  'Drama',
  'Comédia',
  'Young adult',
  'HQ e mangá',
  'Biografia',
  'Não ficção',
  'Autoajuda',
  'Contos',
]

export interface FeedbackEntry {
  book: BookSummary
  useful: boolean
  comment: string | null
  attemptId: string | null
  updatedAt: string
}

export interface AttemptSummary {
  id: string
  createdAt: string
  profileName: string
  recommendedTitles: string[]
}

export interface Plan {
  slug: string
  name: string
  monthlyPriceCents: number
  booksPerMonth: number
}

export interface Subscription {
  id: number
  plan: Plan
  status: 'ACTIVE' | 'CANCELED'
  startedAt: string
  canceledAt: string | null
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const dateTimeFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}
