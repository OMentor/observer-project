import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CalendarPage } from '@/pages/CalendarPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SpacesPage } from '@/pages/SpacesPage';
import { SpacePage } from '@/pages/SpacePage';
import { TokensPage } from '@/pages/TokensPage';
import { MembersPage } from '@/pages/MembersPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ActivatePage } from '@/pages/ActivatePage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SpacesPage /> },
      { path: 'spaces/:id', element: <SpacePage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'tokens', element: <TokensPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'activate/:token', element: <ActivatePage /> },
      {
        path: 'settings',
        element: (
          <PlaceholderPage
            title="Настройки"
            description="Настройки пространств появятся на этапе 3."
          />
        ),
      },
      {
        path: 'profile',
        element: (
          <PlaceholderPage
            title="Профиль"
            description="Настройки профиля и подключения появятся позже."
          />
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
