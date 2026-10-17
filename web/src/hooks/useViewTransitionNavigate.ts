import { useNavigate, type NavigateOptions, type To } from 'react-router-dom';

export function useViewTransitionNavigate() {
  const navigate = useNavigate();
  return (to: To, options?: NavigateOptions) => {
    const hasTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof document.startViewTransition === 'function';

    if (
      hasTransition &&
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.startViewTransition(() => navigate(to, options));
      return;
    }
    navigate(to, options);
  };
}
