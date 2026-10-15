import '@testing-library/jest-dom/vitest'
import '../styles/global.css'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

beforeEach(() => {
  // jsdom não implementa rolagem; o ScrollRestoration do React Router a utiliza.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
