export interface NavItem {
  label: string
  to: string
}

/** Links da navegação principal. */
export const MAIN_NAV: NavItem[] = [
  { label: 'Como funciona', to: '/#como-funciona' },
  { label: 'Produtos', to: '/#produtos' },
  { label: 'Planos', to: '/#planos' },
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Dúvidas', to: '/#faq' },
  { label: 'Contato', to: '/#contato' },
]
