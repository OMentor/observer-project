import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const navigate = useNavigate();
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-3xl text-text">{title}</h1>
      <p className="text-sm text-muted">{description}</p>
      <div className="rounded-xl border border-dashed border-border bg-surface/40 p-10 text-center text-sm text-muted">
        Раздел появится на следующем этапе.
      </div>
      <Button variant="outline" onClick={() => navigate('/')}>
        Назад к пространствам
      </Button>
    </section>
  );
}
