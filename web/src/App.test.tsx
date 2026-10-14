import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { CalendarPage } from '@/pages/CalendarPage';

describe('AppLayout', () => {
  it('renders brand, navigation and content', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <CalendarPage />
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Плетение')).toBeInTheDocument();
    expect(screen.getByText('Токены')).toBeInTheDocument();
    expect(screen.getByText('Сводный календарь')).toBeInTheDocument();
  });
});
