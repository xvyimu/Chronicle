import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import DarkModeScript from './DarkModeScript';

describe('DarkModeScript', () => {
  it('stays a server component because it only renders static script markup', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/ui/DarkModeScript.tsx'),
      'utf8',
    );
    expect(source.startsWith("'use client'")).toBe(false);
  });

  it('renders a script element with inline content', () => {
    render(<DarkModeScript />);
    const script = document.querySelector('script');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('localStorage.getItem');
    expect(script?.innerHTML).toContain('matchMedia');
  });

  it('contains dark mode FOUC prevention logic', () => {
    render(<DarkModeScript />);
    const script = document.querySelector('script');
    expect(script?.innerHTML).toContain('dark');
    expect(script?.innerHTML).toContain('document.documentElement.classList');
  });

  it('is wrapped in try-catch', () => {
    render(<DarkModeScript />);
    const script = document.querySelector('script');
    expect(script?.innerHTML).toContain('try');
    expect(script?.innerHTML).toContain('catch');
  });

  it('applies the CSP nonce when provided', () => {
    render(<DarkModeScript nonce="test-nonce" />);
    const script = document.querySelector('script');
    expect(script?.nonce).toBe('test-nonce');
  });
});
