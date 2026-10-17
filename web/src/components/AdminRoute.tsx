import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function AdminRoute({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);

  if (role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
