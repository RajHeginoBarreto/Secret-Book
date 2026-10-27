import type { RouteObject } from 'react-router'
import { RootLayout } from './components/layout/RootLayout'
import { AccountLayout } from './features/account/AccountLayout'
import { AccountOverviewPage } from './features/account/AccountOverviewPage'
import { FeedbackPage } from './features/account/FeedbackPage'
import { HistoryPage } from './features/account/HistoryPage'
import { LibraryPage } from './features/account/LibraryPage'
import { ProfilePage } from './features/account/ProfilePage'
import { ReaderProfilePage } from './features/account/ReaderProfilePage'
import { AdminAuthorsPage } from './features/admin/AdminAuthorsPage'
import { AdminBookFormPage } from './features/admin/AdminBookFormPage'
import { AdminBooksPage } from './features/admin/AdminBooksPage'
import { AdminDashboardPage } from './features/admin/AdminDashboardPage'
import { AdminFeedbackPage } from './features/admin/AdminFeedbackPage'
import { AdminGenresPage } from './features/admin/AdminGenresPage'
import { AdminLayout } from './features/admin/AdminLayout'
import { AdminRecommendationPage } from './features/admin/AdminRecommendationPage'
import { AdminSubscriptionsPage } from './features/admin/AdminSubscriptionsPage'
import { AdminUsersPage } from './features/admin/AdminUsersPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { AuthorPage } from './features/catalog/AuthorPage'
import { BookPage } from './features/catalog/BookPage'
import { CatalogPage } from './features/catalog/CatalogPage'
import { LandingPage } from './features/landing/LandingPage'
import { NotFoundPage } from './features/misc/NotFoundPage'
import { PrivacyPage } from './features/misc/PrivacyPage'
import { CheckoutDemoPage } from './features/plans/CheckoutDemoPage'
import { QuizPage } from './features/quiz/QuizPage'
import { QuizResultPage } from './features/quiz/QuizResultPage'

/** Rotas da aplicação. Exportadas separadamente para serem reutilizadas nos testes. */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'catalogo', element: <CatalogPage /> },
      { path: 'livros/:slug', element: <BookPage /> },
      { path: 'autores/:slug', element: <AuthorPage /> },
      { path: 'quiz', element: <QuizPage /> },
      { path: 'quiz/resultado/:id', element: <QuizResultPage /> },
      { path: 'assinar/:planSlug', element: <CheckoutDemoPage /> },
      { path: 'entrar', element: <LoginPage /> },
      { path: 'cadastro', element: <RegisterPage /> },
      { path: 'esqueci-senha', element: <ForgotPasswordPage /> },
      { path: 'redefinir-senha', element: <ResetPasswordPage /> },
      { path: 'privacidade', element: <PrivacyPage /> },
      {
        path: 'minha-conta',
        element: (
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AccountOverviewPage /> },
          { path: 'leitor', element: <ReaderProfilePage /> },
          { path: 'biblioteca', element: <LibraryPage /> },
          { path: 'historico', element: <HistoryPage /> },
          { path: 'avaliacoes', element: <FeedbackPage /> },
          { path: 'perfil', element: <ProfilePage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <RequireAuth role="ADMIN">
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'livros', element: <AdminBooksPage /> },
          { path: 'livros/novo', element: <AdminBookFormPage /> },
          { path: 'livros/:id', element: <AdminBookFormPage /> },
          { path: 'autores', element: <AdminAuthorsPage /> },
          { path: 'generos', element: <AdminGenresPage /> },
          { path: 'usuarios', element: <AdminUsersPage /> },
          { path: 'avaliacoes', element: <AdminFeedbackPage /> },
          { path: 'assinaturas', element: <AdminSubscriptionsPage /> },
          { path: 'recomendacao', element: <AdminRecommendationPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
