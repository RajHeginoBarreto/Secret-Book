import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { apiRequest, queryString, toApiError, type Page } from '../../api/client'
import { Button } from '../../components/ui/Button'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingState, Notice } from '../../components/ui/StatusMessage'
import { useApi } from '../../hooks/useApi'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../account/accountTypes'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../auth/authTypes'
import type { AdminUser } from './adminTypes'
import styles from './Admin.module.css'

export function AdminUsersPage() {
  usePageTitle('Usuários — painel')
  const { user: me } = useAuth()
  const [params, setParams] = useSearchParams()
  const query = params.get('busca') ?? ''
  const page = Math.max(0, Number.parseInt(params.get('pagina') ?? '1', 10) - 1 || 0)
  const users = useApi<Page<AdminUser>>(`/api/admin/users${queryString({ q: query, page, size: 20 })}`)
  const [error, setError] = useState<string | null>(null)

  const update = async (target: AdminUser, change: { role?: Role; enabled?: boolean }) => {
    if (change.enabled === false && !window.confirm(`Desativar ${target.username}? As sessões abertas serão encerradas.`)) return
    setError(null)
    try {
      const saved = await apiRequest<AdminUser>(`/api/admin/users/${target.id}`, { method: 'PATCH', body: change })
      if (users.data) {
        users.setData({ ...users.data, content: users.data.content.map((item) => (item.id === saved.id ? saved : item)) })
      }
    } catch (caught) {
      setError(toApiError(caught).message)
    }
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get('busca') ?? '').trim()
    setParams(text ? { busca: text } : {})
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuários</h1>
          <p className={styles.subtitle}>Mudanças de papel e de acesso valem na hora, inclusive para sessões abertas.</p>
        </div>
      </header>

      <form className={styles.toolbar} role="search" onSubmit={handleSearch}>
        <label htmlFor="busca-usuarios" className="visually-hidden">
          Buscar por nome de usuário ou e-mail
        </label>
        <input
          key={query}
          id="busca-usuarios"
          name="busca"
          type="search"
          defaultValue={query}
          placeholder="Buscar por nome de usuário ou e-mail"
          className={styles.search}
        />
        <Button type="submit" variant="outline">
          <Search size={16} aria-hidden="true" /> Buscar
        </Button>
      </form>

      {error && <Notice tone="danger">{error}</Notice>}
      {users.error && <ErrorState error={users.error} onRetry={users.reload} />}
      {users.loading && !users.data && <LoadingState />}
      {users.data &&
        (users.data.content.length === 0 ? (
          <EmptyState title="Nenhum usuário encontrado" />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Usuário</th>
                    <th scope="col">Desde</th>
                    <th scope="col">Papel</th>
                    <th scope="col">Acesso</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.content.map((user) => {
                    const isMe = user.id === me?.id
                    return (
                      <tr key={user.id}>
                        <td>
                          {user.name}
                          {isMe && <div className={styles.muted}>(você)</div>}
                        </td>
                        <td>{user.username}{user.email && <div className={styles.muted}>{user.email}</div>}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <label className="visually-hidden" htmlFor={`papel-${user.id}`}>
                            Papel de {user.username}
                          </label>
                          <select
                            id={`papel-${user.id}`}
                            value={user.role}
                            disabled={isMe}
                            onChange={(event) => update(user, { role: event.target.value as Role })}
                          >
                            <option value="READER">Leitor</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                        </td>
                        <td>
                          <span className={`${styles.status} ${user.enabled ? styles.on : styles.off}`}>
                            {user.enabled ? 'Ativo' : 'Desativado'}
                          </span>{' '}
                          {!isMe && (
                            <Button variant="ghost" onClick={() => update(user, { enabled: !user.enabled })}>
                              {user.enabled ? 'Desativar' : 'Reativar'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={users.data.page}
              totalPages={users.data.totalPages}
              onChange={(next) => {
                const nextParams = new URLSearchParams(params)
                if (next > 0) nextParams.set('pagina', String(next + 1))
                else nextParams.delete('pagina')
                setParams(nextParams)
              }}
            />
          </>
        ))}
    </>
  )
}
