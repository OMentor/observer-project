import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CalendarPage } from '@/pages/CalendarPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SpacesPage } from '@/pages/SpacesPage';
import { SpacePage } from '@/pages/SpacePage';
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
      {
        path: 'tokens',
        element: (
          <PlaceholderPage
            title="Токены"
            description="Генерация токенов доступа и пресеты появятся на этапе 2."
          />
        ),
      },
      {
        path: 'members',
        element: (
          <PlaceholderPage
            title="Участники"
            description="Управление участниками пространства появится на этапе 2."
          />
        ),
      },
      {
        path: 'history',
        element: (
          <PlaceholderPage
            title="История"
            description="Журнал изменений появится на этапе 2."
          />
        ),
      },
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
