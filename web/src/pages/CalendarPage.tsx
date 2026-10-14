export function CalendarPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl text-text">Сводный календарь</h1>
        <p className="mt-1 text-sm text-muted">
          Все события из пространств и источников в одном окне.
        </p>
      </div>
      <div className="flex h-[60vh] items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 text-sm text-muted">
        Здесь будет FullCalendar (этап 3)
      </div>
    </section>
  );
}
