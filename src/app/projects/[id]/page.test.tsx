import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getAllProjects } from '@/lib/projects';

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

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority: _priority, alt = '', ...rest } = props;
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

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import ProjectDetailPage, { generateMetadata } from './page';

describe('ProjectDetailPage', () => {
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
