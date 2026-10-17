import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '@/components/ui/logo';
import { LOGO_STRANDS } from '@/components/ui/logo-strands';

describe('Logo', () => {
  it('renders the woven lattice as an image with a name', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'Плетение' })).toBeInTheDocument();
  });

  it('draws each strand with a normalized pathLength for the weave animation', () => {
    const { container } = render(<Logo />);
    const strands = container.querySelectorAll('path.logo-strand');
    expect(strands).toHaveLength(LOGO_STRANDS.length);
    strands.forEach((strand) => {
      expect(strand).toHaveAttribute('pathLength', '100');
      expect(strand.getAttribute('d')).toBeTruthy();
    });
  });

  it('enables the weave animation only when animated', () => {
    const { container: plain } = render(<Logo />);
    expect(plain.querySelector('svg')?.getAttribute('class') ?? '').not.toContain(
      'animate-weave',
    );

    const { container: animated } = render(<Logo animated />);
    expect(
      animated.querySelector('svg')?.getAttribute('class') ?? '',
    ).toContain('animate-weave');
  });
});
