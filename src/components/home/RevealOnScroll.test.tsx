import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Mock hooks
const mockReduced = vi.fn().mockReturnValue(false);
const mockInView = vi.fn().mockReturnValue(true);

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

vi.mock('@/hooks/useInView', () => ({
  useInView: () => mockInView(),
}));

import RevealOnScroll from './RevealOnScroll';

describe('RevealOnScroll', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockReduced.mockReturnValue(false);
    mockInView.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children content', () => {
    render(
      <RevealOnScroll>
        <span>Hello</span>
      </RevealOnScroll>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('keeps content visible as the SSR-safe CSS default', () => {
    const css = readFileSync(
      path.join(process.cwd(), 'src/app/styles/animations.css'),
      'utf8',
    );
    expect(css).toMatch(/\.reveal-on-scroll\s*\{[\s\S]*?opacity:\s*1;/);
    expect(css).toMatch(
      /\.js\s+\.reveal-on-scroll:not\(\.is-visible\)\s*\{[\s\S]*?opacity:\s*0;/,
    );
  });

  it('renders as div by default', () => {
    const { container } = render(
      <RevealOnScroll>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.tagName).toBe('DIV');
  });

  it('renders as section when as prop is set', () => {
    const { container } = render(
      <RevealOnScroll as="section">
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.tagName).toBe('SECTION');
  });

  it('applies custom className', () => {
    const { container } = render(
      <RevealOnScroll className="extra-class">
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.className).toContain('extra-class');
  });

  it('adds is-visible class when inView is true (not reduced)', () => {
    mockInView.mockReturnValue(true);
    mockReduced.mockReturnValue(false);

    const { container } = render(
      <RevealOnScroll>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.className).toContain('is-visible');
  });

  it('does not add is-visible when inView is false', () => {
    mockInView.mockReturnValue(false);
    mockReduced.mockReturnValue(false);

    const { container } = render(
      <RevealOnScroll>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.className).not.toContain('is-visible');
  });

  it('adds is-visible when reduced motion is preferred', () => {
    mockInView.mockReturnValue(false);
    mockReduced.mockReturnValue(true);

    const { container } = render(
      <RevealOnScroll>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll');
    expect(el?.className).toContain('is-visible');
  });

  it('sets --reveal-delay CSS variable when delay > 0', () => {
    mockInView.mockReturnValue(true);
    mockReduced.mockReturnValue(false);

    const { container } = render(
      <RevealOnScroll delay={300}>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll') as HTMLElement;
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('300ms');
  });

  it('does not set --reveal-delay when delay is 0', () => {
    const { container } = render(
      <RevealOnScroll>
        <span>Hi</span>
      </RevealOnScroll>,
    );
    const el = container.querySelector('.reveal-on-scroll') as HTMLElement;
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('');
  });
});
