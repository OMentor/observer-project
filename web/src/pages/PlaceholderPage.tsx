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
      <h1 className="font-serif text-h1 text-text-primary">{title}</h1>
      <p className="text-body-sm text-text-secondary">{description}</p>
      <div className="rounded-lg border border-dashed border-border bg-bg-surface/40 p-10 text-center text-body-sm text-text-secondary">
        Раздел появится на следующем этапе.
      </div>
      <Button variant="outline" onClick={() => navigate('/')}>
        Назад к пространствам
      </Button>
    </section>
  );
}
