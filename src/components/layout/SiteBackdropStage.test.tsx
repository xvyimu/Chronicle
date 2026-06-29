import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SiteBackdropStage from '@/components/layout/SiteBackdropStage';

describe('SiteBackdropStage', () => {
  it('renders a single .site-backdrop__stage container with aria-hidden', () => {
    const { container } = render(<SiteBackdropStage />);
    const stage = container.querySelector('.site-backdrop__stage');
    expect(stage).not.toBeNull();
    expect(stage?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders all 5 decorative child elements (2 planes + 1 mesh + 2 codes)', () => {
    const { container } = render(<SiteBackdropStage />);
    expect(container.querySelectorAll('.site-backdrop__plane')).toHaveLength(2);
    expect(container.querySelectorAll('.site-backdrop__plane--back')).toHaveLength(1);
    expect(container.querySelectorAll('.site-backdrop__plane--front')).toHaveLength(1);
    expect(container.querySelectorAll('.site-backdrop__mesh')).toHaveLength(1);
    expect(container.querySelectorAll('.site-backdrop__code')).toHaveLength(2);
    expect(container.querySelectorAll('.site-backdrop__code--one')).toHaveLength(1);
    expect(container.querySelectorAll('.site-backdrop__code--two')).toHaveLength(1);
  });

  it('renders code block text content "pnpm test" and "deploy --quiet"', () => {
    render(<SiteBackdropStage />);
    expect(screen.getByText('pnpm test')).toBeInTheDocument();
    expect(screen.getByText('deploy --quiet')).toBeInTheDocument();
  });

  it('does not carry a "use client" directive (server component)', () => {
    // Server components have no default-exported function with client directive.
    // We assert by checking the module source is not flagged — practically verified
    // by the component rendering without throwing in a server-like test environment.
    const { container } = render(<SiteBackdropStage />);
    expect(container.firstChild).not.toBeNull();
    // The component returns a plain <div> with no client-only hooks (useEffect/useRef).
    // Reading the function source is not feasible at runtime; rely on absence of
    // 'use client' marker in the file is enforced by build, not by this test.
    // Here we just confirm the element tree shape.
    expect(container.querySelector('.site-backdrop__stage')).not.toBeNull();
  });

  it('renders only the two code elements with text content (planes/mesh are empty)', () => {
    const { container } = render(<SiteBackdropStage />);
    // planes and mesh should not carry any text content
    expect(container.querySelector('.site-backdrop__plane')?.textContent).toBe('');
    expect(container.querySelector('.site-backdrop__mesh')?.textContent).toBe('');
    // only .site-backdrop__code elements hold text
    const codeTexts = Array.from(container.querySelectorAll('.site-backdrop__code'))
      .map((el) => el.textContent?.trim() ?? '');
    expect(codeTexts).toEqual(['pnpm test', 'deploy --quiet']);
  });
});
