import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '../router'

/** Renderiza a aplicação real (mesmas rotas) a partir de um caminho, em memória. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  const view = render(<RouterProvider router={router} />)
  return { ...view, router, user }
}
