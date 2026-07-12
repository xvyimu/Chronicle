import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkSearchRateLimit,
  resetSearchRateLimitForTests,
  SEARCH_RATE_LIMIT_MAX,
  clientKeyFromRequest,
} from './rate-limit';

describe('checkSearchRateLimit', () => {
  beforeEach(() => {
    resetSearchRateLimitForTests();
  });

  it('allows up to max requests then blocks', () => {
    const key = '10.0.0.1';
    for (let i = 0; i < SEARCH_RATE_LIMIT_MAX; i++) {
      expect(checkSearchRateLimit(key).ok).toBe(true);
    }
    const blocked = checkSearchRateLimit(key);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('tracks keys independently', () => {
    for (let i = 0; i < SEARCH_RATE_LIMIT_MAX; i++) {
      checkSearchRateLimit('a');
    }
    expect(checkSearchRateLimit('a').ok).toBe(false);
    expect(checkSearchRateLimit('b').ok).toBe(true);
  });
});

describe('clientKeyFromRequest', () => {
  it('prefers first x-forwarded-for hop', () => {
    const req = new Request('http://localhost/api/search', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(clientKeyFromRequest(req)).toBe('1.2.3.4');
  });

  it('falls back to anonymous', () => {
    expect(clientKeyFromRequest(new Request('http://localhost/api/search'))).toBe(
      'anonymous',
    );
  });
});
