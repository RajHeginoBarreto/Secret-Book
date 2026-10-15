export interface NavItem {
  label: string
  to: string
}

/** Links da navegação principal (âncoras da landing page). */
export const MAIN_NAV: NavItem[] = [
  { label: 'Como funciona', to: '/#como-funciona' },
  { label: 'Pistas', to: '/#pistas' },
  { label: 'Planos', to: '/#planos' },
  { label: 'Dúvidas', to: '/#faq' },
  { label: 'Contato', to: '/#contato' },
]
