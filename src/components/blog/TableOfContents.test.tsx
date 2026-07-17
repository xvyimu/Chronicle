import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const mockPrefersReducedMotion = vi.fn(() => false);

vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockPrefersReducedMotion(),
}));
import TableOfContents from './TableOfContents';

describe('TableOfContents', () => {
  /** Clean up any manually-appended DOM nodes from tests */
  function removeArticles() {
    document.querySelectorAll('#article-content, article').forEach((el) => el.remove());
  }

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    removeArticles();
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeArticles();
  });

  it('returns null when no article content exists', () => {
    const { container } = render(<TableOfContents />);
    expect(container.innerHTML).toBe('');
  });

  it('reads headings from #article-content and renders links', () => {
    const article = document.createElement('div');
    article.id = 'article-content';
    article.innerHTML = `
      <h2 id="intro">介绍</h2>
      <p>一些文本</p>
      <h2 id="usage">用法</h2>
      <h3 id="basic">基本用法</h3>
      <h2 id="api">API</h2>
    `;
    document.body.appendChild(article);

    render(<TableOfContents />);

    // Use getAllByText to cover both source heading and rendered link
    expect(screen.getAllByText('介绍')).toHaveLength(2);
    expect(screen.getAllByText('用法')).toHaveLength(2);
    expect(screen.getAllByText('基本用法')).toHaveLength(2);
    expect(screen.getAllByText('API')).toHaveLength(2);

    // Verify actual links rendered
    expect(screen.getByRole('link', { name: '介绍' })).toHaveAttribute('href', '#intro');
    expect(screen.getByRole('link', { name: '用法' })).toHaveAttribute('href', '#usage');
    expect(screen.getByRole('link', { name: '基本用法' })).toHaveAttribute(
      'href',
      '#basic',
    );
    expect(screen.getByRole('link', { name: 'API' })).toHaveAttribute('href', '#api');
  });

  it('reads headings from article tag when #article-content absent', () => {
    const article = document.createElement('article');
    article.innerHTML = `
      <h2 id="sec1">Section 1</h2>
      <h3 id="sec1a">Section 1a</h3>
    `;
    document.body.appendChild(article);

    render(<TableOfContents />);

    expect(screen.getAllByText('Section 1')).toHaveLength(2);
    expect(screen.getAllByText('Section 1a')).toHaveLength(2);
  });

  it('sets up IntersectionObserver for headings', () => {
    // Use a proper class constructor for IntersectionObserver mock
    const mockObserve = vi.fn();
    const mockDisconnect = vi.fn();
    class MockObserver implements IntersectionObserver {
      readonly root: Element | null = null;
      readonly rootMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [];
      observe = mockObserve;
      unobserve = vi.fn();
      disconnect = mockDisconnect;
      takeRecords = vi.fn(() => []);
    }
    window.IntersectionObserver = MockObserver;

    const article = document.createElement('article');
    article.innerHTML = '<h2 id="intro">Intro</h2><h2 id="end">End</h2>';
    document.body.appendChild(article);

    render(<TableOfContents />);

    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('creates links with href pointing to heading ids', () => {
    const article = document.createElement('article');
    article.innerHTML = '<h2 id="getting-started">Getting Started</h2>';
    document.body.appendChild(article);

    render(<TableOfContents />);

    const link = screen.getByRole('link', { name: 'Getting Started' });
    expect(link).toHaveAttribute('href', '#getting-started');
  });

  it.each([
    { reduced: false, behavior: 'smooth' as const },
    { reduced: true, behavior: 'auto' as const },
  ])(
    'uses $behavior scrolling when reduced motion is $reduced',
    ({ reduced, behavior }) => {
      mockPrefersReducedMotion.mockReturnValue(reduced);
      const article = document.createElement('article');
      article.innerHTML = '<h2 id="motion">Motion</h2>';
      document.body.appendChild(article);
      const heading = article.querySelector('#motion') as HTMLElement;
      heading.scrollIntoView = vi.fn();

      render(<TableOfContents />);
      fireEvent.click(screen.getByRole('link', { name: 'Motion' }));

      expect(heading.scrollIntoView).toHaveBeenCalledWith({ behavior });
    },
  );

  it('indents h3 items more than h2 items', () => {
    const article = document.createElement('article');
    article.innerHTML = `
      <h2 id="a">Heading A</h2>
      <h3 id="b">Heading B</h3>
    `;
    document.body.appendChild(article);

    render(<TableOfContents />);

    const links = document.querySelectorAll('nav a');
    expect(links[0].className).toContain('pl-3');
    expect(links[1].className).toContain('pl-5');
  });

  it('renders a collapsible mobile table of contents', () => {
    const article = document.createElement('article');
    article.innerHTML = '<h2 id="intro">Intro</h2><h2 id="next">Next</h2>';
    document.body.appendChild(article);

    render(<TableOfContents variant="mobile" />);

    expect(screen.getByText('本文目录')).toBeInTheDocument();
    expect(screen.getByText('2 节')).toBeInTheDocument();
    expect(screen.getByLabelText('移动文章目录')).toBeInTheDocument();
  });
});
