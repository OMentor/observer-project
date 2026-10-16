import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type Toast = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: { title: string; description?: string; tone?: ToastTone }) => void;
  dismiss: (id: number) => void;
};

const TTL = 5000;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: ({ title, description, tone = 'info' }) => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, title, description, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, TTL);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
