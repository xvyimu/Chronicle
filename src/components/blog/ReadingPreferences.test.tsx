import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ReadingPreferences from '@/components/blog/ReadingPreferences';

describe('ReadingPreferences', () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
    // Create the target element that the component will style
    const existing = document.getElementById('article-content');
    if (!existing) {
      const el = document.createElement('div');
      el.id = 'article-content';
      el.className = 'prose';
      document.body.appendChild(el);
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    const el = document.getElementById('article-content');
    if (el) el.remove();
  });

  it('renders font size and width control buttons', () => {
    render(<ReadingPreferences />);
    expect(screen.getByLabelText('标准字号')).toBeInTheDocument();
    expect(screen.getByLabelText('标准')).toBeInTheDocument();
  });

  it('cycles font size: md → lg → sm → md', async () => {
    render(<ReadingPreferences />);

    // Initial: md (标准字号)
    expect(screen.getByLabelText('标准字号')).toBeInTheDocument();

    // Click: md → lg
    fireEvent.click(screen.getByLabelText('标准字号'));
    await waitFor(() => {
      expect(screen.getByLabelText('大字号')).toBeInTheDocument();
    });

    // Click: lg → sm
    fireEvent.click(screen.getByLabelText('大字号'));
    await waitFor(() => {
      expect(screen.getByLabelText('小字号')).toBeInTheDocument();
    });

    // Click: sm → md
    fireEvent.click(screen.getByLabelText('小字号'));
    await waitFor(() => {
      expect(screen.getByLabelText('标准字号')).toBeInTheDocument();
    });
  });

  it('cycles width: normal → wide → narrow → normal', async () => {
    render(<ReadingPreferences />);

    // Initial: normal (标准)
    expect(screen.getByLabelText('标准')).toBeInTheDocument();

    // Click: normal → wide
    fireEvent.click(screen.getByLabelText('标准'));
    await waitFor(() => {
      expect(screen.getByLabelText('宽栏')).toBeInTheDocument();
    });

    // Click: wide → narrow
    fireEvent.click(screen.getByLabelText('宽栏'));
    await waitFor(() => {
      expect(screen.getByLabelText('窄栏')).toBeInTheDocument();
    });

    // Click: narrow → normal
    fireEvent.click(screen.getByLabelText('窄栏'));
    await waitFor(() => {
      expect(screen.getByLabelText('标准')).toBeInTheDocument();
    });
  });

  it('persists font size to localStorage', async () => {
    render(<ReadingPreferences />);

    fireEvent.click(screen.getByLabelText('标准字号'));
    await waitFor(() => {
      expect(localStorage.getItem('reading-font-size')).toBe('lg');
    });
  });

  it('persists width to localStorage', async () => {
    render(<ReadingPreferences />);

    fireEvent.click(screen.getByLabelText('标准'));
    await waitFor(() => {
      expect(localStorage.getItem('reading-width')).toBe('wide');
    });
  });

  it('restores preferences from localStorage on mount', async () => {
    localStorage.setItem('reading-font-size', 'lg');
    localStorage.setItem('reading-width', 'narrow');

    render(<ReadingPreferences />);

    await waitFor(() => {
      expect(screen.getByLabelText('大字号')).toBeInTheDocument();
      expect(screen.getByLabelText('窄栏')).toBeInTheDocument();
    });
  });

  it('applies CSS custom properties to target element', async () => {
    render(<ReadingPreferences />);

    // Click to change font size to lg
    fireEvent.click(screen.getByLabelText('标准字号'));
    await waitFor(() => {
      const el = document.getElementById('article-content');
      expect(el?.style.getPropertyValue('--reading-font-size')).toBe('1.12rem');
    });
  });

  it('ignores invalid localStorage values', async () => {
    localStorage.setItem('reading-font-size', 'invalid');
    localStorage.setItem('reading-width', 'also-invalid');

    render(<ReadingPreferences />);

    // Should fall back to defaults
    await waitFor(() => {
      expect(screen.getByLabelText('标准字号')).toBeInTheDocument();
      expect(screen.getByLabelText('标准')).toBeInTheDocument();
    });
  });
});
