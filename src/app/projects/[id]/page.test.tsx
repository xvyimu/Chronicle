import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getAllProjects } from '@/lib/projects';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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

vi.mock('next/image', async () => {
  const { default: MockNextImage } = await import('@/test/mocks/next-image');
  return { default: MockNextImage };
});

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import ProjectDetailPage, { generateMetadata } from './page';

describe('ProjectDetailPage', () => {
  it('keeps project media queries global without depending on stylesheet order', () => {
    const projectCss = readFileSync(
      path.join(process.cwd(), 'src/app/styles/project-detail.css'),
      'utf8',
    );
    const globalResponsiveCss = readFileSync(
      path.join(process.cwd(), 'src/app/styles/responsive.css'),
      'utf8',
    );

    expect(projectCss).toContain(
      'font-size: var(--project-detail-title-size, clamp(2.5rem, 6vw, 4.8rem));',
    );
    expect(projectCss).not.toContain('@media');
    expect(globalResponsiveCss).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.project-detail[\s\S]*?--project-detail-title-size:\s*clamp\(2\.2rem, 12vw, 3\.6rem\)/,
    );
    expect(globalResponsiveCss).toMatch(
      /@media \(max-width: 374px\)[\s\S]*?\.project-detail[\s\S]*?--project-detail-title-size:\s*2\.1rem/,
    );
  });

  it('returns metadata for a known project', async () => {
    const project = getAllProjects()[0];
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: project.id }),
    });

    expect(metadata.title).toBe(project.title);
  });

  it('renders project tags as shared badges', async () => {
    const project = getAllProjects()[0];
    const jsx = await ProjectDetailPage({
      params: Promise.resolve({ id: project.id }),
    });
    render(jsx);

    expect(screen.getByRole('heading', { name: project.title })).toBeInTheDocument();
    expect(screen.getByText(project.tags[0])).toHaveAttribute('data-slot', 'badge');
  });
});
