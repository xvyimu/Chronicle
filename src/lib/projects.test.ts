import { describe, it, expect } from 'vitest';
import { parseProjects, createProjectsRepository } from '@/lib/projects';
import type { ContentSource } from '@/lib/content-source';

function makeJsonSource(data: unknown): ContentSource {
  return {
    readFile: () => JSON.stringify(data),
    readDir: () => ['projects.json'],
    getMtime: () => 1000,
  };
}

function makeMissingSource(): ContentSource {
  return {
    readFile: () => null,
    readDir: () => null,
    getMtime: () => null,
  };
}

describe('parseProjects', () => {
  it('returns empty array for empty input', () => {
    expect(parseProjects([])).toEqual([]);
  });

  it('accepts minimal valid project (no optional fields)', () => {
    const result = parseProjects([
      {
        id: 'test',
        title: 'Test',
        description: 'A test project',
        tags: ['test'],
        featured: false,
        year: 2026,
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test');
    expect(result[0].url).toBeUndefined();
    expect(result[0].github).toBeUndefined();
    expect(result[0].image).toBeUndefined();
  });

  it('transforms empty string url/github to undefined', () => {
    const result = parseProjects([
      {
        id: 'test',
        title: 'Test',
        description: 'A test project',
        tags: ['test'],
        url: '',
        github: '',
        image: '/test.png',
        featured: false,
        year: 2026,
      },
    ]);
    expect(result[0].url).toBeUndefined();
    expect(result[0].github).toBeUndefined();
  });

  it('sorts by year descending', () => {
    const result = parseProjects([
      {
        id: 'a',
        title: 'A',
        description: '',
        tags: [],
        image: '',
        featured: false,
        year: 2024,
      },
      {
        id: 'b',
        title: 'B',
        description: '',
        tags: [],
        image: '',
        featured: false,
        year: 2026,
      },
      {
        id: 'c',
        title: 'C',
        description: '',
        tags: [],
        image: '',
        featured: false,
        year: 2025,
      },
    ]);
    expect(result.map((p) => p.year)).toEqual([2026, 2025, 2024]);
  });

  it('throws ZodError for invalid input', () => {
    expect(() => parseProjects([{ id: 'incomplete' }])).toThrow();
  });

  it('throws on non-array input', () => {
    expect(() => parseProjects('not-an-array')).toThrow();
  });

  it('rejects duplicate project ids', () => {
    expect(() =>
      parseProjects([
        {
          id: 'duplicate',
          title: 'A',
          description: 'A',
          tags: [],
          featured: false,
          year: 2026,
        },
        {
          id: 'duplicate',
          title: 'B',
          description: 'B',
          tags: [],
          featured: false,
          year: 2025,
        },
      ]),
    ).toThrow(/duplicate project id/i);
  });
});

describe('ProjectsRepository', () => {
  it('returns an array of projects', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'p1',
          title: 'P1',
          description: 'd',
          tags: ['t'],
          image: '/p1.png',
          featured: false,
          year: 2026,
        },
      ]),
    );
    const projects = repo.getAll();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBe(1);
  });

  it('each project has required fields', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'p1',
          title: 'P1',
          description: 'd',
          tags: ['t'],
          image: '/p1.png',
          featured: false,
          year: 2026,
        },
      ]),
    );
    for (const p of repo.getAll()) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(Array.isArray(p.tags)).toBe(true);
      expect(typeof p.featured).toBe('boolean');
      expect(typeof p.year).toBe('number');
    }
  });

  it('is sorted by year descending', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'a',
          title: 'A',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2024,
        },
        {
          id: 'b',
          title: 'B',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2026,
        },
        {
          id: 'c',
          title: 'C',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2025,
        },
      ]),
    );
    const projects = repo.getAll();
    for (let i = 1; i < projects.length; i++) {
      expect(projects[i - 1].year).toBeGreaterThanOrEqual(projects[i].year);
    }
  });

  it('returns only featured projects', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'a',
          title: 'A',
          description: '',
          tags: [],
          image: '',
          featured: true,
          year: 2026,
        },
        {
          id: 'b',
          title: 'B',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2025,
        },
      ]),
    );
    const featured = repo.getFeatured();
    expect(featured.every((p) => p.featured)).toBe(true);
    expect(featured).toHaveLength(1);
  });

  it('returns the correct project for a known id', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'nav-site',
          title: 'Nav',
          description: 'd',
          tags: [],
          image: '/nav.png',
          featured: true,
          year: 2026,
        },
      ]),
    );
    const project = repo.getById('nav-site');
    expect(project).not.toBeNull();
    expect(project!.id).toBe('nav-site');
    expect(project!.title).toBeTruthy();
  });

  it('returns null for an unknown id', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'nav-site',
          title: 'Nav',
          description: 'd',
          tags: [],
          image: '/nav.png',
          featured: true,
          year: 2026,
        },
      ]),
    );
    expect(repo.getById('non-existent-project')).toBeNull();
  });

  it('returns an array of all project IDs', () => {
    const repo = createProjectsRepository(
      makeJsonSource([
        {
          id: 'a',
          title: 'A',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2026,
        },
        {
          id: 'b',
          title: 'B',
          description: '',
          tags: [],
          image: '',
          featured: false,
          year: 2025,
        },
      ]),
    );
    const ids = repo.getAllIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(2);
    expect(ids.every((id) => typeof id === 'string')).toBe(true);
  });

  it('returns empty array when file does not exist', () => {
    const repo = createProjectsRepository(makeMissingSource());
    expect(repo.getAll()).toEqual([]);
  });

  it('returns empty array when JSON is invalid', () => {
    const source: ContentSource = {
      readFile: () => 'not-json',
      readDir: () => ['projects.json'],
      getMtime: () => 1000,
    };
    const repo = createProjectsRepository(source);
    expect(repo.getAll()).toEqual([]);
  });
});
