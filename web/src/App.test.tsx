import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';

describe('AppLayout', () => {
  it('renders brand, navigation and content', () => {
    render(
      <MemoryRouter>
        <AppLayout>
          <div>Тестовый контент</div>
        </AppLayout>
      </MemoryRouter>,
    );

    expect(screen.getByText('Плетение')).toBeInTheDocument();
    expect(screen.getByText('Пространства')).toBeInTheDocument();
    expect(screen.getByText('Календарь')).toBeInTheDocument();
    expect(screen.getByText('Тестовый контент')).toBeInTheDocument();
  });
});
