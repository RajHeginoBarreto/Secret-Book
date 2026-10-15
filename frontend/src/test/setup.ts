import '@testing-library/jest-dom/vitest'
import '../styles/global.css'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockApi } from './mockApi'

beforeEach(() => {
  // jsdom não implementa rolagem; o ScrollRestoration do React Router a utiliza.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
  // Nenhum teste fala com um servidor de verdade: sem mock, toda chamada à API responde 404.
  mockApi({})
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.unstubAllGlobals()
})
