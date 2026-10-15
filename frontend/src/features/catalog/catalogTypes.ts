export type Pace = 'SLOW' | 'MODERATE' | 'FAST'
export type Tone = 'LIGHT' | 'EMOTIONAL' | 'DARK' | 'THOUGHTFUL'
export type LengthCategory = 'SHORT' | 'MEDIUM' | 'LONG'
export type ContentNote = 'VIOLENCE' | 'GRIEF' | 'STRONG_LANGUAGE' | 'SEXUAL_CONTENT' | 'HORROR'

export interface Ref {
  slug: string
  name: string
}

export interface Genre extends Ref {
  description: string
  bookCount: number
}

export interface BookSummary {
  slug: string
  title: string
  authors: Ref[]
  genres: Ref[]
  pages: number
  length: LengthCategory
  pace: Pace
  tone: Tone
  publicationYear: number | null
  coverColor: string
}

export interface BookDetail extends BookSummary {
  synopsis: string
  contentNotes: ContentNote[]
  clues: string[]
}

export interface AuthorDetail extends Ref {
  bio: string
  books: BookSummary[]
}

export const PACE_LABELS: Record<Pace, string> = {
  SLOW: 'Lento',
  MODERATE: 'Equilibrado',
  FAST: 'Rápido',
}

export const TONE_LABELS: Record<Tone, string> = {
  LIGHT: 'Leve',
  EMOTIONAL: 'Emocionante',
  DARK: 'Sombrio',
  THOUGHTFUL: 'Reflexivo',
}

export const LENGTH_LABELS: Record<LengthCategory, string> = {
  SHORT: 'Curto',
  MEDIUM: 'Médio',
  LONG: 'Longo',
}

export const CONTENT_NOTE_LABELS: Record<ContentNote, string> = {
  VIOLENCE: 'Violência',
  GRIEF: 'Luto e perda',
  STRONG_LANGUAGE: 'Linguagem forte',
  SEXUAL_CONTENT: 'Cenas de sexo',
  HORROR: 'Terror',
}

export function authorNames(book: Pick<BookSummary, 'authors'>): string {
  return book.authors.map((author) => author.name).join(' e ')
}
