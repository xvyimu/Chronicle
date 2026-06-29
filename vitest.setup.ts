import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom does not implement scrollIntoView — mock it for component tests
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not implement matchMedia — mock it for IntersectionObserver tests
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  });
}

// jsdom does not implement IntersectionObserver — mock it for RevealOnScroll tests
if (!window.IntersectionObserver) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: IntersectionObserver['root'] = null;
    readonly rootMargin: IntersectionObserver['rootMargin'] = '0px';
    readonly thresholds: IntersectionObserver['thresholds'] = [];
    observe = vi.fn<IntersectionObserver['observe']>();
    unobserve = vi.fn<IntersectionObserver['unobserve']>();
    disconnect = vi.fn<IntersectionObserver['disconnect']>();
    takeRecords = vi.fn<IntersectionObserver['takeRecords']>(() => []);
  }
  window.IntersectionObserver = MockIntersectionObserver;
}
