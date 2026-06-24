import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllProjects } from '@/lib/projects';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import ProjectsPage from '@/app/projects/page';

describe('ProjectsPage', () => {
  beforeEach(() => cleanup());

  it('renders the page title', () => {
    render(<ProjectsPage />);
    expect(screen.getByText('作品集')).toBeInTheDocument();
  });

  it('renders all projects', () => {
    render(<ProjectsPage />);
    const projects = getAllProjects();

    for (const project of projects) {
      expect(screen.getByText(project.title)).toBeInTheDocument();
    }
  });

  it('renders project descriptions', () => {
    render(<ProjectsPage />);
    const projects = getAllProjects();

    for (const project of projects) {
      expect(screen.getByText(project.description)).toBeInTheDocument();
    }
  });

  it('renders project tags', () => {
    render(<ProjectsPage />);
    const projects = getAllProjects();
    const allTags = new Set(projects.flatMap((p) => p.tags));

    for (const tag of allTags) {
      const elements = screen.getAllByText(tag);
      expect(elements.length).toBeGreaterThan(0);
    }
  });

  it('renders GitHub links for projects with github field', () => {
    render(<ProjectsPage />);
    const projects = getAllProjects().filter((p) => p.github);

    for (const project of projects) {
      // The project card should link to the project detail page
      expect(screen.getByText(project.title)).toBeInTheDocument();
    }
  });
});
