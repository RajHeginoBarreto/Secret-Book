import { useEffect } from 'react'
import { SITE } from '../config/site'

/** Define o <title> da aba, útil para histórico, favoritos e leitores de tela. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} — encontro às cegas com um livro`
  }, [title])
}
