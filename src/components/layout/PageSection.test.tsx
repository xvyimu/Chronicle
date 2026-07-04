import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageSection from './PageSection';

describe('PageSection', () => {
  it('renders the shared section shell', () => {
    render(
      <PageSection eyebrow="Blog" title="博客" subtitle="共 14 篇">
        <p>content</p>
      </PageSection>,
    );

    expect(screen.getByText('Blog')).toHaveClass('section__eyebrow');
    expect(screen.getByRole('heading', { name: '博客' })).toHaveClass('section__title');
    expect(screen.getByText('共 14 篇')).toHaveClass('section__subtitle');
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('supports compact headers, custom heading tags, and actions', () => {
    render(
      <PageSection
        compactHeader
        title="专题"
        titleAs="h1"
        titleId="series-title"
        action={<button type="button">查看全部</button>}
      >
        <p>list</p>
      </PageSection>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '专题' })).toHaveAttribute(
      'id',
      'series-title',
    );
    expect(screen.getByText('查看全部').parentElement).toHaveClass('section__action');
    expect(document.querySelector('.section__head')).toHaveClass(
      'section__head--compact',
    );
  });
});
