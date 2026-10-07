import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JsonLd from './JsonLd';

describe('JsonLd', () => {
  it('renders a JSON-LD script with the given payload', () => {
    render(<JsonLd data='{"@type":"Organization"}' />);
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toBe('{"@type":"Organization"}');
  });

  it('applies the CSP nonce when provided', () => {
    render(<JsonLd data="{}" nonce="test-nonce" />);
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(script?.getAttribute('nonce')).toBe('test-nonce');
  });

  it('omits the nonce attribute when not provided', () => {
    render(<JsonLd data="{}" />);
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(script?.hasAttribute('nonce')).toBe(false);
  });

  it('does not escape the payload itself (escaping is toJsonLd’s job)', () => {
    // 组件只负责标签；`<` 转义由 lib/jsonld.ts 的 toJsonLd 完成。
    const escaped = '{"x":"\\u003c/script>"}';
    render(<JsonLd data={escaped} />);
    const script = document.querySelector('script[type="application/ld+json"]');

    expect(script?.innerHTML).toBe(escaped);
  });
});
