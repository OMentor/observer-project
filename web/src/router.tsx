import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { CalendarPage } from '@/pages/CalendarPage';
import { ConflictsPage } from '@/pages/ConflictsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SpacesPage } from '@/pages/SpacesPage';
import { SpacePage } from '@/pages/SpacePage';
import { TokensPage } from '@/pages/TokensPage';
import { MembersPage } from '@/pages/MembersPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ActivatePage } from '@/pages/ActivatePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
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
      { path: 'sync/conflicts', element: <ConflictsPage /> },
      { path: 'tokens', element: <TokensPage /> },
      { path: 'members', element: <MembersPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'activate/:token', element: <ActivatePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'analytics',
        element: (
          <AdminRoute>
            <AnalyticsPage />
          </AdminRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
