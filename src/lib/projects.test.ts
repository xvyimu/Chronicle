import { describe, it, expect } from 'vitest';
import {
  getAllProjects,
  getFeaturedProjects,
  getProjectById,
  getAllProjectIds,
  parseProjects,
} from '@/lib/projects';

describe('getAllProjects', () => {
  it('returns an array of projects', () => {
    const projects = getAllProjects();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('each project has required fields', () => {
    const projects = getAllProjects();
    for (const p of projects) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(Array.isArray(p.tags)).toBe(true);
      expect(p.image).toBeTruthy();
      expect(typeof p.featured).toBe('boolean');
      expect(typeof p.year).toBe('number');
    }
  });

  it('is sorted by year descending', () => {
    const projects = getAllProjects();
    for (let i = 1; i < projects.length; i++) {
      expect(projects[i - 1].year).toBeGreaterThanOrEqual(projects[i].year);
    }
  });
});

describe('getFeaturedProjects', () => {
  it('returns only featured projects', () => {
    const featured = getFeaturedProjects();
    expect(featured.every((p) => p.featured)).toBe(true);
  });
});

describe('getProjectById', () => {
  it('returns the correct project for a known id', () => {
    const project = getProjectById('nav-site');
    expect(project).not.toBeNull();
    expect(project!.id).toBe('nav-site');
    expect(project!.title).toBeTruthy();
  });

  it('returns null for an unknown id', () => {
    expect(getProjectById('non-existent-project')).toBeNull();
  });
});

describe('getAllProjectIds', () => {
  it('returns an array of all project IDs', () => {
    const ids = getAllProjectIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => typeof id === 'string')).toBe(true);
  });
});

describe('parseProjects', () => {
  it('returns empty array for empty input', () => {
    expect(parseProjects([])).toEqual([]);
  });

  it('accepts minimal valid project (no optional fields)', () => {
    const result = parseProjects([{
      id: 'test',
      title: 'Test',
      description: 'A test project',
      tags: ['test'],
      featured: false,
      year: 2026,
    }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test');
    expect(result[0].url).toBeUndefined();
    expect(result[0].github).toBeUndefined();
    expect(result[0].image).toBeUndefined();
  });

  it('transforms empty string url/github to undefined', () => {
    const result = parseProjects([{
      id: 'test',
      title: 'Test',
      description: 'A test project',
      tags: ['test'],
      url: '',
      github: '',
      image: '/test.png',
      featured: false,
      year: 2026,
    }]);
    expect(result[0].url).toBeUndefined();
    expect(result[0].github).toBeUndefined();
  });

  it('sorts by year descending', () => {
    const result = parseProjects([
      { id: 'a', title: 'A', description: '', tags: [], image: '', featured: false, year: 2024 },
      { id: 'b', title: 'B', description: '', tags: [], image: '', featured: false, year: 2026 },
      { id: 'c', title: 'C', description: '', tags: [], image: '', featured: false, year: 2025 },
    ]);
    expect(result.map((p) => p.year)).toEqual([2026, 2025, 2024]);
  });

  it('throws ZodError for invalid input', () => {
    expect(() => parseProjects([{ id: 'incomplete' }])).toThrow();
  });

  it('throws on non-array input', () => {
    expect(() => parseProjects('not-an-array')).toThrow();
  });
});