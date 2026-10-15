import type { RouteObject } from 'react-router'
import { RootLayout } from './components/layout/RootLayout'
import { CheckoutDemoPage } from './features/plans/CheckoutDemoPage'
import { LandingPage } from './features/landing/LandingPage'
import { NotFoundPage } from './features/misc/NotFoundPage'
import { QuizPage } from './features/quiz/QuizPage'

/** Rotas da aplicação. Exportadas separadamente para serem reutilizadas nos testes. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'assinar/:planSlug', element: <CheckoutDemoPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
