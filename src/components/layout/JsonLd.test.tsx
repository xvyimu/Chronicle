import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JsonLd from './JsonLd';

describe('JsonLd', () => {
  it('renders a JSON-LD script with the given payload', () => {
    const { container } = render(<JsonLd data='{"@type":"Organization"}' />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toBe('{"@type":"Organization"}');
  });

  it('applies the CSP nonce when provided', () => {
    const { container } = render(<JsonLd data="{}" nonce="test-nonce" />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.getAttribute('nonce')).toBe('test-nonce');
  });

  it('omits the nonce attribute when not provided', () => {
    const { container } = render(<JsonLd data="{}" />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.hasAttribute('nonce')).toBe(false);
  });

  it('does not escape the payload itself (escaping is toJsonLd’s job)', () => {
    // 组件只负责标签；`<` 转义由 lib/jsonld.ts 的 toJsonLd 完成。
    const escaped = '{"x":"\\u003c/script>"}';
    const { container } = render(<JsonLd data={escaped} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script?.innerHTML).toBe(escaped);
  });
});
