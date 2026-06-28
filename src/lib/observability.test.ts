import { describe, expect, it } from 'vitest';
import { shouldRenderVercelInsights } from '@/lib/observability';

describe('shouldRenderVercelInsights', () => {
  it('renders Vercel observability scripts on Vercel deployments', () => {
    expect(shouldRenderVercelInsights({ VERCEL: '1' })).toBe(true);
  });

  it('skips Vercel observability scripts outside Vercel deployments', () => {
    expect(shouldRenderVercelInsights({})).toBe(false);
    expect(shouldRenderVercelInsights({ VERCEL: '0' })).toBe(false);
  });
});
