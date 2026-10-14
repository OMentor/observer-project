import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  email: string;
  name?: string;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      clear: () => set({ accessToken: null, user: null }),
    }),
    { name: 'pletenie.auth' },
  ),
);
