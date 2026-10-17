import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DensityDots } from '@/features/calendar/views/quarter/DensityDots';

describe('DensityDots', () => {
  it('renders nothing for an empty day', () => {
    const { container } = render(<DensityDots colors={[]} count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one circle per event up to the maximum', () => {
    const { container } = render(
      <DensityDots colors={['#f00', '#0f0', '#00f']} count={3} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByRole('img')).toHaveAccessibleName('События: 3');
  });

  it('collapses overflow into a +N label', () => {
    const { container } = render(
      <DensityDots colors={['#f00', '#0f0', '#00f', '#ff0', '#0ff']} count={5} />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName('События: 5');
  });
});
