import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import styles from './Pagination.module.css'

interface PaginationProps {
  /** Página atual, começando em 0 (como a API). */
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav className={styles.pagination} aria-label="Paginação">
      <Button variant="outline" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={18} aria-hidden="true" /> Anterior
      </Button>
      <span aria-current="page">
        Página {page + 1} de {totalPages}
      </span>
      <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Próxima <ChevronRight size={18} aria-hidden="true" />
      </Button>
    </nav>
  )
}
