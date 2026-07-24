import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import Footer from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    cleanup();
    // Pin year so copyright assertion does not drift at year boundary.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30'));
  });

  afterEach(() => {
    // Always restore — fake timers must not leak into later files.
    vi.useRealTimers();
    cleanup();
  });

  it('renders site name', () => {
    render(<Footer />);
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('renders current year in copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('renders GitHub social link', () => {
    render(<Footer />);
    const ghLink = screen.getByLabelText('GitHub');
    expect(ghLink).toHaveAttribute('href', 'https://github.com/xvyimu');
    expect(ghLink).toHaveAttribute('target', '_blank');
    expect(ghLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
