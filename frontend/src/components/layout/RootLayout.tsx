import { Outlet, ScrollRestoration } from 'react-router'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { WhatsAppButton } from './WhatsAppButton'
import styles from './RootLayout.module.css'

export function RootLayout() {
  return (
    <>
      <a href="#conteudo" className={styles.skipLink}>
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
      <WhatsAppButton />
      {/* Restaura a rolagem entre páginas e rola até a âncora (#planos etc.). */}
      <ScrollRestoration />
    </>
  )
}
