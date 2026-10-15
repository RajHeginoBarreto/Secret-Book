export interface NavItem {
  label: string
  to: string
}

/** Links da navegação principal. */
export const MAIN_NAV: NavItem[] = [
  { label: 'Como funciona', to: '/#como-funciona' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Planos', to: '/#planos' },
  { label: 'Dúvidas', to: '/#faq' },
  { label: 'Contato', to: '/#contato' },
]
