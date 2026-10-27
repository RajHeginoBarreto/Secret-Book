import type { Role } from '../auth/authTypes'
import type { ContentNote, Pace, Tone } from '../catalog/catalogTypes'

export interface CountItem {
  label: string
  count: number
}

export interface Stats {
  users: number
  readers: number
  admins: number
  activeBooks: number
  totalBooks: number
  quizAttempts: number
  quizAttemptsLast30Days: number
  activeSubscriptions: number
  subscriptionsByPlan: CountItem[]
  usefulFeedback: number
  notUsefulFeedback: number
  mostRecommendedBooks: CountItem[]
}

export interface AdminBookRow {
  id: number
  slug: string
  title: string
  authors: string[]
  genres: string[]
  active: boolean
  updatedAt: string
}

export interface AdminBook {
  id: number
  slug: string
  title: string
  synopsis: string
  publicationYear: number | null
  pages: number
  pace: Pace
  tone: Tone
  coverColor: string
  active: boolean
  authorSlugs: string[]
  genreSlugs: string[]
  contentNotes: ContentNote[]
  clues: string[]
}

export interface BookPayload {
  slug?: string
  title: string
  synopsis: string
  publicationYear: number | null
  pages: number
  pace: Pace
  tone: Tone
  coverColor: string
  active: boolean
  authorSlugs: string[]
  genreSlugs: string[]
  contentNotes: ContentNote[]
  clues: string[]
}

export interface AdminAuthor {
  id: number
  slug: string
  name: string
  bio: string
  bookCount: number
}

export interface AdminGenre {
  id: number
  slug: string
  name: string
  description: string
  bookCount: number
  usedByQuiz: boolean
}

export interface AdminUser {
  id: number
  name: string
  username: string
  email: string | null
  role: Role
  enabled: boolean
  createdAt: string
}

export interface AdminFeedback {
  id: number
  userName: string
  username: string
  userEmail: string | null
  bookSlug: string
  bookTitle: string
  useful: boolean
  comment: string | null
  attemptId: string | null
  updatedAt: string
}

export interface AdminSubscription {
  id: number
  userName: string
  username: string
  userEmail: string | null
  planName: string
  status: 'ACTIVE' | 'CANCELED'
  startedAt: string
  canceledAt: string | null
}

export interface RecommendationSettings {
  genreWeight: number
  paceWeight: number
  toneWeight: number
  lengthWeight: number
  maxResults: number
  mixThreshold: number
  updatedAt: string
}
