import { useEffect, useRef } from 'react'

/**
 * Faz os elementos com o atributo `data-reveal` dentro do container aparecerem ao entrar na tela.
 * Sem IntersectionObserver (navegadores antigos, testes), tudo fica visível desde o início.
 * Um `data-reveal-delay="120"` atrasa a entrada (em ms), para efeitos em cascata.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const target = entry.target as HTMLElement
          target.dataset.reveal = 'shown'
          observer.unobserve(target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    for (const target of targets) {
      if (target.dataset.reveal === 'shown') continue
      const delay = target.dataset.revealDelay
      if (delay) target.style.setProperty('--reveal-delay', `${delay}ms`)
      target.dataset.reveal = 'hidden'
      observer.observe(target)
    }
    return () => observer.disconnect()
  }, [])

  return ref
}
