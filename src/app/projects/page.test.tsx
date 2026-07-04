import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllProjects } from '@/lib/projects';

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
      expect(elements[0]).toHaveAttribute('data-slot', 'badge');
    }
  });

  it('renders GitHub links with correct href for projects with github field', () => {
    render(<ProjectsPage />);
    const projects = getAllProjects().filter((p) => p.github);

    // Ensure there is at least one project with a github field
    expect(projects.length).toBeGreaterThan(0);

    for (const project of projects) {
      // Find the anchor element whose href contains the project's github URL
      const githubLink = document.querySelector<HTMLAnchorElement>(
        `a[href*="${project.github}"]`,
      );
      expect(githubLink).not.toBeNull();
      expect(githubLink!.getAttribute('href')).toContain(project.github);
    }
  });
});
