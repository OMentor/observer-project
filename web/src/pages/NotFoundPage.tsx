import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-serif text-4xl text-text">404</h1>
      <p className="text-sm text-muted">Такой страницы нет.</p>
      <Link to="/" className="text-sm text-accent hover:underline">
        Вернуться к календарю
      </Link>
    </div>
  );
}
