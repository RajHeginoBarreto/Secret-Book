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
}

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
