import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-serif text-display text-text-primary">404</h1>
      <p className="text-body-sm text-text-secondary">Такой страницы нет.</p>
      <Link to="/" className="text-body-sm text-accent hover:underline">
        Вернуться к календарю
      </Link>
    </div>
  );
}
