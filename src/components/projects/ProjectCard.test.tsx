import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Project } from '@/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const {
      fill,
      priority: _priority,
      blurDataURL: _blurDataURL,
      placeholder: _placeholder,
      alt = '',
      ...rest
    } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...(rest as Record<string, string>)}
        alt={String(alt)}
        data-fill={fill ? 'true' : undefined}
      />
    );
  },
}));

import ProjectCard from './ProjectCard';

const baseProject: Project = {
  id: 'test-project',
  title: 'Test Project',
  description: 'A test project description',
  tags: ['React', 'TypeScript', 'Node'],
  url: 'https://example.com',
  github: 'https://github.com/test/test',
  image: '/images/test.jpg',
  featured: true,
  year: 2026,
};

describe('ProjectCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders project title and description', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('renders project image when provided', () => {
    render(<ProjectCard project={baseProject} />);
    const img = screen.getByAltText('Test Project');
    expect(img).toHaveAttribute('src', '/images/test.jpg');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  it('renders initial letter placeholder when no image', () => {
    const noImg = { ...baseProject, image: undefined };
    render(<ProjectCard project={noImg} />);
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<ProjectCard project={baseProject} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node')).toBeInTheDocument();
  });

  it('renders project link to /projects/:id', () => {
    render(<ProjectCard project={baseProject} />);
    const titleLink = screen.getByText('Test Project').closest('a');
    expect(titleLink).toHaveAttribute('href', '/projects/test-project');
  });

  it('renders external url link when provided', () => {
    render(<ProjectCard project={baseProject} />);
    const externalLink = screen.getByText('线上 →');
    expect(externalLink).toHaveAttribute('href', 'https://example.com');
    expect(externalLink).toHaveAttribute('target', '_blank');
  });

  it('renders github link when provided', () => {
    render(<ProjectCard project={baseProject} />);
    const githubLink = screen.getByText('源码 →');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test/test');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('omits external link when url is not provided', () => {
    const noUrl = { ...baseProject, url: undefined };
    render(<ProjectCard project={noUrl} />);
    expect(screen.queryByText('线上 →')).not.toBeInTheDocument();
  });

  it('omits github link when github is not provided', () => {
    const noGithub = { ...baseProject, github: undefined };
    render(<ProjectCard project={noGithub} />);
    expect(screen.queryByText('源码 →')).not.toBeInTheDocument();
  });

  it('passes priority prop to Image when true', () => {
    render(<ProjectCard project={baseProject} priority />);
    const img = screen.getByAltText('Test Project');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  it('renders as an article element', () => {
    const { container } = render(<ProjectCard project={baseProject} />);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('uses the shared magnetic card surface', () => {
    const { container } = render(<ProjectCard project={baseProject} />);
    expect(
      container.querySelector('article.magnetic-card.card--project'),
    ).toBeInTheDocument();
  });
});
